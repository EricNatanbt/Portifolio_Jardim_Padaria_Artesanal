// public/js/supabaseClient.js
console.log('🔧 Supabase Client carregando...');

// Versão mock/simulação para evitar erros
const supabaseMock = {
  from: (table) => {
    console.log(`📊 Acessando tabela: ${table}`);
    return {
      select: (columns = '*') => {
        console.log(`📊 Simulando select de ${table}`, columns);
        return Promise.resolve({ 
          data: [], 
          error: null 
        });
      },
      insert: (data) => {
        console.log(`📝 Simulando insert em ${table}:`, data);
        return Promise.resolve({ 
          data: [{ id: 'mock-id' }], 
          error: null 
        });
      },
      update: (data) => ({
        eq: () => Promise.resolve({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    };
  }
};

// Exporta o mock
export const supabase = supabaseMock;

// Também disponibiliza globalmente
window.supabase = supabaseMock;

console.log('✅ Supabase Mock inicializado');