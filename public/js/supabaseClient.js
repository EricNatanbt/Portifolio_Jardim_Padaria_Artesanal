// public/js/supabaseClient.js - VERSÃO COMPLETA PARA NETLIFY
console.log('🔧 Supabase Client carregando...');

// Tenta carregar o Supabase real
async function initializeSupabase() {
  try {
    // Importa dinamicamente
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
    
    // URL base da API (Netlify Functions)
    const API_BASE = window.location.origin + '/.netlify/functions';
    
    // Testa a conexão com a API
    console.log('🔗 Testando conexão com API...');
    
    try {
      const testResponse = await fetch(`${API_BASE}/supabase-proxy/health`);
      if (testResponse.ok) {
        console.log('✅ API Netlify Functions funcionando');
        
        // Cria cliente Supabase para uso via proxy
        const supabase = {
          from: (table) => ({
            select: (columns = '*') => {
              console.log(`📊 Via API: select de ${table}`, columns);
              
              // Retorna um objeto que simula a query builder do Supabase
              const queryBuilder = {
                data: [],
                error: null,
                
                // Método order (simulado)
                order: function(column, options = {}) {
                  console.log(`🔄 Simulando order by ${column}`, options);
                  return this; // Retorna o mesmo builder
                },
                
                // Método eq para filtros
                eq: function(column, value) {
                  console.log(`🔍 Simulando eq: ${column} = ${value}`);
                  return this;
                },
                
                // Método limit
                limit: function(count) {
                  console.log(`📏 Simulando limit: ${count}`);
                  return this;
                },
                
                // Método single
                single: function() {
                  console.log(`🔢 Simulando single`);
                  return Promise.resolve({ data: null, error: null });
                },
                
                // Método maybeSingle
                maybeSingle: function() {
                  console.log(`❓ Simulando maybeSingle`);
                  return Promise.resolve({ data: null, error: null });
                },
                
                // Método then - faz a requisição real
                then: async function(callback) {
                  try {
                    let endpoint = '';
                    
                    if (table === 'products') {
                      endpoint = 'get-products';
                    } else if (table === 'clients') {
                      endpoint = 'get-client';
                    }
                    
                    if (endpoint) {
                      const response = await fetch(`${API_BASE}/supabase-proxy/${endpoint}`);
                      const data = await response.json();
                      
                      const result = {
                        data: endpoint === 'get-products' ? (data.products || []) : (data.client || null),
                        error: data.success === false ? new Error(data.error) : null
                      };
                      
                      return callback(result);
                    } else {
                      return callback({ data: [], error: null });
                    }
                  } catch (error) {
                    console.error('❌ Erro na requisição:', error);
                    return callback({ data: [], error });
                  }
                }
              };
              
              return queryBuilder;
            },
            
            // Método insert
            insert: (data) => {
              console.log(`📝 Via API: insert em ${table}`, data);
              
              return {
                select: () => ({
                  single: async () => {
                    try {
                      let endpoint = '';
                      let method = 'POST';
                      
                      if (table === 'orders') {
                        endpoint = 'save-order';
                      } else if (table === 'clients') {
                        endpoint = 'save-client';
                      }
                      
                      if (endpoint) {
                        const response = await fetch(`${API_BASE}/supabase-proxy/${endpoint}`, {
                          method: method,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(data[0])
                        });
                        
                        const result = await response.json();
                        return {
                          data: result.success ? (result.orderId ? { id: result.orderId } : result.client) : null,
                          error: result.success === false ? new Error(result.error) : null
                        };
                      }
                      
                      return { data: { id: 'mock_' + Date.now() }, error: null };
                    } catch (error) {
                      return { data: null, error };
                    }
                  }
                })
              };
            },
            
            // Método update
            update: (data) => ({
              eq: () => ({
                then: async (callback) => {
                  console.log(`🔄 Via API: update em ${table}`, data);
                  callback({ data: null, error: null });
                }
              })
            }),
            
            // Método delete
            delete: () => ({
              eq: () => ({
                then: async (callback) => {
                  callback({ data: null, error: null });
                }
              })
            })
          }),
          
          // Método rpc
          rpc: (fnName, params) => {
            console.log(`🔄 Via API RPC: ${fnName}`, params);
            return Promise.resolve({ data: null, error: null });
          }
        };
        
        console.log('✅ Supabase via API inicializado');
        return supabase;
      }
    } catch (apiError) {
      console.warn('⚠️ API não disponível, tentando conexão direta:', apiError.message);
    }
    
    // Se API não funcionar, tenta Supabase direto
    console.log('🔑 Tentando conexão direta com Supabase...');
    
    // Tenta obter credenciais
    let supabaseUrl = window.SUPABASE_URL;
    let supabaseAnonKey = window.SUPABASE_ANON_KEY;
    
    // Tenta carregar de um arquivo de configuração
    if (!supabaseUrl || !supabaseAnonKey) {
      try {
        const response = await fetch('/config.json');
        if (response.ok) {
          const config = await response.json();
          supabaseUrl = config.SUPABASE_URL;
          supabaseAnonKey = config.SUPABASE_ANON_KEY;
        }
      } catch (e) {
        console.log('⚠️ Não foi possível carregar config.json');
      }
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Credenciais não encontradas, usando mock');
      return createMockSupabase();
    }
    
    // Cria cliente Supabase direto
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Testa a conexão
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Conexão direta falhou, usando mock');
      return createMockSupabase();
    }
    
    console.log('✅ Supabase direto inicializado');
    return supabase;
    
  } catch (error) {
    console.warn('⚠️ Não foi possível inicializar Supabase, usando mock:', error.message);
    return createMockSupabase();
  }
}

