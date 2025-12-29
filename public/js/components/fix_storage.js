const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStorage() {
    console.log('Verificando buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
        console.error('Erro ao listar buckets:', listError);
        return;
    }

    const bucketName = 'product-images';
    const exists = buckets.find(b => b.name === bucketName);

    if (exists) {
        console.log(`O bucket "${bucketName}" já existe.`);
    } else {
        console.log(`O bucket "${bucketName}" não existe. Tentando criar...`);
        const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true
        });

        if (error) {
            console.error('Erro ao criar bucket:', error);
            console.log('\n--- DICA ---');
            console.log('O erro "new row violates row-level security policy" geralmente significa que a SERVICE_ROLE_KEY');
            console.log('não tem permissão para criar buckets via API, ou o RLS na tabela storage.buckets está bloqueando.');
            console.log('Acesse o painel do Supabase (https://app.supabase.com), vá em Storage e crie manualmente');
            console.log('um bucket chamado "product-images" e marque-o como PUBLIC.');
        } else {
            console.log('Bucket criado com sucesso!');
        }
    }
}

fixStorage();
