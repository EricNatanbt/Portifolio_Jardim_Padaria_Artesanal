// public/js/supabaseClient.js - VERSÃO PARA NETLIFY
console.log('🔧 Supabase Client carregando...');

// Tenta carregar o Supabase real
async function initializeSupabase() {
  try {
    // Importa dinamicamente
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
    
    // IMPORTANTE: No Netlify, as variáveis de ambiente só estão disponíveis
    // no lado do servidor (funções serverless). No frontend precisamos:
    
    // Opção 1: Usar variáveis definidas em window (vamos usar esta)
    // Opção 2: Usar API proxy (já temos as funções serverless)
    
    // Vamos usar uma abordagem híbrida:
    // 1. Primeiro tentar via API proxy (sempre funciona)
    // 2. Fallback para mock se falhar
    
    // URL base da API (Netlify Functions)
    const API_BASE = window.location.origin + '/.netlify/functions';
    
    // Testa a conexão com a API
    console.log('🔗 Testando conexão com API...');
    
    try {
      const testResponse = await fetch(`${API_BASE}/get-products`);
      if (testResponse.ok) {
        console.log('✅ API Netlify Functions funcionando');
        
        // Cria cliente Supabase para uso via proxy
        const supabase = {
          from: (table) => ({
            select: async (columns = '*') => {
              console.log(`📊 Via API: select de ${table}`);
              
              // Roteia para a função correta
              if (table === 'products') {
                const response = await fetch(`${API_BASE}/get-products`);
                const data = await response.json();
                return { data: data.products, error: null };
              }
              
              // Outras tabelas podem ser adicionadas aqui
              return { data: [], error: null };
            },
            insert: async (data) => {
              console.log(`📝 Via API: insert em ${table}`);
              
              if (table === 'orders') {
                // Chama função save-order via proxy
                const response = await fetch(`${API_BASE}/save-order`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data[0]) // Passa o primeiro item do array
                });
                return await response.json();
              }
              
              if (table === 'clients') {
                // Chama função save-client via proxy
                const response = await fetch(`${API_BASE}/save-client`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data[0])
                });
                return await response.json();
              }
              
              return { data: null, error: 'Table not supported' };
            },
            update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
          }),
          rpc: (fnName, params) => {
            console.log(`🔄 RPC via API: ${fnName}`);
            return Promise.resolve({ data: null, error: null });
          }
        };
        
        console.log('✅ Supabase via API inicializado');
        return supabase;
      }
    } catch (apiError) {
      console.warn('⚠️ API não disponível:', apiError.message);
    }
    
    // Se API não funcionar, tenta Supabase direto (só funciona se CORS estiver configurado)
    console.log('🔑 Tentando conexão direta com Supabase...');
    
    // Tenta obter credenciais de diferentes formas
    let supabaseUrl = window.SUPABASE_URL;
    let supabaseAnonKey = window.SUPABASE_ANON_KEY;
    
    // Se não estiverem definidas no window, tenta buscar de um arquivo de configuração
    if (!supabaseUrl || !supabaseAnonKey) {
      try {
        // Tenta carregar de um arquivo de configuração
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
      throw new Error('Credenciais do Supabase não encontradas');
    }
    
    // Cria o cliente Supabase direto
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
          maybeSingle: () => Promise.resolve({ data: null, error: null })
        };
        
        return query;
      },
      insert: (data) => {
        console.log(`📝 Mock: insert em ${table}`, data);
        return Promise.resolve({ data: [{ id: 'mock_' + Date.now() }], error: null });
      },
      update: (data) => ({
        eq: () => {
          console.log(`🔄 Mock: update em ${table}`, data);
          return Promise.resolve({ data: null, error: null });
        }
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
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
      { id: '1', name: 'Ciabatta Clássica', price: 8.00, category: 'pães', available_days: ['quarta', 'quinta', 'sexta', 'sabado'], description: 'Ciabatta de fermentação natural', ingredients: 'Farinha, água, sal, fermento natural' },
      { id: '2', name: 'Brioche Tradicional', price: 10.00, category: 'pães', available_days: ['quarta', 'quinta', 'sexta', 'sabado'], description: 'Brioche macio e amanteigado', ingredients: 'Farinha, ovos, manteiga, açúcar, fermento' },
      { id: '3', name: 'Cinnamon Roll', price: 12.00, category: 'doces', available_days: ['quarta', 'quinta', 'sexta', 'sabado'], description: 'Enrolado de canela com cobertura de cream cheese', ingredients: 'Massa de brioche, canela, açúcar, cream cheese' }
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
  window.dispatchEvent(new Event('supabase-ready'));
});

// Exporta um objeto vazio para satisfazer imports
export const supabase = {};