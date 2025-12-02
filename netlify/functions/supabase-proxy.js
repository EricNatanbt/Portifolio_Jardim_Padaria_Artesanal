// netlify/functions/supabase-proxy.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Configura CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
    // Inicializa cliente Supabase com Service Role (seguro)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrai dados da requisição
    const { httpMethod, body, path } = event;
    const route = path.replace('/.netlify/functions/supabase-proxy', '') || '/';
    
    // Parse do body
    const requestData = body ? JSON.parse(body) : {};

    console.log(`📡 ${httpMethod} ${route}`, requestData);

    // Roteamento das requisições
    if (route === '/save-order' && httpMethod === 'POST') {
      return await handleSaveOrder(supabase, requestData, headers);
    }
    
    if (route === '/save-client' && httpMethod === 'POST') {
      return await handleSaveClient(supabase, requestData, headers);
    }
    
    if (route.startsWith('/get-client') && httpMethod === 'GET') {
      const phone = event.queryStringParameters?.phone;
      return await handleGetClient(supabase, phone, headers);
    }
    
    if (route === '/get-products' && httpMethod === 'GET') {
      return await handleGetProducts(supabase, headers);
    }

    // Adicione esta rota
if (route === '/test-schema' && httpMethod === 'GET') {
  return await handleTestSchema(supabase, headers);
}

// E esta função
async function handleTestSchema(supabase, headers) {
  try {
    // Testa tabela clients
    const { data: clientsColumns } = await supabase
      .rpc('get_table_columns', { table_name: 'clients' });
    
    // Testa tabela orders
    const { data: ordersColumns } = await supabase
      .rpc('get_table_columns', { table_name: 'orders' });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clients: clientsColumns || 'Não foi possível obter colunas',
        orders: ordersColumns || 'Não foi possível obter colunas'
      })
    };
  } catch (error) {
    // Método alternativo
    try {
      // Tenta uma consulta simples para ver estrutura
      const { data: sampleClient } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .single();
      
      const { data: sampleOrder } = await supabase
        .from('orders')
        .select('*')
        .limit(1)
        .single();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          clients_sample: sampleClient ? Object.keys(sampleClient) : 'Tabela vazia',
          orders_sample: sampleOrder ? Object.keys(sampleOrder) : 'Tabela vazia'
        })
      };
    } catch (e) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Não foi possível verificar schema',
          message: e.message
        })
      };
    }
  }
}

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('❌ Error in Supabase proxy:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

// ============================================
// HANDLERS ESPECÍFICOS
// ============================================

async function handleSaveOrder(supabase, data, headers) {
  try {
    const { client, order, items } = data;
    
    // 1. Salva/Atualiza cliente
    let clientId = client.id;
    
    if (!clientId && client.phone) {
      const { data: existingClient, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', client.phone.replace(/\D/g, ''))
        .maybeSingle();
      
      if (!clientError && existingClient) {
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
            phone: client.phone.replace(/\D/g, ''),
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
    }
    
    // 2. Salva pedido
    const orderData = {
      client_id: clientId,
      total_amount: order.total,
      status: 'pendente',
      client_name: client.name,
      client_phone: client.phone,
      payment_method: order.paymentMethod,
      delivery_option: order.deliveryOption,
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
        quantity: item.quantity,
        unit_price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
    }
    
    // 4. Atualiza estatísticas do cliente via RPC
    await supabase.rpc('increment_client_total', {
      client_id: clientId,
      amount: order.total
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: savedOrder.id,
        clientId: clientId,
        total: savedOrder.total_amount
      })
    };
    
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}

async function handleSaveClient(supabase, data, headers) {
  try {
    const { data: savedClient, error } = await supabase
      .from('clients')
      .upsert(data, { onConflict: 'phone' })
      .select('id, total_spent, total_orders')
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
    console.error('Error saving client:', error);
    throw error;
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
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone.replace(/\D/g, ''))
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
    console.error('Error getting client:', error);
    throw error;
  }
}

async function handleGetProducts(supabase, headers) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category');
    
    if (error) throw error;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        products: data
      })
    };
    
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}