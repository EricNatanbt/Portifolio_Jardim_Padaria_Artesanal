const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    console.log('🔍 GET-PRODUCTS chamada - Início');
    console.log('📊 Headers:', event.headers);
    console.log('📡 Query params:', event.queryStringParameters);
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        console.log('🛬 Requisição OPTIONS (preflight)');
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        console.log(`❌ Método não permitido: ${event.httpMethod}`);
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Método não permitido. Use GET.' 
            })
        };
    }

    try {
        console.log('📦 Buscando produtos do Supabase...');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        console.log('🔑 SUPABASE_URL:', supabaseUrl ? 'Configurado' : 'NÃO CONFIGURADO');
        console.log('🔐 SUPABASE_KEY:', supabaseKey ? 'Configurado' : 'NÃO CONFIGURADO');
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Credenciais do Supabase faltando');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Supabase não configurado',
                    error: 'Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY não encontradas'
                })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Cliente Supabase criado');

        // Busca todos os produtos
// Busca todos os produtos
console.log('🔍 Executando query no Supabase...');
const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

if (error) {
    console.error('❌ Erro do Supabase:', error);
    return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
            success: false, 
            message: 'Erro ao buscar produtos do banco de dados',
            error: error.message,
            details: error
        })
    };
}

console.log(`✅ ${products?.length || 0} produtos encontrados`);

// Formata os produtos para o formato esperado pelo frontend
const formattedProducts = (products || []).map(product => ({
    id: product.id,
    nome: product.name || product.nome || 'Produto sem nome',
    descricao: product.description || product.descricao || '',
    preco: product.price || product.preco || 0,
    categoria: product.category || product.categoria || 'Geral',
    imagem: product.image_url || product.imagem || '/img/logos/Logo.png',
    // NOVO: Dias disponíveis - converte de array PostgreSQL para array JavaScript
    dias_disponiveis: product.available_days || product.dias_disponiveis || []
}));

        const response = {
            success: true,
            products: formattedProducts,
            count: formattedProducts.length,
            timestamp: new Date().toISOString()
        };

        console.log('📤 Enviando resposta:', JSON.stringify(response).substring(0, 200) + '...');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('❌ Erro no get-products:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Erro interno ao buscar produtos',
                error: error.message,
                stack: process.env.NETLIFY_DEV ? error.stack : undefined
            })
        };
    }
};