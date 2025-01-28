// src/pages/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { InstaBrainAPI } from '@/lib/instabrain/api';
import { QuoteValidator } from '@/lib/instabrain/validators';
import { InsuranceCalculator } from '@/lib/utils/calculations';
import { ConversationContext } from '@/lib/openai/types';

const openai = new OpenAI();
const instaBrainAPI = new InstaBrainAPI();

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    
    // Initialize or use existing context
    const conversationContext: ConversationContext = context || {
      quoteParams: {},
      stage: 'initial',
      userInput: {
        income: 0,
        totalDebt: 0,
        dependents: []
      }
    };

    // Prepare conversation history for OpenAI
    const messages = [
      { 
        role: 'system', 
        content: `You are a friendly and efficient life insurance assistant. Your goal is to help users get a term life insurance quote through natural conversation.

Key Parameters and Constraints:
- Age must be between 18-60
- Coverage amount (faceAmount) limits:
  * Up to age 55: $50,000 to $1,000,000
  * Age 56: $50,000 to $900,000
  * Age 57: $50,000 to $800,000
  * Age 58: $50,000 to $700,000
  * Age 59: $50,000 to $600,000
  * Age 60: $50,000 to $500,000

- Term Length (benefitPeriod) options:
  * Up to age 45: 10, 20, or 30 years
  * Age 45-50 (non-smoker): 10, 20, or 30 years
  * Age 45-50 (smoker): 10 or 20 years
  * Age 51-60: 10 or 20 years

- Riders Available:
  * ADB (Accidental Death Benefit): $25,000 to $250,000
  * Child Rider: $5,000 to $25,000

Current conversation stage: ${conversationContext.stage}
Current parameters gathered: ${JSON.stringify(conversationContext.quoteParams)}

Remember:
1. Ask one question at a time
2. Stay within product constraints
3. Be conversational but efficient
4. Validate all information
5. Suggest coverage based on DIME method when appropriate`
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
          name: "calculateCoverage",
          description: "Calculate suggested coverage amount using DIME method",
          parameters: {
            type: "object",
            properties: {
              income: { type: "number" },
              totalDebt: { type: "number" },
              dependents: { 
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    age: { type: "number" }
                  }
                }
              },
              age: { type: "number" }
            },
            required: ["income", "totalDebt", "age"]
          }
        },
        {
          name: "getQuote",
          description: "Get a life insurance quote",
          parameters: {
            type: "object",
            properties: {
              faceAmount: { type: "number" },
              benefitPeriod: { type: "number" },
              flagTobaccoUse: { type: "boolean" },
              gender: { type: "number", enum: [1, 2, 3] },
              stateCode: { type: "string" },
              age: { type: "number" },
              riders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rider: { type: "string" },
                    riderFaceAmount: { type: "number" }
                  }
                }
              },
              paymentFreq: { type: "number", enum: [1, 12] }
            },
            required: ["faceAmount", "benefitPeriod", "flagTobaccoUse", "gender", "stateCode", "age"]
          }
        }
      ]
    });

    const assistantResponse = completion.choices[0].message;
    let quote = null;
    let newContext = { ...conversationContext };

    // Handle function calls
    if (assistantResponse.function_call) {
      const functionArgs = JSON.parse(assistantResponse.function_call.arguments);
      
      if (assistantResponse.function_call.name === 'calculateCoverage') {
        const coverage = InsuranceCalculator.calculateDIMECoverage({
          annualIncome: functionArgs.income,
          totalDebt: functionArgs.totalDebt,
          dependents: functionArgs.dependents
        });

        // Add calculation result to messages for AI context
        messages.push({
          role: 'system',
          content: `Suggested coverage: ${InsuranceCalculator.formatCurrency(coverage.suggestedAmount)}\n` +
                   `Breakdown:\n` +
                   `- Debt Coverage: ${InsuranceCalculator.formatCurrency(coverage.breakdown.debtCoverage)}\n` +
                   `- Income Coverage: ${InsuranceCalculator.formatCurrency(coverage.breakdown.incomeCoverage)}\n` +
                   `- Education Coverage: ${InsuranceCalculator.formatCurrency(coverage.breakdown.educationCoverage)}`
        });
      }
      
      if (assistantResponse.function_call.name === 'getQuote') {
        const validation = QuoteValidator.validateQuoteRequest(functionArgs);
        
        if (validation.isValid) {
          // Get quote from InstaBrain API
          const quoteResponse = await instaBrainAPI.getQuote(functionArgs);
          quote = quoteResponse.value.selectedQuote;
          
          newContext = {
            ...newContext,
            lastQuoteId: quote.quoteResponseId,
            stage: 'quote_presented',
            quoteParams: functionArgs
          };
        } else {
          messages.push({
            role: 'system',
            content: `Quote validation failed: ${validation.errors.join(', ')}`
          });
        }
      }
    }

    // Get final response if needed
    let finalResponse = assistantResponse.content;
    if (messages.length > 2) {
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [...messages, assistantResponse],
        temperature: 0.7
      });
      finalResponse = finalCompletion.choices[0].message.content;
    }

    return NextResponse.json({
      message: finalResponse,
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
