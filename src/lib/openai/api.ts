import OpenAI from 'openai';

class OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string
    });
  }

  async getChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    functions?: OpenAI.Chat.ChatCompletionCreateParams.Function[],
  ) {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",  // Changed to GPT-3.5
        messages,
        temperature: 0.7,
        functions,
      });
      return completion.choices[0].message;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  async extractParameters(
    message: string,
    context: any,
    parameterSchema: OpenAI.Chat.ChatCompletionCreateParams.Function
  ) {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'Extract parameters from user message based on the provided schema. Only extract clear, explicit information.'
      },
      { 
        role: 'user', 
        content: message 
      }
    ];

    const completion = await this.getChatCompletion(messages, [parameterSchema]);
    
    if (completion.function_call) {
      return JSON.parse(completion.function_call.arguments);
    }
    return null;
  }
}

// Export a singleton instance
export const openAIClient = new OpenAIClient();
