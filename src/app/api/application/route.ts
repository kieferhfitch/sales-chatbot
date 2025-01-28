// src/app/api/application/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { instaBrainClient } from '@/lib/services/instabrain/client';
import { validateStartApplicationRequest } from '@/lib/services/instabrain/validators';
import { StartApplicationRequest } from '@/lib/services/instabrain/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Format phone number if present
    if (body.phoneNumber) {
      body.phoneNumber = body.phoneNumber.replace(/\D/g, '');
    }

    // Create and validate application request
    const applicationRequest: StartApplicationRequest = {
      quoteResponseId: body.quoteResponseId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber
    };

    validateStartApplicationRequest(applicationRequest);

    // Get application links from InstaBrain
    const applicationResponse = await instaBrainClient.startApplication(applicationRequest);

    // Check for error response
    if (!applicationResponse.flagStatus || applicationResponse.error) {
      return NextResponse.json(
        { error: applicationResponse.error || 'Failed to generate application link' },
        { status: 400 }
      );
    }

    // Return successful response
    return NextResponse.json({
      quoteResponseId: body.quoteResponseId,
      applicationLinks: {
        applicant: applicationResponse.value?.applicantLink,
        agent: applicationResponse.value?.agentLink,
        eAppAgent: applicationResponse.value?.eAppAgentLink
      }
    });
  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'QuoteValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Error in application endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional GET handler for testing the endpoint
export async function GET() {
  return NextResponse.json(
    { message: 'Application endpoint is working. Please use POST to generate an application link.' },
    { status: 200 }
  );
}
