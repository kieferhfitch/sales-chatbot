// src/app/api/requote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { instaBrainClient } from '@/lib/services/instabrain/client';
import { validateQuoteRequest } from '@/lib/services/instabrain/validators';
import { QuoteRequest } from '@/lib/services/instabrain/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Ensure we have the original quote parameters
    if (!body.originalQuoteId) {
      return NextResponse.json(
        { error: 'Original quote ID is required for requoting' },
        { status: 400 }
      );
    }

    // Format phone number if present
    if (body.phoneNum) {
      body.phoneNum = body.phoneNum.replace(/\D/g, '');
    }

    // Create new quote request from updated parameters
    const quoteRequest: QuoteRequest = {
      ...body.originalQuote,
      ...body.updates
    };

    // Validate the combined request
    validateQuoteRequest(quoteRequest);

    // Get new quote from InstaBrain
    const quoteResponse = await instaBrainClient.getQuote(quoteRequest);

    // Check for error response
    if (!quoteResponse.flagStatus || quoteResponse.error) {
      return NextResponse.json(
        { error: quoteResponse.error || 'Failed to get updated quote' },
        { status: 400 }
      );
    }

    // Return successful response with both old and new quotes for comparison
    return NextResponse.json({
      originalQuoteId: body.originalQuoteId,
      updatedQuote: quoteResponse
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
    console.error('Error in requote endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
