// netlify/functions/supabase-proxy.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Configura CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Verifica credenciais
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Verificando variáveis de ambiente...');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Ausente');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Configurada' : '❌ Ausente');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Supabase credentials not configured',
          message: 'Check environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        })
      };
    }

    // Inicializa cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrai dados da requisição
    const { httpMethod, body, path } = event;
    const route = path.replace('/.netlify/functions/supabase-proxy', '') || '/';
    
    console.log(`📡 ${httpMethod} ${route}`);

    // Parse do body se existir
    let requestData = {};
    if (body && httpMethod !== 'GET') {
      try {
        requestData = JSON.parse(body);
      } catch (e) {
        console.warn('⚠️ Não foi possível parsear o body:', e.message);
      }
    }

    // Health check
    if (route === '/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          functions: ['get-products', 'save-order', 'save-client', 'get-client', 'get-order', 'update-order-status', 'health']
        })
      };
    }
    
    // Roteamento das requisições
    if (route === '/save-order' && httpMethod === 'POST') {
      return await handleSaveOrder(supabase, requestData, headers);
    }
    
    if (route === '/save-client' && httpMethod === 'POST') {
      return await handleSaveClient(supabase, requestData, headers);
    }
    
    if (route === '/get-client' && httpMethod === 'GET') {
      const phone = event.queryStringParameters?.phone;
      return await handleGetClient(supabase, phone, headers);
    }
    
    if (route === '/get-order' && httpMethod === 'GET') {
      const orderId = event.queryStringParameters?.id;
      return await handleGetOrder(supabase, orderId, headers);
    }
    
    if (route === '/get-products' && httpMethod === 'GET') {
      return await handleGetProducts(supabase, headers);
    }

    if (route === '/update-order-status' && httpMethod === 'POST') {
      return await handleUpdateOrderStatus(supabase, requestData, headers);
    }

    // Rota não encontrada
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'Route not found',
        path: route,
        method: httpMethod 
      })
    };

  } catch (error) {
    console.error('❌ Error in Supabase proxy:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// ============================================
// HANDLERS ESPECÍFICOS
// ============================================

async function handleSaveOrder(supabase, data, headers) {
  try {
    console.log('📦 Salvando pedido...');
    
    const { client, order, items } = data;
    
    if (!client || !client.phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Client phone is required',
          receivedData: data 
        })
      };
    }

    console.log('👤 Dados do cliente:', {
      name: client.name,
      phone: client.phone,
      deliveryOption: client.deliveryOption || order?.deliveryOption
    });

    // 1. Salva/Atualiza cliente
    const cleanPhone = client.phone.replace(/\D/g, '');
    let clientId = null;

    // Verifica se cliente já existe
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (clientError) {
      console.error('❌ Erro ao buscar cliente:', clientError);
      throw clientError;
    }

    if (existingClient) {
      clientId = existingClient.id;
      
      console.log(`🔄 Atualizando cliente existente: ${clientId}`);
      
      // Atualiza dados do cliente
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          full_name: client.name || existingClient.full_name,
          address: client.address || existingClient.address,
          cep: client.cep || existingClient.cep,
          last_order_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) throw updateError;
    } else {
      console.log('👤 Criando novo cliente...');
      
      // Cria novo cliente
      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert([{
          phone: cleanPhone,
          full_name: client.name || '',
          address: client.address || '',
          cep: client.cep || '',
          street: client.street || '',
          address_number: client.number || client.address_number || '',
          neighborhood: client.neighborhood || '',
          city_state: client.city || client.city_state || '',
          complement: client.complement || '',
          last_order_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (newClientError) {
        console.error('❌ Erro ao criar cliente:', newClientError);
        throw newClientError;
      }
      
      clientId = newClient.id;
      console.log(`✅ Novo cliente criado: ${clientId}`);
    }

    // 2. Salva pedido
    const orderData = {
      client_id: clientId,
      total_amount: order?.total || 0,
      subtotal: order?.subtotal || 0,
      status: 'pendente',
      client_name: client.name || '',
      client_phone: cleanPhone,
      payment_method: order?.paymentMethod || client.paymentMethod || 'pix',
      delivery_option: order?.deliveryOption || client.deliveryOption || 'retirada',
      delivery_address: (order?.deliveryOption || client.deliveryOption) === 'entrega' ? client.address : null,
      delivery_fee: order?.deliveryFee || 0,
      client_cep: client.cep || '',
      client_street: client.street || '',
      client_number: client.number || client.address_number || '',
      client_neighborhood: client.neighborhood || '',
      client_city_state: client.city || client.city_state || '',
      client_complement: client.complement || '',
      observation: client.observation || '',
      created_at: new Date().toISOString()
    };

    console.log('📝 Dados do pedido para salvar:', orderData);

    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select('id, total_amount, client_name')
      .single();

    if (orderError) {
      console.error('❌ Erro ao salvar pedido:', orderError);
      throw orderError;
    }

    console.log(`✅ Pedido salvo: ${savedOrder.id}`);

    // 3. Salva itens do pedido
    if (items && items.length > 0) {
      console.log(`🛒 Salvando ${items.length} itens...`);
      
      const itemsToInsert = items.map(item => ({
        order_id: savedOrder.id,
        product_id: item.id || null,
        product_name: item.name || 'Produto',
        quantity: item.quantity || 1,
        unit_price: item.price || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('❌ Erro ao salvar itens:', itemsError);
        // Continua mesmo com erro nos itens
      } else {
        console.log(`✅ ${itemsToInsert.length} itens salvos`);
      }
    }

    // 4. Atualiza estatísticas do cliente
    try {
      await supabase
        .from('clients')
        .update({
          total_orders: supabase.rpc('increment', { 
            x: 1, 
            column_name: 'total_orders',
            row_id: clientId 
          }),
          total_spent: supabase.rpc('increment', {
            x: order?.total || 0,
            column_name: 'total_spent',
            row_id: clientId
          })
        })
        .eq('id', clientId);
        
      console.log('📊 Estatísticas do cliente atualizadas');
    } catch (statsError) {
      console.warn('⚠️ Não foi possível atualizar estatísticas:', statsError.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: savedOrder.id,
        clientId: clientId,
        total: savedOrder.total_amount,
        message: 'Pedido salvo com sucesso'
      })
    };

  } catch (error) {
    console.error('❌ Error saving order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error saving order',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}

async function handleSaveClient(supabase, data, headers) {
  try {
    console.log('👤 Salvando cliente:', data);
    
    const { data: savedClient, error } = await supabase
      .from('clients')
      .upsert(data, { onConflict: 'phone' })
      .select('id, phone, full_name, total_spent, total_orders')
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        client: savedClient
      })
    };

  } catch (error) {
    console.error('❌ Error saving client:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error saving client',
        message: error.message
      })
    };
  }
}

