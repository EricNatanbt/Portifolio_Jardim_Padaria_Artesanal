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
        const productData = JSON.parse(event.body);
        console.log('📝 Dados recebidos para atualizar produto:', productData);
        
        if (!productData.id) {
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

        const { data, error } = await supabase
            .from('products')
            .update({
                name: productData.nome,
                description: productData.descricao || '',
                price: productData.preco,
                category: productData.categoria || 'Geral',
                image_url: productData.imagem || '',
                available_days: productData.dias_disponiveis || []
            })
            .eq('id', productData.id)
            .select()
            .single();

        if (error) {
            console.error('❌ Erro do Supabase ao atualizar produto:', error);
            throw error;
        }

        console.log('✅ Produto atualizado com sucesso:', data);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                product: data,
                message: 'Produto atualizado com sucesso'
            })
        };

    } catch (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro ao atualizar produto',
                error: error.message 
            })
        };
    }
};