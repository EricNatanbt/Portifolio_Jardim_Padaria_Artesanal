const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    try {
        const body = JSON.parse(event.body);

        // Mapear nomes do frontend para os campos do banco
        const name = body.nome;
        const description = body.descricao;
        const price = body.preco;
        const category = body.categoria;
        const available_days = body.dias_disponiveis || []; // aceita vazio

        if (!name || !description || !price || !category) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Campos obrigatórios não preenchidos' })
            };
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{
                name,
                description,
                price,
                category,
                available_days
            }])
            .select();

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, product: data[0] })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: err.message })
        };
    }
};
