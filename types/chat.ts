export interface QuoteRequest {
  faceAmount: number;
  benefitPeriod: number;
  flagTobaccoUse: boolean;
  gender: 1 | 2 | 3;  // 1 = Male, 2 = Female, 3 = Unknown
  stateCode: string;
  healthClass: 'Excellent' | 'Great' | 'Good' | 'Average';
  age: number;
  riders?: Array<{
    rider: 'ADB Rider' | 'Dependent Child Rider';
    riderFaceAmount: number;
  }>;
  paymentFreq: 1 | 12; // 1 = Annual, 12 = Monthly
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
      selectedRiders?: Array<{
        riderValue: string;
        riderLabel: string;
        riderQuoteAmount: number;
        faceAmount: number;
      }>;
    };
  };
  error?: string | null;
}

export interface QuoteValidation {
  isValid: boolean;
  errors: string[];
}
