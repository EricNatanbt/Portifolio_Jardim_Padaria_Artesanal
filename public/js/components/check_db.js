const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aojhcmymkphsiaqmipda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvamhjbXlta3Boc2lhcW1pcGRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyMDY5NSwiZXhwIjoyMDgwMTk2Njk1fQ.32JQGvUKcxJTde304go47s4ZZCwyDxmUpSFrtDh-1fY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Verificando tabela products...');
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Colunas encontradas:', Object.keys(data[0]));
        console.log('Exemplo de dado:', data[0]);
    } else {
        console.log('Tabela vazia. Tentando obter schema via RPC ou outra forma...');
        // Se a tabela estiver vazia, tentamos inserir um objeto vazio para forçar erro de schema e ver as colunas sugeridas
        const { error: insertError } = await supabase.from('products').insert({}).select();
        console.log('Erro de inserção (pode conter dicas de colunas):', insertError);
    }
}

check();
