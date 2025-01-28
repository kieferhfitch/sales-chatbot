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