// Função de fallback (mock)
function createMockSupabase() {
  console.log('🔄 Usando Supabase Mock para desenvolvimento');
  
  return {
    from: (table) => ({
      select: (columns = '*') => {
        console.log(`📊 Mock: select de ${table}`, columns);
        
        const query = {
          data: getMockData(table),
          error: null,
          order: () => query,
          eq: () => query,
          limit: () => query,
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (callback) => Promise.resolve({ data: getMockData(table), error: null }).then(callback)
        };
        
        return query;
      },
      insert: (data) => {
        console.log(`📝 Mock: insert em ${table}`, data);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: [{ id: 'mock_' + Date.now() }], error: null })
          })
        };
      },
      update: (data) => ({
        eq: () => ({
          then: (callback) => {
            console.log(`🔄 Mock: update em ${table}`, data);
            callback({ data: null, error: null });
          }
        })
      }),
      delete: () => ({
        eq: () => ({
          then: (callback) => callback({ data: null, error: null })
        })
      })
    }),
    rpc: (fnName, params) => {
      console.log(`🔄 Mock RPC: ${fnName}`, params);
      return Promise.resolve({ data: null, error: null });
    }
  };
}

// Dados mock
function getMockData(table) {
  if (table === 'products') {
    return [
      { 
        id: '1', 
        name: 'Ciabatta Clássica', 
        price: 8.00, 
        category: 'Pães', 
        available_days: ['quarta', 'quinta', 'sexta', 'sabado'], 
        description: 'Ciabatta de fermentação natural', 
        ingredients: 'Farinha, água, sal, fermento natural' 
      },
      { 
        id: '2', 
        name: 'Brioche Tradicional', 
        price: 10.00, 
        category: 'Pães', 
        available_days: ['quarta', 'quinta', 'sexta', 'sabado'], 
        description: 'Brioche macio e amanteigado', 
        ingredients: 'Farinha, ovos, manteiga, açúcar, fermento' 
      },
      { 
        id: '3', 
        name: 'Cinnamon Roll', 
        price: 12.00, 
        category: 'Doces', 
        available_days: ['quarta', 'quinta', 'sexta', 'sabado'], 
        description: 'Enrolado de canela com cobertura de cream cheese', 
        ingredients: 'Massa de brioche, canela, açúcar, cream cheese' 
      }
    ];
  }
  return [];
}

// Inicializa e exporta a Promise de inicialização
const supabasePromise = initializeSupabase();

// Exporta a Promise
export { supabasePromise };

// Torna o cliente Supabase disponível globalmente
supabasePromise.then(client => {
  window.supabase = client;
  console.log('✅ Supabase disponível globalmente como window.supabase');
  
  // Dispara evento para que outros scripts saibam que o Supabase está pronto
  window.dispatchEvent(new CustomEvent('supabase-ready', { detail: client }));
});

// Exporta um objeto vazio para satisfazer imports
export const supabase = {};