/**
 * Serviço de integração com a API da Controlid
 * Documentação: https://www.controlid.com.br/docs/access-api-pt/
 */

export interface ControlidCredentials {
  ip: string;
  port: number;
  username?: string;
  password?: string;
}

export interface ControlidResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface ControlidUser {
  id: number;
  pis?: string; // Número do PIS ou identificador da tag
  name?: string;
  registration?: string;
  status?: number;
}

export interface ControlidEvent {
  id: number;
  user_id?: number;
  pis?: string;
  timestamp: string;
  event_type: number;
  door?: number;
}

/**
 * Classe para comunicação com a API da Controlid
 */
export class ControlidApi {
  private baseUrl: string;
  private credentials: ControlidCredentials;
  private sessionId: string | null = null;

  constructor(credentials: ControlidCredentials) {
    this.credentials = credentials;
    this.baseUrl = `http://${credentials.ip}:${credentials.port}`;
  }

  /**
   * Autentica na API da Controlid
   * Retorna o session_id necessário para outras operações
   */
  async authenticate(): Promise<ControlidResponse<{ session_id: string }>> {
    try {
      const url = `${this.baseUrl}/login.fcgi`;
      const body = {
        login: this.credentials.username || 'admin',
        password: this.credentials.password || ''
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      
      if (data.session && data.session !== '') {
        this.sessionId = data.session;
        return {
          success: true,
          data: { session_id: data.session }
        };
      } else {
        return {
          success: false,
          error: 'Falha na autenticação: sessão não retornada'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Erro de conexão: ${error.message}`
      };
    }
  }

  /**
   * Testa a conexão com o dispositivo Controlid
   */
  async testConnection(): Promise<ControlidResponse> {
    try {
      // Primeiro tenta autenticar
      const authResult = await this.authenticate();
      
      if (!authResult.success) {
        return authResult;
      }

      // Se autenticou, tenta obter informações do dispositivo
      const infoResult = await this.getDeviceInfo();
      
      if (infoResult.success) {
        return {
          success: true,
          data: infoResult.data
        };
      }

      return infoResult;
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao testar conexão: ${error.message}`
      };
    }
  }

  /**
   * Obtém informações do dispositivo
   */
  async getDeviceInfo(): Promise<ControlidResponse> {
    if (!this.sessionId) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }
    }

    try {
      const url = `${this.baseUrl}/get_config.fcgi?session=${this.sessionId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao obter informações: ${error.message}`
      };
    }
  }

  /**
   * Busca usuários/tags cadastrados no dispositivo
   */
  async getUsers(limit: number = 100, offset: number = 0): Promise<ControlidResponse<ControlidUser[]>> {
    if (!this.sessionId) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }
    }

    try {
      const url = `${this.baseUrl}/get_users.fcgi?session=${this.sessionId}&limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      
      // A API pode retornar users como array ou objeto com users
      const users = Array.isArray(data.users) ? data.users : (data.users ? [data.users] : []);
      
      return {
        success: true,
        data: users
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar usuários: ${error.message}`
      };
    }
  }

  /**
   * Busca eventos/logs de acesso recentes
   */
  async getEvents(limit: number = 100, offset: number = 0): Promise<ControlidResponse<ControlidEvent[]>> {
    if (!this.sessionId) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }
    }

    try {
      const url = `${this.baseUrl}/get_events.fcgi?session=${this.sessionId}&limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      
      // A API pode retornar events como array ou objeto com events
      const events = Array.isArray(data.events) ? data.events : (data.events ? [data.events] : []);
      
      return {
        success: true,
        data: events
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar eventos: ${error.message}`
      };
    }
  }

  /**
   * Busca um usuário específico por PIS (número da tag)
   */
  async getUserByPis(pis: string): Promise<ControlidResponse<ControlidUser>> {
    if (!this.sessionId) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }
    }

    try {
      const url = `${this.baseUrl}/get_user.fcgi?session=${this.sessionId}&pis=${pis}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.user || data
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar usuário: ${error.message}`
      };
    }
  }

  /**
   * Faz logout e encerra a sessão
   */
  async logout(): Promise<ControlidResponse> {
    if (!this.sessionId) {
      return { success: true };
    }

    try {
      const url = `${this.baseUrl}/logout.fcgi?session=${this.sessionId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.sessionId = null;
      
      return {
        success: response.ok
      };
    } catch (error: any) {
      this.sessionId = null;
      return {
        success: false,
        error: `Erro ao fazer logout: ${error.message}`
      };
    }
  }
}

/**
 * Função helper para criar uma instância da API Controlid
 */
export function createControlidApi(ip: string, port: number, username?: string, password?: string): ControlidApi {
  return new ControlidApi({ ip, port, username, password });
}

