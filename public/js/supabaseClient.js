// public/js/supabaseClient.js - VERSÃO REAL COM VARIÁVEIS DE AMBIENTE
console.log('🔧 Supabase Client carregando...');

// Tenta carregar o Supabase real
async function initializeSupabase() {
  try {
    // Importa dinamicamente para evitar erros se não carregar
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
    
    // Obtém variáveis de ambiente - IMPORTANTE: prefixo VITE_ para Netlify
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                       process.env.VITE_SUPABASE_URL || 
                       'https://seu-projeto.supabase.co';
    
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                           process.env.VITE_SUPABASE_ANON_KEY || 
                           'sua-anon-key-aqui';
    
    console.log('🔑 Configurando Supabase com URL:', supabaseUrl ? '✅ Configurada' : '❌ Ausente');
    
    // Cria o cliente
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Testa a conexão
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Teste de conexão falhou, usando mock:', error.message);
      return createMockSupabase();
    }
    
    console.log('✅ Supabase REAL inicializado e testado');
    return supabase;
    
  } catch (error) {
    console.warn('⚠️ Não foi possível inicializar Supabase real, usando mock:', error.message);
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
          order: () => Promise.resolve({
            data: getMockData(table),
            error: null
          }),
          eq: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null })
        };
        return query;
      },
      insert: () => Promise.resolve({ data: [{ id: 'mock' }], error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
    })
  };
}

// Dados mock para desenvolvimento
function getMockData(table) {
  if (table === 'products') {
    return [
      { id: '1', name: 'Ciabatta Clássica', price: 8.00, category: 'pães', available_days: ['quarta', 'quinta', 'sexta', 'sabado'] },
      { id: '2', name: 'Brioche Tradicional', price: 10.00, category: 'pães', available_days: ['quarta', 'quinta', 'sexta', 'sabado'] },
      { id: '3', name: 'Cinnamon Roll', price: 12.00, category: 'doces', available_days: ['quarta', 'quinta', 'sexta', 'sabado'] }
    ];
  }
  return [];
}

// Inicializa e exporta
const supabasePromise = initializeSupabase();

// Exporta como Promise para uso com await
export const supabase = {
  from: (table) => ({
    select: async (columns) => {
      const client = await supabasePromise;
      return client.from(table).select(columns);
    }
  })
};

// Também exporta a Promise para quem quiser usar diretamente
export { supabasePromise };

// Torna disponível globalmente (para scripts antigos)
supabasePromise.then(client => {
  window.supabase = client;
  console.log('✅ Supabase disponível globalmente como window.supabase');
});