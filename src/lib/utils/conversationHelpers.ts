// src/lib/utils/conversationHelpers.ts
import { StateValidator } from './stateValidation';

interface ConversationState {
  stage: 'initial' | 'gathering_info' | 'quote_presented' | 'adjusting_quote';
  quoteParams: Record<string, any>;
  userInput: Record<string, any>;
}

export class ConversationHelper {
  /**
   * Check if all required parameters are collected
   */
  static hasRequiredParameters(state: ConversationState): boolean {
    const required = ['age', 'gender', 'stateCode', 'flagTobaccoUse', 'healthClass'];
    return required.every(param => state.quoteParams[param] !== undefined);
  }

  /**
   * Get the next required parameter to ask for
   */
  static getNextRequiredParameter(state: ConversationState): string | null {
    const parameterOrder = [
      'age',
      'gender',
      'stateCode',
      'flagTobaccoUse',
      'healthClass',
      'income',
      'totalDebt'
    ];

    return parameterOrder.find(param => state.quoteParams[param] === undefined) || null;
  }

  /**
   * Extract numeric values from text
   */
  static extractNumericValue(text: string): number | null {
    const numbers = text.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : null;
  }

  /**
   * Format state code from user input
   */
  static formatStateCode(input: string): string | null {
    const stateCode = input.trim().toUpperCase();
    return StateValidator.isValidStateCode(stateCode) ? stateCode : null;
  }

  /**
   * Parse boolean response for tobacco use
   */
  static parseTobaccoResponse(input: string): boolean | null {
    const normalized = input.toLowerCase().trim();
    if (['yes', 'y', 'true', 'yeah', 'yep'].includes(normalized)) return true;
    if (['no', 'n', 'false', 'nah', 'nope'].includes(normalized)) return false;
    return null;
  }

  /**
   * Parse health class from user input
   */
  static parseHealthClass(input: string): 'Excellent' | 'Great' | 'Good' | 'Average' | null {
    const normalized = input.toLowerCase().trim();
    const healthClasses = {
      'excellent': 'Excellent',
      'great': 'Great',
      'good': 'Good',
      'average': 'Average'
    } as const;

    return healthClasses[normalized as keyof typeof healthClasses] || null;
  }

  /**
   * Generate appropriate follow-up question based on context
   */
  static getNextQuestion(state: ConversationState): string {
    const nextParam = this.getNextRequiredParameter(state);
    
    switch (nextParam) {
      case 'age':
        return "To get started, could you tell me your age?";
      case 'gender':
        return "Are you male or female?";
      case 'stateCode':
        return "What state do you live in?";
      case 'flagTobaccoUse':
        return "Do you use any tobacco products?";
      case 'healthClass':
        return "How would you rate your overall health? (Excellent, Great, Good, or Average)";
      case 'income':
        return "What is your annual income?";
      case 'totalDebt':
        return "What is your total debt, including mortgages and other loans?";
      default:
        return "Is there anything specific about the coverage you'd like to discuss?";
    }
  }

  /**
   * Validate and format user input based on parameter type
   */
  static validateAndFormatInput(paramName: string, input: string): any {
    switch (paramName) {
      case 'age':
        const age = this.extractNumericValue(input);
        return age && age >= 18 && age <= 60 ? age : null;
      
      case 'gender':
        const gender = input.toLowerCase().trim();
        if (gender.startsWith('m')) return 1;
        if (gender.startsWith('f')) return 2;
        return null;
      
      case 'stateCode':
        return this.formatStateCode(input);
      
      case 'flagTobaccoUse':
        return this.parseTobaccoResponse(input);
      
      case 'healthClass':
        return this.parseHealthClass(input);
      
      case 'income':
      case 'totalDebt':
        return this.extractNumericValue(input);
      
      default:
        return input;
    }
  }
}
