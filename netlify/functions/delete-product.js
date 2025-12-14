const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
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

    try {
        const { id } = JSON.parse(event.body);
        console.log('🗑️ Excluindo produto ID:', id);
        
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'ID do produto é obrigatório' 
                })
            };
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Credenciais do Supabase faltando');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Supabase não configurado' 
                })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Primeiro verifica se o produto existe
        const { data: existingProduct, error: checkError } = await supabase
            .from('products')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existingProduct) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Produto não encontrado' 
                })
            };
        }

        // Exclui o produto
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Erro do Supabase ao excluir produto:', error);
            throw error;
        }

        console.log('✅ Produto excluído com sucesso');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: 'Produto excluído com sucesso'
            })
        };

    } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro ao excluir produto',
                error: error.message 
            })
        };
    }
};