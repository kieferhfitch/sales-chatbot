// src/lib/instabrain/api.ts
interface ApplicationLinks {
  agentLink: string;
  eAppAgentLink: string;
  applicantLink: string;
}

export class InstaBrainAPI {
  private baseUrl: string;
  private jwt: string | null;

  constructor() {
    this.baseUrl = process.env.INSTABRAIN_API_URL || 'https://api.instabrainsandbox.io/api';
    this.jwt = null;
  }

  /**
   * Get JWT token for API authentication
   */
  private async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/quickquoterv2/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: process.env.INSTABRAIN_USER_ID,
        accessToken: process.env.INSTABRAIN_ACCESS_TOKEN
      })
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    this.jwt = data.value.jwtToken;
    return this.jwt;
  }

  /**
   * Get JWT token, refreshing if needed
   */
  private async getToken(): Promise<string> {
    if (!this.jwt) {
      return this.authenticate();
    }
    return this.jwt;
  }

  /**
   * Start application process
   */
  public async startApplication(quoteResponseId: string): Promise<ApplicationLinks> {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}/thirdpartyibtermstartapp/start-application`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'InstaBrainDevelopment.instabrainstage.io'
      },
      body: JSON.stringify({ quoteResponseId })
    });

    if (!response.ok) {
      const error = new Error('Failed to start application');
      (error as any).response = response;
      throw error;
    }

    const data = await response.json();

    if (!data.flagStatus || data.error) {
      throw new Error(data.error || 'Failed to start application');
    }

    return data.value as ApplicationLinks;
  }

  /**
   * Get a quote based on provided parameters
   */
  public async getQuote(quoteParams: any): Promise<any> {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}/thirdpartyibtermquote/get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quoteParams)
    });

    if (!response.ok) {
      const error = new Error('Failed to get quote');
      (error as any).response = response;
      throw error;
    }

    const data = await response.json();

    if (!data.flagStatus || data.error) {
      throw new Error(data.error || 'Failed to get quote');
    }

    return data;
  }
}
