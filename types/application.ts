// types/application.ts
export interface ApplicationRequest {
  quoteResponseId: string;
}

export interface ApplicationLinks {
  agentLink: string;
  eAppAgentLink: string;
  applicantLink: string;
}

export interface ApplicationResponse {
  success: boolean;
  data?: {
    applicationLinks: ApplicationLinks;
    message: string;
  };
  error?: string;
}

export interface ApplicationError {
  status: number;
  message: string;
}
