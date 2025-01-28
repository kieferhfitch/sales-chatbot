// src/pages/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { InstaBrainAPI } from '@/lib/instabrain/api';
import { QuoteValidator } from '@/lib/instabrain/validators';
import { InsuranceCalculator } from '@/lib/utils/calculations';

const openai = new OpenAI();
const instaBrainAPI = new InstaBrainAPI();

export interface ConversationContext {
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

const SYSTEM_PROMPT = `You are an efficient and friendly life insurance quote assistant. Your goal is to help users get a quote for instant-issue, no-medical-exam term life insurance in 5-10 minutes through natural conversation.

## Core Parameters and Constraints
[Previous prompt content here...]
`;

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    
    // Initialize or use existing context
    const conversationContext: ConversationContext = context || {
      quoteParams: {},
      stage: 'initial',
      userInput: {}
    };

    // Construct conversation history
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
          name: "processUserInput",
          description: "Extract and validate user information from their message",
          parameters: {
            type: "object",
            properties: {
              extractedInfo: {
                type: "object",
                properties: {
                  age: { type: "number" },
                  gender: { type: "number", enum: [1, 2] },
                  stateCode: { type: "string" },
                  flagTobaccoUse: { type: "boolean" },
                  healthClass: { 
                    type: "string",
                    enum: ["Excellent", "Great", "Good", "Average"]
                  },
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
                  }
                }
              }
            }
          }
        },
        {
          name: "calculateCoverage",
          description: "Calculate suggested coverage based on DIME method",
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
              }
            }
          }
        },
        {
          name: "getQuote",
          description: "Get a life insurance quote",
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

    // Handle function calls
    if (assistantResponse.function_call) {
      const functionName = assistantResponse.function_call.name;
      const functionArgs = JSON.parse(assistantResponse.function_call.arguments);

      switch (functionName) {
        case 'processUserInput':
          // Update context with extracted information
          newContext = updateContextWithUserInput(newContext, functionArgs.extractedInfo);
          break;

        case 'calculateCoverage':
          // Calculate coverage using DIME method
          const coverageSuggestion = InsuranceCalculator.calculateDIMECoverage(functionArgs);
          messages.push({
            role: 'system',
            content: `Suggested coverage: ${coverageSuggestion.suggestedAmount}
                     Breakdown: ${JSON.stringify(coverageSuggestion.breakdown)}`
          });
          break;

        case 'getQuote':
          // Validate and get quote
          const validation = QuoteValidator.validateQuoteRequest(functionArgs.quoteParams);
          
          if (validation.isValid) {
            const quoteResponse = await instaBrainAPI.getQuote(functionArgs.quoteParams);
            quote = quoteResponse.value.selectedQuote;
            
            newContext = {
              ...newContext,
              stage: 'quote_presented',
              quoteParams: functionArgs.quoteParams
            };
          } else {
            messages.push({
              role: 'system',
              content: `Quote validation failed: ${validation.errors.join(', ')}`
            });
          }
          break;
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

function updateContextWithUserInput(
  context: ConversationContext, 
  input: any
): ConversationContext {
  const newContext = { ...context };

  // Update quote parameters
  if (input.age) newContext.quoteParams.age = input.age;
  if (input.gender) newContext.quoteParams.gender = input.gender;
  if (input.stateCode) newContext.quoteParams.stateCode = input.stateCode;
  if (input.flagTobaccoUse !== undefined) newContext.quoteParams.flagTobaccoUse = input.flagTobaccoUse;
  if (input.healthClass) newContext.quoteParams.healthClass = input.healthClass;

  // Update user input for DIME calculation
  if (input.income) newContext.userInput!.income = input.income;
  if (input.totalDebt) newContext.userInput!.totalDebt = input.totalDebt;
  if (input.dependents) newContext.userInput!.dependents = input.dependents;

  // Update stage if needed
  if (context.stage === 'initial' && Object.keys(newContext.quoteParams).length > 0) {
    newContext.stage = 'gathering_info';
  }

  return newContext;
}
