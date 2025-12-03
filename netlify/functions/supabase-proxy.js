// netlify/functions/supabase-proxy.js

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - SEM FALLBACK MOCK
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Verifica se as variáveis estão configuradas
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
    console.error('Configure no Netlify: SUPABASE_URL e SUPABASE_SERVICE_KEY');
    console.error('Para desenvolvimento local, crie um arquivo .env na raiz do projeto:');
    console.error('SUPABASE_URL=https://seu-projeto.supabase.co');
    console.error('SUPABASE_SERVICE_KEY=sua_service_key_aqui');
    
    // Lança erro imediatamente para forçar configuração
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY devem ser configuradas');
}

console.log('🔗 Conectando ao Supabase:', supabaseUrl.substring(0, 30) + '...');

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// Testa a conexão imediatamente
(async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Falha na conexão com Supabase:', error.message);
        } else {
            console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        }
    } catch (err) {
        console.error('❌ Erro ao testar conexão:', err.message);
    }
})();

exports.handler = async (event, context) => {
    console.log(`🌐 ${event.httpMethod} ${event.path}`);
    
    // Configura CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Trata requisições OPTIONS (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Roteamento baseado no path
        const path = event.path.replace('/.netlify/functions/supabase-proxy', '');
        
        console.log(`📍 Processando rota: ${path}`);

        switch(true) {
            case path === '/health':
                return await handleHealthCheck(event, headers);
                
            case path === '/get-products':
                return await handleGetProducts(event, headers);
                
            case path === '/save-order':
                return await handleSaveOrder(event, headers);
                
            case path === '/save-client':
                return await handleSaveClient(event, headers);
                
            case path.startsWith('/get-order/'):
                return await handleGetOrder(event, headers);
                
            default:
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Rota não encontrada',
                        path: path
                    })
                };
        }
        
    } catch (error) {
        console.error('❌ Erro na função:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                message: 'Erro interno do servidor'
            })
        };
    }
};

// ============================================
// HANDLERS
// ============================================

async function handleHealthCheck(event, headers) {
    console.log('🩺 Health check');
    
    try {
        // Testa conexão com Supabase
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'API funcionando',
                supabase: 'Conectado',
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('❌ Health check falhou:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Health check falhou',
                error: error.message 
            })
        };
    }
}

async function handleGetProducts(event, headers) {
    console.log('📦 Buscando produtos do Supabase');
    
    try {
        const params = event.queryStringParameters || {};
        const limit = params.limit ? parseInt(params.limit) : null;
        const filterColumn = params.filter_column;
        const filterValue = params.filter_value ? JSON.parse(params.filter_value) : null;
        
        console.log('🔍 Parâmetros:', { limit, filterColumn, filterValue });
        
        // Query base
        let query = supabase
            .from('products')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });
        
        // Aplica filtro de dias disponíveis
        if (filterColumn === 'available_days' && filterValue) {
            console.log(`🔍 Filtrando por dias disponíveis: ${filterValue}`);
            query = query.contains('available_days', [filterValue]);
        }
        
        // Aplica limite
        if (limit && limit > 0) {
            query = query.limit(limit);
        }
        
        const { data: products, error } = await query;
        
        if (error) {
            console.error('❌ Erro do Supabase:', error);
            throw error;
        }
        
        console.log(`✅ ${products?.length || 0} produtos encontrados no banco`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                products: products || [],
                count: products?.length || 0,
                source: 'supabase_database'
            })
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                message: 'Erro ao buscar produtos do banco' 
            })
        };
    }
}

