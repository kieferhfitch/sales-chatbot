// src/lib/services/instabrain/client.ts

import { 
  AuthResponse,
  QuoteRequest,
  QuoteResponse,
  StartApplicationRequest,
  StartApplicationResponse
} from './types';

class InstaBrainClient {
  private baseUrl: string;
  private userId: string;
  private accessToken: string;
  private jwtToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    // Load from environment variables
    this.baseUrl = process.env.INSTABRAIN_API_URL || 'https://api.instabrainsandbox.io/api';
    this.userId = process.env.INSTABRAIN_USER_ID || '';
    this.accessToken = process.env.INSTABRAIN_ACCESS_TOKEN || '';
  }

  private async ensureValidToken(): Promise<string> {
    // Check if token exists and is not expired (with 1-minute buffer)
    if (this.jwtToken && this.tokenExpiry && this.tokenExpiry.getTime() > Date.now() + 60000) {
      return this.jwtToken;
    }

    // Get new token
    const response = await fetch(`${this.baseUrl}/quickquoterv2/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: this.userId,
        accessToken: this.accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const authResponse: AuthResponse = await response.json();
    
    if (!authResponse.flagStatus || !authResponse.value?.jwtToken) {
      throw new Error('Failed to obtain JWT token');
    }

    this.jwtToken = authResponse.value.jwtToken;
    // Set expiry to 30 minutes from now
    this.tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    return this.jwtToken;
  }

  private async makeAuthorizedRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown
  ): Promise<T> {
    const token = await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    return this.makeAuthorizedRequest<QuoteResponse>(
      '/thirdpartyibtermquote/get',
      'POST',
      request
    );
  }

  async startApplication(request: StartApplicationRequest): Promise<StartApplicationResponse> {
    return this.makeAuthorizedRequest<StartApplicationResponse>(
      '/thirdpartyibtermstartapp/start-application',
      'POST',
      request
    );
  }
}

// Export a singleton instance
export const instaBrainClient = new InstaBrainClient();

// Also export the class for testing purposes
export { InstaBrainClient };
