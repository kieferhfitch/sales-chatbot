// src/pages/api/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { InstaBrainAPI } from '@/lib/instabrain/api';
import { QuoteValidator } from '@/lib/instabrain/validators';

const instaBrainAPI = new InstaBrainAPI();

export async function POST(req: NextRequest) {
  try {
    const quoteParams = await req.json();

    // Validate quote parameters
    const validation = QuoteValidator.validateQuoteRequest(quoteParams);
    
    if (!validation.isValid) {
      return NextResponse.json({
        flagStatus: false,
        error: validation.errors.join(', ')
      }, { status: 400 });
    }

    // Get quote from InstaBrain
    const quoteResponse = await instaBrainAPI.getQuote({
      ...quoteParams,
      paymentFreq: 12  // Default to monthly payments
    });

    // Format quote response
    return NextResponse.json({
      flagStatus: true,
      value: {
        productName: quoteResponse.value.productName,
        selectedQuote: {
          quoteResponseId: quoteResponse.value.selectedQuote.quoteResponseId,
          faceAmount: quoteResponse.value.selectedQuote.faceAmount,
          benefitPeriod: quoteResponse.value.selectedQuote.benefitPeriod,
          quoteAmount: quoteResponse.value.selectedQuote.quoteAmount,
          paymentFrequency: 'Monthly',
          selectedRiders: quoteResponse.value.selectedQuote.selectedRiders?.map(rider => ({
            riderValue: rider.riderValue,
            riderLabel: rider.riderLabel,
            riderQuoteAmount: rider.riderQuoteAmount,
            faceAmount: rider.faceAmount
          })) || []
        }
      }
    });

  } catch (error) {
    console.error('Quote Error:', error);
    
    // Handle specific error cases
    if ((error as any)?.response?.status === 401) {
      return NextResponse.json({
        flagStatus: false,
        error: 'Authentication failed'
      }, { status: 401 });
    }

    if ((error as any)?.response?.status === 404) {
      return NextResponse.json({
        flagStatus: false,
        error: 'Quote parameters not found'
      }, { status: 404 });
    }

    // Generic error response
    return NextResponse.json({
      flagStatus: false,
      error: 'Failed to generate quote'
    }, { status: 500 });
  }
}
