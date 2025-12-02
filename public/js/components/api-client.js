// js/api-client.js
class ApiClient {
  constructor() {
    // Detecta ambiente
    this.isProduction = window.location.hostname.includes('netlify.app');
    this.isLocalhost = window.location.hostname.includes('localhost');
    
    // Configura URL base
    if (this.isProduction) {
      this.baseUrl = window.location.origin;
    } else if (this.isLocalhost) {
      this.baseUrl = 'http://localhost:8888';
    }
    
    console.log('🌐 API Client inicializado para:', this.baseUrl);
  }

  async saveOrder(orderData) {
    try {
      console.log('📤 Salvando pedido via API...');
      
      // CORREÇÃO: Garantir que client tem todos os campos
      const clientData = orderData.client || {};
      const orderInfo = orderData.order || {};
      
      // Log dos dados para debug
      console.log('🔍 Dados do cliente recebidos:', {
        name: clientData.name,
        phone: clientData.phone,
        address: clientData.address,
        street: clientData.street,
        number: clientData.number,
        neighborhood: clientData.neighborhood,
        city: clientData.city
      });
      
      // Endpoint correto
      const endpoint = '/.netlify/functions/save-order';
      
      return await this._makeRequest(endpoint, 'POST', {
        client: {
          phone: clientData.phone,
          name: clientData.name,
          address: clientData.address,
          cep: clientData.cep,
          
          // Campos individuais de endereço
          street: clientData.street,
          number: clientData.number,
          neighborhood: clientData.neighborhood,
          city: clientData.city || clientData.city_state,
          complement: clientData.complement,
          
          observation: clientData.observation,
          deliveryOption: clientData.deliveryOption,
          paymentMethod: clientData.paymentMethod
        },
        order: {
          total: orderInfo.total || 0,
          deliveryFee: orderInfo.deliveryFee || 0,
          paymentMethod: orderInfo.paymentMethod,
          deliveryOption: orderInfo.deliveryOption
        },
        items: orderData.items || orderInfo.items || []
      });
      
    } catch (error) {
      console.error('❌ Erro ao preparar pedido:', error);
      throw error;
    }
  }

  async saveClient(clientData) {
    const endpoint = '/.netlify/functions/save-client';
    return this._makeRequest(endpoint, 'POST', clientData);
  }

  async getClientByPhone(phone) {
    const endpoint = `/api/get-client?phone=${encodeURIComponent(phone)}`;
    return this._makeRequest(endpoint, 'GET');
  }

  async _makeRequest(endpoint, method, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`📤 ${method} ${endpoint}`);
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Resposta de ${endpoint}:`, result);
      return result;

    } catch (error) {
      console.error(`❌ Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;