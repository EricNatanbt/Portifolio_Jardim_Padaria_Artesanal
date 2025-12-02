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

    // Health check
    if (route === '/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          functions: ['get-products', 'save-order', 'save-client', 'get-client', 'health']
        })
      };
    }
    
    // Roteamento das requisições
    if (route === '/save-order' && httpMethod === 'POST') {
      const requestData = body ? JSON.parse(body) : {};
      return await handleSaveOrder(supabase, requestData, headers);
    }
    
    if (route === '/save-client' && httpMethod === 'POST') {
      const requestData = body ? JSON.parse(body) : {};
      return await handleSaveClient(supabase, requestData, headers);
    }
    
    if (route === '/get-client' && httpMethod === 'GET') {
      const phone = event.queryStringParameters?.phone;
      return await handleGetClient(supabase, phone, headers);
    }
    
    if (route === '/get-products' && httpMethod === 'GET') {
      return await handleGetProducts(supabase, headers);
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
    console.log('📦 Salvando pedido:', data);
    
    const { client, order, items } = data;
    
    if (!client || !client.phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Client phone is required' })
      };
    }

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
      
      // Atualiza dados do cliente
      await supabase
        .from('clients')
        .update({
          full_name: client.name,
          address: client.address,
          cep: client.cep,
          last_order_date: new Date().toISOString()
        })
        .eq('id', clientId);
    } else {
      // Cria novo cliente
      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert([{
          phone: cleanPhone,
          full_name: client.name,
          address: client.address,
          cep: client.cep,
          last_order_date: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (newClientError) throw newClientError;
      clientId = newClient.id;
    }

    // 2. Salva pedido
    const orderData = {
      client_id: clientId,
      total_amount: order.total || 0,
      status: 'pendente',
      client_name: client.name,
      client_phone: cleanPhone,
      payment_method: order.paymentMethod || 'pix',
      delivery_option: order.deliveryOption || 'entrega',
      delivery_address: order.deliveryOption === 'entrega' ? client.address : null,
      delivery_fee: order.deliveryFee || 0,
      client_cep: client.cep,
      observation: client.observation,
      created_at: new Date().toISOString()
    };

    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select('id, total_amount')
      .single();

    if (orderError) throw orderError;

    // 3. Salva itens do pedido
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        order_id: savedOrder.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity || 1,
        unit_price: item.price || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('❌ Erro ao salvar itens:', itemsError);
        // Continua mesmo com erro nos itens
      }
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
        error: 'Error saving order',
        message: error.message
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