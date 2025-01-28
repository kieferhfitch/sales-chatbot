// tests/unit/validators.test.ts
import { QuoteValidator } from '@/lib/instabrain/validators';

describe('QuoteValidator', () => {
  describe('validateQuoteRequest', () => {
    it('should validate age-based coverage limits correctly', () => {
      const validRequest = {
        age: 35,
        faceAmount: 500000,
        benefitPeriod: 20,
        flagTobaccoUse: false,
        gender: 1,
        stateCode: 'AZ',
        healthClass: 'Excellent',
        paymentFreq: 12
      };

      const result = QuoteValidator.validateQuoteRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject coverage amount over age limit', () => {
      const invalidRequest = {
        age: 59,
        faceAmount: 800000, // Over limit for age 59
        benefitPeriod: 20,
        flagTobaccoUse: false,
        gender: 1,
        stateCode: 'AZ',
        healthClass: 'Excellent',
        paymentFreq: 12
      };

      const result = QuoteValidator.validateQuoteRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid face amount for age');
    });
  });
});

// tests/unit/calculations.test.ts
import { InsuranceCalculator } from '@/lib/utils/calculations';

describe('InsuranceCalculator', () => {
  describe('calculateDIMECoverage', () => {
    it('should calculate correct coverage based on DIME method', () => {
      const inputs = {
        annualIncome: 100000,
        totalDebt: 250000,
        dependents: [{ age: 10 }]
      };

      const result = InsuranceCalculator.calculateDIMECoverage(inputs);
      
      expect(result.suggestedAmount).toBeDefined();
      expect(result.breakdown.incomeCoverage).toBe(1000000); // 10x income
      expect(result.breakdown.debtCoverage).toBe(250000);
      expect(result.breakdown.educationCoverage).toBeGreaterThan(0);
    });

    it('should respect maximum coverage limits', () => {
      const inputs = {
        annualIncome: 200000,
        totalDebt: 1000000,
        dependents: [{ age: 5 }, { age: 7 }]
      };

      const result = InsuranceCalculator.calculateDIMECoverage(inputs);
      expect(result.suggestedAmount).toBeLessThanOrEqual(1000000);
    });
  });
});

// tests/unit/stateValidation.test.ts
import { StateValidator } from '@/lib/utils/stateValidation';

describe('StateValidator', () => {
  describe('isStateAvailable', () => {
    it('should correctly identify available states', () => {
      expect(StateValidator.isStateAvailable('AZ')).toBe(true);
      expect(StateValidator.isStateAvailable('NY')).toBe(false);
    });
  });

  describe('isRiderAvailable', () => {
    it('should correctly check rider availability by state', () => {
      const state = 'AZ';
      expect(StateValidator.isRiderAvailable(state, 'ADB Rider')).toBe(true);
      expect(StateValidator.isRiderAvailable(state, 'Dependent Child Rider')).toBe(true);
    });
  });
});
