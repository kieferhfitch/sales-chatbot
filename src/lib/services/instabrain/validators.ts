// src/lib/services/instabrain/validators.ts

import { QuoteRequest, CONSTANTS, Rider } from './types';

interface ValidationError {
  field: string;
  message: string;
}

export class QuoteValidationError extends Error {
  constructor(public errors: ValidationError[]) {
    super('Quote validation failed');
    this.name = 'QuoteValidationError';
  }
}

function validateAge(age: number | undefined, dateOfBirth: string | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!age && !dateOfBirth) {
    errors.push({
      field: 'age',
      message: 'Either age or dateOfBirth must be provided'
    });
    return errors;
  }

  if (age) {
    if (age < CONSTANTS.MIN_AGE || age > CONSTANTS.MAX_AGE) {
      errors.push({
        field: 'age',
        message: `Age must be between ${CONSTANTS.MIN_AGE} and ${CONSTANTS.MAX_AGE}`
      });
    }
  }

  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < CONSTANTS.MIN_AGE || age > CONSTANTS.MAX_AGE) {
      errors.push({
        field: 'dateOfBirth',
        message: `Age calculated from date of birth must be between ${CONSTANTS.MIN_AGE} and ${CONSTANTS.MAX_AGE}`
      });
    }
  }

  return errors;
}

function validateFaceAmount(faceAmount: number, age: number): ValidationError[] {
  const errors: ValidationError[] = [];
  let maxAmount = CONSTANTS.MAX_FACE_AMOUNT;

  // Adjust max amount based on age according to documentation
  if (age >= 56) maxAmount = 900000;
  if (age >= 57) maxAmount = 800000;
  if (age >= 58) maxAmount = 700000;
  if (age >= 59) maxAmount = 600000;
  if (age >= 60) maxAmount = 500000;

  if (faceAmount < CONSTANTS.MIN_FACE_AMOUNT || faceAmount > maxAmount) {
    errors.push({
      field: 'faceAmount',
      message: `Face amount must be between ${CONSTANTS.MIN_FACE_AMOUNT} and ${maxAmount} for age ${age}`
    });
  }

  return errors;
}

function validateBenefitPeriod(benefitPeriod: number, age: number, flagTobaccoUse: boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Define available periods based on age and tobacco use
  let availablePeriods: number[] = [];
  
  if (age <= 45) {
    availablePeriods = [10, 20, 30];
  } else if (age <= 50) {
    availablePeriods = flagTobaccoUse ? [10, 20] : [10, 20, 30];
  } else if (age <= 60) {
    availablePeriods = [10, 20];
  }

  if (!availablePeriods.includes(benefitPeriod)) {
    errors.push({
      field: 'benefitPeriod',
      message: `Invalid benefit period for age ${age}${flagTobaccoUse ? ' with tobacco use' : ''}. Available periods: ${availablePeriods.join(', ')}`
    });
  }

  return errors;
}

function validateRiders(riders: Rider[] | undefined, faceAmount: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!riders) return errors;

  riders.forEach((rider, index) => {
    if (rider.rider === 'ADB Rider') {
      if (rider.riderFaceAmount < CONSTANTS.ADB_RIDER.MIN_AMOUNT || 
          rider.riderFaceAmount > CONSTANTS.ADB_RIDER.MAX_AMOUNT) {
        errors.push({
          field: `riders[${index}].riderFaceAmount`,
          message: `ADB Rider amount must be between ${CONSTANTS.ADB_RIDER.MIN_AMOUNT} and ${CONSTANTS.ADB_RIDER.MAX_AMOUNT}`
        });
      }
    } else if (rider.rider === 'Dependent Child Rider') {
      if (rider.riderFaceAmount < CONSTANTS.CHILD_RIDER.MIN_AMOUNT || 
          rider.riderFaceAmount > CONSTANTS.CHILD_RIDER.MAX_AMOUNT) {
        errors.push({
          field: `riders[${index}].riderFaceAmount`,
          message: `Child Rider amount must be between ${CONSTANTS.CHILD_RIDER.MIN_AMOUNT} and ${CONSTANTS.CHILD_RIDER.MAX_AMOUNT}`
        });
      }
    }

    // Ensure rider face amount is not greater than policy face amount
    if (rider.riderFaceAmount > faceAmount) {
      errors.push({
        field: `riders[${index}].riderFaceAmount`,
        message: 'Rider face amount cannot be greater than policy face amount'
      });
    }
  });

  return errors;
}

