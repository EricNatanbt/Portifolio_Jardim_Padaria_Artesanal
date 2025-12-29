const { createClient } = require('@supabase/supabase-js');

const getSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    return createClient(supabaseUrl, supabaseKey);
};

exports.handler = async (event) => {
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
            body: JSON.stringify({ success: false, message: 'Método não permitido' }) 
        };
    }

    try {
        const supabase = getSupabase();
        const body = JSON.parse(event.body);
        const { id, nome, descricao, preco, categoria, dias_disponiveis, imagem } = body;

        if (!id) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ success: false, message: 'ID do produto é obrigatório' }) 
            };
        }

        const { data, error } = await supabase
            .from('products')
            .update({ 
                name: nome, 
                description: descricao, 
                price: preco, 
                category: categoria, 
                available_days: dias_disponiveis,
                image_url: imagem // Atualizando a URL da imagem
            })
            .eq('id', id);

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Produto atualizado com sucesso!', data })
        };

    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ success: false, message: err.message }) 
        };
    }
};