async function handleSaveOrder(event, headers) {
    console.log('💾 Salvando pedido no Supabase');
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Método não permitido. Use POST.' 
            })
        };
    }
    
    try {
        const body = JSON.parse(event.body || '{}');
        const { client, order, items } = body;
        
        if (!client || !order) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Dados do pedido incompletos' 
                })
            };
        }
        
        console.log('👤 Cliente:', client.name);
        console.log('📦 Pedido com', (order.items || []).length, 'itens');
        console.log('💰 Total: R$', order.total);
        
        // PASSO 1: Verifica/Insere o cliente
        let clientId = null;
        
        if (!client.phone) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Telefone do cliente é obrigatório' 
                })
            };
        }
        
        console.log(`🔍 Buscando cliente pelo telefone: ${client.phone}`);
        
        // Busca cliente existente
        const { data: existingClient, error: clientSearchError } = await supabase
            .from('clients')
            .select('id, name, phone, address')
            .eq('phone', client.phone)
            .maybeSingle();
        
        if (clientSearchError) {
            console.error('❌ Erro ao buscar cliente:', clientSearchError);
        }
        
        if (existingClient) {
            console.log('✅ Cliente encontrado, ID:', existingClient.id);
            clientId = existingClient.id;
            
            // Atualiza dados do cliente
            const updateData = {
                name: client.name || existingClient.name,
                updated_at: new Date().toISOString()
            };
            
            // Atualiza endereço se fornecido
            if (client.address) {
                updateData.address = client.address;
                updateData.cep = client.cep || '';
                updateData.street = client.street || '';
                updateData.address_number = client.number || client.address_number || '';
                updateData.neighborhood = client.neighborhood || '';
                updateData.city = client.city || client.city_state || '';
                updateData.complement = client.complement || '';
            }
            
            if (client.observation) {
                updateData.observation = client.observation;
            }
            
            console.log('🔄 Atualizando cliente:', updateData);
            const { error: updateError } = await supabase
                .from('clients')
                .update(updateData)
                .eq('id', clientId);
            
            if (updateError) {
                console.error('❌ Erro ao atualizar cliente:', updateError);
            }
            
        } else {
            console.log('➕ Criando novo cliente');
            
            // Dados do novo cliente
            const clientData = {
                name: client.name,
                phone: client.phone,
                address: client.address || '',
                cep: client.cep || '',
                street: client.street || '',
                address_number: client.number || client.address_number || '',
                neighborhood: client.neighborhood || '',
                city: client.city || client.city_state || '',
                complement: client.complement || '',
                observation: client.observation || ''
            };
            
            // Remove campos vazios
            Object.keys(clientData).forEach(key => {
                if (!clientData[key]) {
                    clientData[key] = '';
                }
            });
            
            console.log('👤 Dados do cliente:', clientData);
            
            const { data: newClient, error: createError } = await supabase
                .from('clients')
                .insert([clientData])
                .select()
                .single();
            
            if (createError) {
                console.error('❌ Erro ao criar cliente:', createError);
                throw new Error(`Erro ao criar cliente: ${createError.message}`);
            }
            
            console.log('✅ Novo cliente criado, ID:', newClient.id);
            clientId = newClient.id;
        }
        
        // PASSO 2: Cria o pedido
        console.log('📝 Criando pedido para cliente ID:', clientId);
        
        // Gera ID único para o pedido
        const orderId = 'JD' + Date.now().toString().slice(-6) + 
                       Math.random().toString(36).substr(2, 3).toUpperCase();
        
        const orderData = {
            client_id: clientId,
            order_id: orderId,
            total: parseFloat(order.total || 0),
            subtotal: parseFloat(order.subtotal || order.total || 0),
            delivery_fee: parseFloat(order.deliveryFee || 0),
            payment_method: order.paymentMethod || 'pix',
            delivery_option: order.deliveryOption || 'entrega',
            address: client.address || 'Retirada na Loja',
            observation: client.observation || '',
            status: 'pendente'
        };
        
        console.log('📄 Dados do pedido:', orderData);
        
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (orderError) {
            console.error('❌ Erro ao criar pedido:', orderError);
            throw new Error(`Erro ao criar pedido: ${orderError.message}`);
        }
        
        console.log('✅ Pedido criado, ID:', newOrder.id);
        
        // PASSO 3: Adiciona os itens do pedido
        if (items && items.length > 0) {
            console.log(`➕ Adicionando ${items.length} itens ao pedido`);
            
            const orderItems = items.map(item => ({
                order_id: newOrder.id,
                product_id: item.id || null,
                product_name: item.name || 'Produto',
                quantity: parseInt(item.quantity || 1),
                price: parseFloat(item.price || 0),
                total: parseFloat((item.price || 0) * (item.quantity || 1))
            }));
            
            console.log('🛒 Itens do pedido:', orderItems);
            
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);
            
            if (itemsError) {
                console.error('❌ Erro ao adicionar itens:', itemsError);
                // Continua mesmo com erro nos itens
            } else {
                console.log('✅ Itens do pedido adicionados com sucesso');
            }
        }
        
        // Gera link para visualização do pedido
        const siteUrl = process.env.SITE_URL || 'http://localhost:8888';
        const orderDetailLink = `${siteUrl}/order.html?orderId=${orderId}`;
        
        console.log('🔗 Link do pedido gerado:', orderDetailLink);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: 'Pedido salvo com sucesso no banco de dados',
                orderId: orderId,
                orderDbId: newOrder.id,
                clientId: clientId,
                orderDetailLink: orderDetailLink,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('❌ Erro ao salvar pedido:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                message: 'Erro ao salvar pedido no banco' 
            })
        };
    }
}

