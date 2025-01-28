// src/lib/openai/types.ts
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ExtractedParameters {
  age?: number;
  gender?: 1 | 2;
  stateCode?: string;
  flagTobaccoUse?: boolean;
  healthClass?: 'Excellent' | 'Great' | 'Good' | 'Average';
  income?: number;
  totalDebt?: number;
  dependents?: Array<{ age: number }>;
}

export interface ChatResponse {
  message: string;
  parameters?: ExtractedParameters;
  requiredFields?: string[];
}
