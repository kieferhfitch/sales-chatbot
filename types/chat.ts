// types/chat.ts
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  quoteParams: {
    age?: number;
    gender?: 1 | 2;
    stateCode?: string;
    flagTobaccoUse?: boolean;
    healthClass?: 'Excellent' | 'Great' | 'Good' | 'Average';
    faceAmount?: number;
    benefitPeriod?: number;
    riders?: Array<{
      rider: string;
      riderFaceAmount: number;
    }>;
  };
  stage: 'initial' | 'gathering_info' | 'quote_presented' | 'adjusting_quote';
  userInput?: {
    income?: number;
    totalDebt?: number;
    dependents?: Array<{ age: number }>;
  };
}

export interface ChatRequest {
  message: string;
  context?: ChatContext;
}

export interface ChatResponse {
  message: string;
  context: ChatContext;
  quote?: QuoteResponse;
}
