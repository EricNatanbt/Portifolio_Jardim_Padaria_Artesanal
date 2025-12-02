// netlify/functions/save-client.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Configura CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Apenas POST e PUT são permitidos
  if (!['POST', 'PUT'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verifica credenciais
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'Supabase credentials not configured'
        })
      };
    }

    // Inicializa cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse dos dados da requisição
    const requestBody = JSON.parse(event.body || '{}');
    const { phone, ...clientData } = requestBody;

    if (!phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number is required' })
      };
    }

    // Limpa o telefone (remove não números)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Prepara dados do cliente com campos de endereço
    const clientToSave = {
      phone: cleanPhone,
      full_name: clientData.full_name || clientData.name || '',
      last_order_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Adiciona campos de endereço se existirem
    if (clientData.address) clientToSave.address = clientData.address;
    if (clientData.cep) clientToSave.cep = clientData.cep.replace(/\D/g, '');
    if (clientData.street) clientToSave.street = clientData.street;
    if (clientData.number) clientToSave.address_number = clientData.number;
    if (clientData.address_number) clientToSave.address_number = clientData.address_number;
    if (clientData.neighborhood) clientToSave.neighborhood = clientData.neighborhood;
    if (clientData.city) clientToSave.city_state = clientData.city;
    if (clientData.city_state) clientToSave.city_state = clientData.city_state;
    if (clientData.complement) clientToSave.complement = clientData.complement;
    if (clientData.email) clientToSave.email = clientData.email;

    console.log('👤 Salvando/Atualizando cliente:', {
      phone: cleanPhone,
      name: clientToSave.full_name,
      hasAddress: !!clientData.address
    });

    // Busca cliente existente primeiro
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, total_spent, total_orders, address, street, address_number, neighborhood, city_state, complement, cep')
      .eq('phone', cleanPhone)
      .maybeSingle();

    let clientId;
    let isNewClient = false;

    if (fetchError) {
      console.error('❌ Erro ao buscar cliente:', fetchError);
      throw fetchError;
    }

    if (existingClient) {
      // Cliente existe - atualiza
      clientId = existingClient.id;
      
      // Mescla dados existentes com novos
      const updateData = { ...clientToSave };
      
      // Mantém dados que não foram fornecidos
      if (!updateData.address && existingClient.address) updateData.address = existingClient.address;
      if (!updateData.street && existingClient.street) updateData.street = existingClient.street;
      if (!updateData.address_number && existingClient.address_number) updateData.address_number = existingClient.address_number;
      if (!updateData.neighborhood && existingClient.neighborhood) updateData.neighborhood = existingClient.neighborhood;
      if (!updateData.city_state && existingClient.city_state) updateData.city_state = existingClient.city_state;
      if (!updateData.complement && existingClient.complement) updateData.complement = existingClient.complement;
      if (!updateData.cep && existingClient.cep) updateData.cep = existingClient.cep;
      
      const { error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId);

      if (updateError) {
        console.error('❌ Erro ao atualizar cliente:', updateError);
        throw updateError;
      }

      console.log(`✅ Cliente atualizado: ${clientId}`);

    } else {
      // Cliente não existe - cria novo
      clientToSave.created_at = new Date().toISOString();
      clientToSave.total_orders = 0;
      clientToSave.total_spent = 0;

      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert([clientToSave])
        .select('id, total_spent, total_orders')
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar cliente:', insertError);
        throw insertError;
      }

      clientId = newClient.id;
      isNewClient = true;
      console.log(`✅ Novo cliente criado: ${clientId}`);
    }

    // Busca dados atualizados do cliente
    const { data: finalClient, error: finalError } = await supabase
      .from('clients')
      .select('id, full_name, phone, total_orders, total_spent, address, street, address_number, neighborhood, city_state, complement, cep, last_order_date, created_at')
      .eq('id', clientId)
      .single();

    if (finalError) {
      console.error('❌ Erro ao buscar dados finais do cliente:', finalError);
      throw finalError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        isNew: isNewClient,
        client: finalClient,
        message: isNewClient ? 'Cliente criado com sucesso' : 'Cliente atualizado com sucesso'
      })
    };

  } catch (error) {
    console.error('❌ Erro na função save-client:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};