async function handleGetClient(supabase, phone, headers) {
  try {
    if (!phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number required' })
      };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        client: data
      })
    };

  } catch (error) {
    console.error('❌ Error getting client:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error getting client',
        message: error.message
      })
    };
  }
}

async function handleGetOrder(supabase, orderId, headers) {
  try {
    if (!orderId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Order ID required' })
      };
    }

    console.log(`🔍 Buscando pedido: ${orderId}`);
    
    // Busca pedido principal
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ Erro ao buscar pedido:', orderError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Order not found',
          message: orderError.message 
        })
      };
    }

    // Busca itens do pedido
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('❌ Erro ao buscar itens:', itemsError);
    }

    // Formata resposta
    const responseData = {
      success: true,
      order: {
        id: order.id,
        orderId: order.id,
        total: order.total_amount,
        subtotal: order.subtotal || order.total_amount - (order.delivery_fee || 0),
        deliveryFee: order.delivery_fee || 0,
        status: order.status || 'pendente',
        paymentMethod: order.payment_method,
        deliveryOption: order.delivery_option,
        timestamp: order.created_at,
        observation: order.observation
      },
      customer: {
        name: order.client_name || order.clients?.full_name || '',
        phone: order.client_phone || order.clients?.phone || '',
        address: order.delivery_address || order.clients?.address || '',
        cep: order.client_cep || order.clients?.cep || '',
        street: order.client_street || order.clients?.street || '',
        number: order.client_number || order.clients?.address_number || '',
        neighborhood: order.client_neighborhood || order.clients?.neighborhood || '',
        city: order.client_city_state || order.clients?.city_state || '',
        complement: order.client_complement || order.clients?.complement || ''
      },
      items: (items || []).map(item => ({
        name: item.product_name || 'Produto',
        price: item.unit_price || 0,
        quantity: item.quantity || 1,
        id: item.product_id
      }))
    };

    console.log(`✅ Pedido encontrado: ${responseData.customer.name}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ Error getting order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}

async function handleGetProducts(supabase, headers) {
  try {
    console.log('📦 Buscando produtos...');
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} produtos encontrados`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        products: data || [],
        count: data?.length || 0
      })
    };

  } catch (error) {
    console.error('❌ Error getting products:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error getting products',
        message: error.message,
        products: [] // Retorna array vazio como fallback
      })
    };
  }
}

async function handleUpdateOrderStatus(supabase, data, headers) {
  try {
    const { orderId, status } = data;
    
    if (!orderId || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Order ID and status required' })
      };
    }

    console.log(`🔄 Atualizando pedido ${orderId} para status: ${status}`);
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Status atualizado com sucesso'
      })
    };

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}