function validateLocation(stateCode: string | undefined, zipCode: string | undefined): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!stateCode && !zipCode) {
    errors.push({
      field: 'location',
      message: 'Either stateCode or zipCode must be provided'
    });
  }

  if (stateCode) {
    if (!/^[A-Z]{2}$/.test(stateCode)) {
      errors.push({
        field: 'stateCode',
        message: 'State code must be a valid 2-letter US state code'
      });
    }

    // Handle NY and WY exclusions
    if (['NY', 'WY'].includes(stateCode)) {
      errors.push({
        field: 'stateCode',
        message: 'Product not available in New York or Wyoming'
      });
    }
  }

  if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
    errors.push({
      field: 'zipCode',
      message: 'ZIP code must be in valid US format (12345 or 12345-6789)'
    });
  }

  return errors;
}

export function validateQuoteRequest(request: QuoteRequest): void {
  const errors: ValidationError[] = [];
  
  // Get age for validation purposes
  let calculatedAge = request.age;
  if (!calculatedAge && request.dateOfBirth) {
    const birthDate = new Date(request.dateOfBirth);
    const today = new Date();
    calculatedAge = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust age if birthday hasn't occurred this year
    const birthMonth = birthDate.getMonth();
    const currentMonth = today.getMonth();
    if (currentMonth < birthMonth || (currentMonth === birthMonth && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
  }

  // Combine all validations
  errors.push(
    ...validateAge(request.age, request.dateOfBirth),
    ...validateLocation(request.stateCode, request.zipCode),
    ...(calculatedAge ? validateFaceAmount(request.faceAmount, calculatedAge) : []),
    ...(calculatedAge ? validateBenefitPeriod(request.benefitPeriod, calculatedAge, request.flagTobaccoUse) : []),
    ...validateRiders(request.riders, request.faceAmount)
  );

  // Validate phone number format if provided
  if (request.phoneNum && !/^\d{10}$/.test(request.phoneNum.replace(/\D/g, ''))) {
    errors.push({
      field: 'phoneNum',
      message: 'Phone number must be 10 digits'
    });
  }

  // Email validation if provided
  if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format'
    });
  }

  // Validate height and weight if either is provided
  if ((request.height && !request.weightInLbs) || (!request.height && request.weightInLbs)) {
    errors.push({
      field: 'height_weight',
      message: 'Both height and weight must be provided together'
    });
  }

  if (request.height) {
    if (request.height.feet < 4 || request.height.feet > 7) {
      errors.push({
        field: 'height.feet',
        message: 'Height in feet must be between 4 and 7'
      });
    }
    if (request.height.inches < 0 || request.height.inches > 11) {
      errors.push({
        field: 'height.inches',
        message: 'Height in inches must be between 0 and 11'
      });
    }
  }

  // Throw validation error if any errors exist
  if (errors.length > 0) {
    throw new QuoteValidationError(errors);
  }
}

// Helper function for application validation
export function validateStartApplicationRequest(request: StartApplicationRequest): void {
  const errors: ValidationError[] = [];

  if (!request.quoteResponseId) {
    errors.push({
      field: 'quoteResponseId',
      message: 'Quote response ID is required'
    });
  }

  if (request.phoneNumber && !/^\d{10}$/.test(request.phoneNumber.replace(/\D/g, ''))) {
    errors.push({
      field: 'phoneNumber',
      message: 'Phone number must be 10 digits'
    });
  }

  if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format'
    });
  }

  if (errors.length > 0) {
    throw new QuoteValidationError(errors);
  }
}
