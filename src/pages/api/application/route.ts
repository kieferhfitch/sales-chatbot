// src/pages/api/application/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { InstaBrainAPI } from '../../../lib/instabrain/api';  // Changed from @/lib/instabrain/api

const instaBrainAPI = new InstaBrainAPI();

interface ApplicationRequest {
  quoteResponseId: string;
}

export async function POST(req: NextRequest) {
  try {
    const { quoteResponseId }: ApplicationRequest = await req.json();

    // Basic validation
    if (!quoteResponseId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Start application through InstaBrain API
    const applicationLinks = await instaBrainAPI.startApplication(quoteResponseId);

    // Return success response with application links
    return NextResponse.json({
      success: true,
      data: {
        applicationLinks,
        message: 'Application started successfully'
      }
    });

  } catch (error) {
    console.error('Application Start Error:', error);
    
    // Handle specific error cases
    if ((error as any)?.response?.status === 404) {
      return NextResponse.json(
        { error: 'Quote not found or expired' },
        { status: 404 }
      );
    }
    
    if ((error as any)?.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to start application' },
      { status: 500 }
    );
  }
}

// Types for response structure
export interface ApplicationResponse {
  success: boolean;
  data?: {
    applicationLinks: {
      agentLink: string;
      eAppAgentLink: string;
      applicantLink: string;
    };
    message: string;
  };
  error?: string;
}
