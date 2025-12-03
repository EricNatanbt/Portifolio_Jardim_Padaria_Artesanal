const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (variáveis de ambiente)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // Apenas aceita requisições GET
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
        };
    }

    // Pega o ID do pedido dos parâmetros da query
    const orderId = event.queryStringParameters.id;

    if (!orderId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Order ID is required' }),
        };
    }

    try {
        // 1. Busca o pedido na tabela 'orders'
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (orderError && orderError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Supabase Order Error:', orderError);
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: 'Error fetching order details' }),
            };
        }

        if (!order) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Order not found' }),
            };
        }

        // 2. Busca os itens do pedido na tabela 'order_items'
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id); // Assume que 'order_id' na tabela 'order_items' referencia o 'id' da tabela 'orders'

        if (itemsError) {
            console.error('Supabase Order Items Error:', itemsError);
            // Continua, mas com um aviso, pois o pedido principal foi encontrado
        }

        // 3. Busca os dados do cliente na tabela 'clients'
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', order.client_id)
            .single();

        if (clientError && clientError.code !== 'PGRST116') {
            console.error('Supabase Client Error:', clientError);
            // Continua, mas com um aviso, pois o pedido principal foi encontrado
        }

        // Estrutura a resposta para o frontend
        const responseData = {
            success: true,
            orderData: {
                customer: client || {},
                order: order,
                items: items || []
            }
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        console.error('Internal Server Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
        };
    }
};
