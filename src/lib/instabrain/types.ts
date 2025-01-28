// src/lib/instabrain/types.ts
export interface AuthCredentials {
  userId: number;
  accessToken: string;
}

export interface AuthResponse {
  flagStatus: boolean;
  value: {
    jwtToken: string;
  };
  error: string | null;
}

export interface QuoteRequest {
  faceAmount: number;
  benefitPeriod: number;
  flagTobaccoUse: boolean;
  gender: 1 | 2; // 1 = Male, 2 = Female
  stateCode: string;
  zipCode?: string | null;
  rateClass?: string;
  healthClass?: string;
  healthClass?: 'Excellent' | 'Great' | 'Good' | 'Average';
  age?: number;
  dateOfBirth?: string;
  riders?: Array<{
    rider: string;
    riderFaceAmount: number;
  }>;
  paymentFreq: 1 | 12; // 1 = Annually, 12 = Monthly
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNum?: string;
}

export interface QuoteResponse {
  flagStatus: boolean;
  value: {
    productName: string;
    selectedQuote: {
      quoteResponseId: string;
      quoteAmount: number;
      premiumSaveWhenSelectingAnnual: number;
      faceAmount: number;
      benefitPeriod: number;
      paymentFrequency: string;
      selectedRiders: Array<{
        riderValue: string;
        riderLabel: string;
        riderQuoteAmount: number;
        faceAmount: number;
      }>;
    };
  };
  error: string | null;
}

// src/lib/instabrain/api.ts
import axios, { AxiosInstance } from 'axios';

export class InstaBrainAPI {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  private jwtToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(baseURL: string = 'https://api.instabrainsandbox.io/api') {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.authenticate();
          // Retry the original request
          const originalRequest = error.config;
          return this.axiosInstance(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  private async authenticate(): Promise<void> {
    try {
      const credentials: AuthCredentials = {
        userId: process.env.INSTABRAIN_USER_ID as unknown as number,
        accessToken: process.env.INSTABRAIN_ACCESS_TOKEN as string,
      };

      const response = await this.axiosInstance.post<AuthResponse>(
        '/quickquoterv2/auth',
        credentials
      );

      if (!response.data.flagStatus || !response.data.value.jwtToken) {
        throw new Error('Authentication failed');
      }

      this.jwtToken = response.data.value.jwtToken;
      this.tokenExpiry = Date.now() + 29 * 60 * 1000; // Set expiry to 29 minutes
      
      // Update axios instance headers with new token
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.jwtToken}`;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.jwtToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  public async getQuote(quoteRequest: QuoteRequest): Promise<QuoteResponse> {
    await this.ensureAuthenticated();

    try {
      const response = await this.axiosInstance.post<QuoteResponse>(
        '/thirdpartyibtermquote/get',
        quoteRequest
      );

      if (!response.data.flagStatus) {
        throw new Error(response.data.error || 'Failed to get quote');
      }

      return response.data;
    } catch (error) {
      console.error('Quote error:', error);
      throw error;
    }
  }

  public async startApplication(
    quoteResponseId: string
  ): Promise<{
    agentLink: string;
    eAppAgentLink: string;
    applicantLink: string;
  }> {
    await this.ensureAuthenticated();

    try {
      const response = await this.axiosInstance.post(
        '/thirdpartyibtermstartapp/start-application',
        {
          quoteResponseId
        }
      );

      if (!response.data.flagStatus) {
        throw new Error(response.data.error || 'Failed to start application');
      }

      return response.data.value;
    } catch (error) {
      console.error('Start application error:', error);
      throw error;
    }
  }
}