async function handleSaveClient(event, headers) {
    console.log('👤 Salvando/atualizando cliente');
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Método não permitido. Use POST.' 
            })
        };
    }
    
    try {
        const client = JSON.parse(event.body || '{}');
        
        if (!client.phone) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Telefone é obrigatório' 
                })
            };
        }
        
        console.log(`🔍 Processando cliente: ${client.name} (${client.phone})`);
        
        // Busca cliente existente
        const { data: existingClient, error: searchError } = await supabase
            .from('clients')
            .select('id')
            .eq('phone', client.phone)
            .maybeSingle();
        
        let result;
        
        if (existingClient) {
            // Atualiza cliente existente
            const updateData = {
                name: client.name || '',
                address: client.address || '',
                cep: client.cep || '',
                street: client.street || '',
                address_number: client.address_number || client.number || '',
                neighborhood: client.neighborhood || '',
                city: client.city || client.city_state || '',
                complement: client.complement || '',
                observation: client.observation || '',
                updated_at: new Date().toISOString()
            };
            
            const { data: updatedClient, error: updateError } = await supabase
                .from('clients')
                .update(updateData)
                .eq('id', existingClient.id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            result = {
                action: 'updated',
                client: updatedClient
            };
            
        } else {
            // Cria novo cliente
            const clientData = {
                name: client.name || '',
                phone: client.phone,
                address: client.address || '',
                cep: client.cep || '',
                street: client.street || '',
                address_number: client.address_number || client.number || '',
                neighborhood: client.neighborhood || '',
                city: client.city || client.city_state || '',
                complement: client.complement || '',
                observation: client.observation || ''
            };
            
            const { data: newClient, error: createError } = await supabase
                .from('clients')
                .insert([clientData])
                .select()
                .single();
            
            if (createError) throw createError;
            
            result = {
                action: 'created',
                client: newClient
            };
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                ...result,
                message: `Cliente ${result.action === 'created' ? 'criado' : 'atualizado'} com sucesso`
            })
        };
        
    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                message: 'Erro ao salvar cliente' 
            })
        };
    }
}

async function handleGetOrder(event, headers) {
    console.log('📋 Buscando pedido no banco');
    
    try {
        // Extrai orderId da URL
        const pathParts = event.path.split('/');
        let orderId = pathParts[pathParts.length - 1];
        
        if (!orderId || orderId === 'get-order') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'ID do pedido não fornecido' 
                })
            };
        }
        
        console.log(`🔍 Buscando pedido: ${orderId}`);
        
        // Busca pedido pelo order_id
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
        
        if (orderError || !order) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Pedido não encontrado' 
                })
            };
        }
        
        // Busca cliente
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', order.client_id)
            .single();
        
        if (clientError) {
            throw clientError;
        }
        
        // Busca itens
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
        
        if (itemsError) {
            throw itemsError;
        }
        
        // Formata resposta
        const orderData = {
            customer: {
                id: client.id,
                name: client.name,
                phone: client.phone,
                address: client.address,
                cep: client.cep,
                street: client.street,
                number: client.address_number,
                neighborhood: client.neighborhood,
                city: client.city,
                complement: client.complement,
                observation: client.observation
            },
            order: {
                id: order.id,
                order_id: order.order_id,
                total: order.total,
                subtotal: order.subtotal,
                delivery_fee: order.delivery_fee,
                payment_method: order.payment_method,
                delivery_option: order.delivery_option,
                address: order.address,
                observation: order.observation,
                status: order.status,
                created_at: order.created_at
            },
            items: items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            }))
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                orderData: orderData,
                message: 'Pedido encontrado'
            })
        };
        
    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                message: 'Erro ao buscar pedido' 
            })
        };
    }
}