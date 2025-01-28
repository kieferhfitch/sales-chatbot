// src/lib/services/instabrain/types.ts

export type Gender = 1 | 2 | 3; // 1 = Male, 2 = Female, 3 = Unknown

export type RateClass = 'Preferred Plus' | 'Preferred' | 'Standard' | 'Standard Extra';
export type HealthClass = 'Excellent' | 'Great' | 'Good' | 'Average';
export type PaymentFrequency = 1 | 12; // 1 = Annually, 12 = Monthly

export type Height = {
  feet: number;
  inches: number;
};

export type Rider = {
  rider: 'ADB Rider' | 'Dependent Child Rider';
  riderFaceAmount: number;
};

export interface QuoteRequest {
  faceAmount: number;
  benefitPeriod: number;
  flagTobaccoUse: boolean;
  gender: Gender;
  stateCode?: string;
  zipCode?: string;
  rateClass?: RateClass;
  healthClass?: HealthClass;
  height?: Height;
  weightInLbs?: number;
  age?: number;
  dateOfBirth?: string;
  riders?: Rider[];
  paymentFreq: PaymentFrequency;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNum?: string;
}

export interface QuoteResponse {
  flagStatus: boolean;
  value?: {
    productName: string;
    selectedQuote: {
      quoteResponseId: string;
      quoteAmount: number;
      premiumSaveWhenSelectingAnnual?: number;
      faceAmount: number;
      benefitPeriod: number;
      benefitPeriodUnit: string;
      paymentFrequency: string;
      isMedicalRequired: boolean;
      selectedRiders?: {
        riderValue: string;
        riderLabel: string;
        riderQuoteAmount: number;
        faceAmount: number;
      }[];
      hint?: {
        title: string;
        description: string;
      };
    };
  };
  error?: string | null;
}

export interface StartApplicationRequest {
  quoteResponseId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface StartApplicationResponse {
  flagStatus: boolean;
  value?: {
    agentLink: string;
    eAppAgentLink: string;
    applicantLink: string;
  };
  error?: string;
}

export interface AuthResponse {
  flagStatus: boolean;
  value?: {
    jwtToken: string;
  };
  error?: string | null;
}

// Constants for validation
export const CONSTANTS = {
  MIN_FACE_AMOUNT: 50000,
  MAX_FACE_AMOUNT: 1000000,
  MIN_AGE: 18,
  MAX_AGE: 60,
  MIN_BENEFIT_PERIOD: 10,
  MAX_BENEFIT_PERIOD: 30,
  ADB_RIDER: {
    MIN_AMOUNT: 25000,
    MAX_AMOUNT: 250000
  },
  CHILD_RIDER: {
    MIN_AMOUNT: 5000,
    MAX_AMOUNT: 25000
  }
} as const;
