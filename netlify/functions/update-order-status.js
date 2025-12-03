const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Método não permitido' 
            })
        };
    }

    // Configuração do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials missing');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Supabase não configurado' 
            })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { orderId, status } = body;
        
        console.log(`🔄 Atualizando status do pedido ${orderId} para ${status}`);
        
        if (!orderId || !status) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'ID do pedido e status são obrigatórios' 
                })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Primeiro busca o pedido pelo order_id
        const { data: existingOrder, error: findError } = await supabase
            .from('orders')
            .select('id')
            .eq('order_id', orderId)
            .single();

        if (findError) {
            console.error('❌ Pedido não encontrado:', findError);
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Pedido não encontrado',
                    error: findError.message 
                })
            };
        }

        // Atualiza o status do pedido
        const { data, error } = await supabase
            .from('orders')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingOrder.id);

        if (error) {
            console.error('❌ Erro ao atualizar status:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Erro ao atualizar status',
                    error: error.message 
                })
            };
        }

        console.log(`✅ Status do pedido ${orderId} atualizado para ${status}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Status atualizado com sucesso',
                orderId: orderId,
                newStatus: status
            })
        };

    } catch (error) {
        console.error('❌ Erro no update-order-status:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro interno ao atualizar status',
                error: error.message 
            })
        };
    }
};