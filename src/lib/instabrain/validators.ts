// src/lib/instabrain/validators.ts
import { QuoteRequest } from './types';

export class QuoteValidator {
  private static readonly EXCLUDED_STATES = ['WY', 'NY'];
  
  private static validateFaceAmount(age: number, amount: number): boolean {
    if (age <= 55) return amount >= 50000 && amount <= 1000000;
    if (age === 56) return amount >= 50000 && amount <= 900000;
    if (age === 57) return amount >= 50000 && amount <= 800000;
    if (age === 58) return amount >= 50000 && amount <= 700000;
    if (age === 59) return amount >= 50000 && amount <= 600000;
    if (age === 60) return amount >= 50000 && amount <= 500000;
    return false;
  }

  private static validateBenefitPeriod(age: number, period: number, isSmoker: boolean): boolean {
    if (age <= 45) return [10, 20, 30].includes(period);
    if (age <= 50) {
      if (isSmoker) return [10, 20].includes(period);
      return [10, 20, 30].includes(period);
    }
    if (age <= 60) return [10, 20].includes(period);
    return false;
  }

  private static validateRiders(
    stateCode: string, 
    age: number, 
    riders: QuoteRequest['riders']
  ): boolean {
    if (!riders) return true;
    
    for (const rider of riders) {
      switch (rider.rider) {
        case 'ADB Rider':
          if (rider.riderFaceAmount < 25000 || rider.riderFaceAmount > 250000) {
            return false;
          }
          break;
        case 'Dependent Child Rider':
          if (rider.riderFaceAmount < 5000 || rider.riderFaceAmount > 25000) {
            return false;
          }
          break;
        default:
          return false;
      }
    }
    
    return true;
  }

  public static validateQuoteRequest(request: QuoteRequest): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];

    // Validate state
    if (this.EXCLUDED_STATES.includes(request.stateCode)) {
      errors.push(`Product not available in ${request.stateCode}`);
    }

    // Validate age
    const age = request.age || this.calculateAge(request.dateOfBirth);
    if (age < 18 || age > 60) {
      errors.push('Age must be between 18 and 60');
    }

    // Validate face amount
    if (!this.validateFaceAmount(age, request.faceAmount)) {
      errors.push('Invalid face amount for age');
    }

    // Validate benefit period
    if (!this.validateBenefitPeriod(age, request.benefitPeriod, request.flagTobaccoUse)) {
      errors.push('Invalid benefit period for age and tobacco status');
    }

    // Validate riders
    if (!this.validateRiders(request.stateCode, age, request.riders)) {
      errors.push('Invalid rider configuration');
    }

    // Validate phone number format if provided
    if (request.phoneNum && !/^\d{10}$/.test(request.phoneNum)) {
      errors.push('Phone number must be 10 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static calculateAge(dateOfBirth?: string): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
