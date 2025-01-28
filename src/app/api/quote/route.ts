// src/app/api/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { instaBrainClient } from '@/lib/services/instabrain/client';
import { validateQuoteRequest } from '@/lib/services/instabrain/validators';
import { QuoteRequest } from '@/lib/services/instabrain/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Format phone number if present
    if (body.phoneNum) {
      body.phoneNum = body.phoneNum.replace(/\D/g, '');
    }

    // Validate request
    const quoteRequest: QuoteRequest = body;
    validateQuoteRequest(quoteRequest);

    // Get quote from InstaBrain
    const quoteResponse = await instaBrainClient.getQuote(quoteRequest);

    // Check for error response
    if (!quoteResponse.flagStatus || quoteResponse.error) {
      return NextResponse.json(
        { error: quoteResponse.error || 'Failed to get quote' },
        { status: 400 }
      );
    }

    // Return successful response
    return NextResponse.json(quoteResponse);
  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'QuoteValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Error in quote endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional GET handler for testing the endpoint
export async function GET() {
  return NextResponse.json(
    { message: 'Quote endpoint is working. Please use POST to get a quote.' },
    { status: 200 }
  );
}
