// netlify/functions/save-order.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Configura CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verifica credenciais
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'Supabase credentials not configured'
        })
      };
    }

    // Inicializa cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse dos dados da requisição
    const data = JSON.parse(event.body);
    console.log('📝 Dados recebidos no save-order:', JSON.stringify(data, null, 2));

    const { client, order, items } = data;
    
    if (!client || !client.phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad request',
          message: 'Client data with phone is required'
        })
      };
    }

    // Mapeia nomes de campos
    const deliveryOption = client.deliveryOption || client.delivery_option || 'entrega';
    const paymentMethod = client.paymentMethod || client.payment_method || 'pix';
    
    // PASSO 1: Salvar/Atualizar cliente
    const cleanPhone = client.phone.replace(/\D/g, '');
    
    // Prepara dados do cliente
    const clientData = {
      phone: cleanPhone,
      full_name: client.name || '',
      address: client.address || '',
      cep: client.cep ? client.cep.replace(/\D/g, '') : '',
      last_order_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Tenta adicionar colunas de endereço
    try {
      if (client.street) clientData.street = client.street;
      if (client.number || client.address_number) clientData.address_number = client.number || client.address_number;
      if (client.neighborhood) clientData.neighborhood = client.neighborhood;
      if (client.city || client.city_state) clientData.city_state = client.city || client.city_state;
      if (client.complement) clientData.complement = client.complement;
    } catch (e) {
      console.log('⚠️ Algumas colunas extras não puderam ser adicionadas:', e.message);
    }

    console.log('👤 Dados do cliente para salvar:', clientData);

    // Verifica se cliente já existe
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, total_orders, total_spent')
      .eq('phone', cleanPhone)
      .maybeSingle();

    let clientId;
    let currentOrders = 0;
    let currentSpent = 0;

    if (existingClient) {
      // Atualiza cliente existente
      clientId = existingClient.id;
      currentOrders = existingClient.total_orders || 0;
      currentSpent = existingClient.total_spent || 0;
      
      const { error: updateError } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId);

      if (updateError) throw updateError;
      console.log(`✅ Cliente atualizado: ${clientId}`);
    } else {
      // Cria novo cliente
      clientData.created_at = new Date().toISOString();
      clientData.total_orders = 0;
      clientData.total_spent = 0;
      
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select('id')
        .single();

      if (insertError) throw insertError;
      clientId = newClient.id;
      console.log(`✅ Novo cliente criado: ${clientId}`);
    }

    // PASSO 2: Salvar pedido
    const orderData = {
      client_id: clientId,
      total_amount: order.total || 0,
      status: 'pendente',
      client_name: client.name || '',
      client_phone: cleanPhone,
      delivery_address: client.address || '',
      client_cep: client.cep ? client.cep.replace(/\D/g, '') : '',
      observation: client.observation || '',
      payment_method: paymentMethod,
      delivery_option: deliveryOption,
      delivery_fee: order.deliveryFee || 0,
      created_at: new Date().toISOString()
    };

    // Tenta adicionar campos individuais de endereço
    try {
      if (order.total !== undefined) orderData.subtotal = (order.total || 0) - (order.deliveryFee || 0);
      
      if (client.street) orderData.client_street = client.street;
      if (client.number || client.address_number) orderData.client_number = client.number || client.address_number;
      if (client.neighborhood) orderData.client_neighborhood = client.neighborhood;
      if (client.city || client.city_state) orderData.client_city_state = client.city || client.city_state;
      if (client.complement) orderData.client_complement = client.complement;
    } catch (e) {
      console.log('⚠️ Algumas colunas extras do pedido não puderam ser adicionadas:', e.message);
    }

    console.log('📦 Dados do pedido para salvar:', orderData);

    // Salva o pedido
    let savedOrder;
    
    // Gera um ID de pedido curto (ex: JD-XXXXXX)
    const shortId = 'JD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    orderData.order_id = shortId; // Adiciona o order_id curto

    const result = await supabase
      .from('orders')
      .insert([orderData])
      .select('id, order_id, total_amount, client_name') // Adicionar order_id
      .single();
    
    if (result.error) {
      console.error('❌ Erro ao salvar pedido:', result.error);
      throw result.error;
    }
    
    savedOrder = result.data;
    console.log('✅ Pedido salvo:', savedOrder.id);

    // PASSO 3: Salvar itens do pedido COM NOMES DOS PRODUTOS
    if (items && items.length > 0) {
      console.log('🔍 Buscando nomes dos produtos...');
      
      // Extrai todos os IDs dos produtos
      const productIds = items.map(item => item.id).filter(id => id);
      
      if (productIds.length > 0) {
        // Busca os nomes dos produtos na tabela products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);
        
        if (productsError) {
          console.error('❌ Erro ao buscar produtos:', productsError);
        }
        
        // Cria um mapa de ID -> Nome para fácil acesso
        const productNameMap = {};
        if (products) {
          products.forEach(product => {
            productNameMap[product.id] = product.name;
          });
          console.log('🗺️ Mapa de nomes dos produtos:', productNameMap);
        }
        
        // Prepara itens para inserção COM NOMES
        const itemsToInsert = items.map(item => {
          const itemData = {
            order_id: savedOrder.id,
            product_id: item.id || null,
            quantity: item.quantity || 1,
            unit_price: item.price || 0
          };
          
          // Adiciona o nome do produto se encontrado
          if (item.id && productNameMap[item.id]) {
            itemData.product_name = productNameMap[item.id];
          } else {
            // Usa o nome enviado pelo frontend como fallback
            itemData.product_name = item.name || 'Produto não identificado';
          }
          
          return itemData;
        });

        console.log('🛒 Itens para salvar (com nomes):', itemsToInsert);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('❌ Erro ao salvar itens:', itemsError);
          
          // Tenta novamente sem product_name se falhar
          console.log('🔄 Tentando salvar itens sem product_name...');
          
          const itemsWithoutName = items.map(item => ({
            order_id: savedOrder.id,
            product_id: item.id || null,
            quantity: item.quantity || 1,
            unit_price: item.price || 0
          }));
          
          const { error: retryError } = await supabase
            .from('order_items')
            .insert(itemsWithoutName);
            
          if (retryError) {
            console.error('❌ Erro mesmo sem product_name:', retryError);
          } else {
            console.log(`✅ ${itemsWithoutName.length} itens salvos (sem nomes)`);
          }
        } else {
          console.log(`✅ ${itemsToInsert.length} itens salvos (com nomes)`);
        }
      } else {
        console.log('⚠️ Nenhum ID de produto válido encontrado nos itens');
      }
    }

    // PASSO 4: Atualizar estatísticas do cliente
    try {
      await supabase
        .from('clients')
        .update({
          total_orders: currentOrders + 1,
          total_spent: currentSpent + (order.total || 0),
          last_order_date: new Date().toISOString()
        })
        .eq('id', clientId);
      console.log('📊 Estatísticas do cliente atualizadas');
    } catch (rpcError) {
      console.warn('⚠️ Não foi possível atualizar estatísticas:', rpcError.message);
    }

    // PASSO 5: Gerar link de detalhamento do pedido
    const orderDetailLink = `/o.html?id=${savedOrder.order_id}`; // Usando o order_id gerado

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: savedOrder.order_id, // Retornar o order_id
        clientId: clientId,
        total: savedOrder.total_amount,
        message: 'Pedido salvo com sucesso',
        orderDetailLink: orderDetailLink // Novo campo com o link
      })
    };

  } catch (error) {
    console.error('❌ Erro na função save-order:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};