// src/lib/openai/api.ts
import OpenAI from 'openai';

class OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string
    });
  }

  async getChatCompletion(
    messages: Array<{ role: string; content: string }>,
    functions?: OpenAI.Chat.ChatCompletionCreateParams.Function[],
  ) {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4-turbo-preview",
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
    const completion = await this.getChatCompletion(
      [
        {
          role: 'system',
          content: 'Extract parameters from user message based on the provided schema. Only extract clear, explicit information.'
        },
        { role: 'user', content: message }
      ],
      [parameterSchema]
    );

    if (completion.function_call) {
      return JSON.parse(completion.function_call.arguments);
    }

    return null;
  }
}

// Export a singleton instance
export const openAIClient = new OpenAIClient();
