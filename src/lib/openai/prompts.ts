// src/lib/openai/prompts.ts
export const SYSTEM_PROMPT = `You are an efficient and friendly life insurance quote assistant. Your goal is to help users get a quote for instant-issue, no-medical-exam term life insurance in 5-10 minutes through natural conversation.

## Core Parameters and Constraints

### Coverage Limits by Age
- Ages 18-55: $50,000 to $1,000,000
- Age 56: $50,000 to $900,000
- Age 57: $50,000 to $800,000
- Age 58: $50,000 to $700,000
- Age 59: $50,000 to $600,000
- Age 60: $50,000 to $500,000

### Term Length Options
- Up to age 45: 10, 20, or 30 years
- Age 45-50 (non-smoker): 10, 20, or 30 years
- Age 45-50 (smoker): 10 or 20 years
- Age 51-60: 10 or 20 years

### Rider Options
- ADB (Accidental Death Benefit): $25,000 to $250,000
- Child Rider: $5,000 to $25,000
Note: Rider availability varies by state

## Information Collection Order
1. Age (required first)
2. Gender (Male/Female)
3. State (for rider validation)
4. Tobacco use (yes/no)
5. Health class (Excellent, Great, Good, or Average)
6. Income (for DIME calculation)
7. Total debt (for DIME calculation)
8. Dependents (if any, for education costs)

## Key Behaviors
- One question at a time
- Clear, concise responses
- Natural conversation style
- Validate inputs against product constraints
- Explain limits or restrictions when relevant

Current conversation stage: ${context.stage}
Current parameters gathered: ${JSON.stringify(context.quoteParams)}`;

// src/pages/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { InstaBrainAPI } from '@/lib/instabrain/api';
import { QuoteValidator } from '@/lib/instabrain/validators';
import { SYSTEM_PROMPT } from '@/lib/openai/prompts';
import { ConversationContext } from '@/lib/openai/types';

const openai = new OpenAI();
const instaBrainAPI = new InstaBrainAPI();

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    
    // Initialize or use existing context
    const conversationContext: ConversationContext = context || {
      quoteParams: {},
      stage: 'initial'
    };

    // Prepare messages for OpenAI
    const messages = [
      { 
        role: 'system', 
        content: SYSTEM_PROMPT.replace('${context.stage}', conversationContext.stage)
                            .replace('${JSON.stringify(context.quoteParams)}', 
                              JSON.stringify(conversationContext.quoteParams, null, 2))
      }
    ];

    // Add user message
    messages.push({ role: 'user', content: message });

    // Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      functions: [
        {
          name: "getQuote",
          description: "Get a life insurance quote based on gathered parameters",
          parameters: {
            type: "object",
            properties: {
              quoteParams: {
                type: "object",
                properties: {
                  faceAmount: { type: "number" },
                  benefitPeriod: { type: "number" },
                  flagTobaccoUse: { type: "boolean" },
                  gender: { type: "number", enum: [1, 2] },
                  stateCode: { type: "string" },
                  age: { type: "number" },
                  healthClass: { 
                    type: "string", 
                    enum: ["Excellent", "Great", "Good", "Average"]
                  },
                  riders: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rider: { type: "string" },
                        riderFaceAmount: { type: "number" }
                      }
                    }
                  }
                }
              }
            },
            required: ["quoteParams"]
          }
        }
      ]
    });

    const assistantResponse = completion.choices[0].message;
    let quote = null;
    let newContext = { ...conversationContext };

    // Handle function calls if present
    if (assistantResponse.function_call) {
      if (assistantResponse.function_call.name === 'getQuote') {
        const functionArgs = JSON.parse(assistantResponse.function_call.arguments);
        
        // Validate quote parameters
        const validation = QuoteValidator.validateQuoteRequest(functionArgs.quoteParams);
        
        if (validation.isValid) {
          // Get quote from InstaBrain API
          const quoteResponse = await instaBrainAPI.getQuote(functionArgs.quoteParams);
          quote = quoteResponse.value.selectedQuote;
          
          // Update context with quote ID and stage
          newContext = {
            ...newContext,
            lastQuoteId: quote.quoteResponseId,
            stage: 'quote_presented'
          };
        } else {
          // Handle validation errors
          messages.push({
            role: 'system',
            content: `Quote validation failed: ${validation.errors.join(', ')}`
          });
        }
      }
    }

    return NextResponse.json({
      message: assistantResponse.content,
      context: newContext,
      quote
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
