const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Método não permitido' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { id, nome, descricao, preco, categoria, dias_disponiveis } = body;

        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'ID do produto é obrigatório' }) };
        }

        const { data, error } = await supabase
            .from('products')
            .update({ 
                name: nome, 
                description: descricao, 
                price: preco, 
                category: categoria, 
                available_days: dias_disponiveis 
            })
            .eq('id', id);

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Produto atualizado com sucesso', data })
        };

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};
