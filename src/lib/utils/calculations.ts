// src/lib/utils/calculations.ts

interface DIMEInputs {
  annualIncome?: number;
  totalDebt?: number;
  mortgageBalance?: number;
  dependents?: Array<{ age: number }>;
}

export class InsuranceCalculator {
  // Constants for calculations
  private static readonly INCOME_MULTIPLIER = 10;
  private static readonly COLLEGE_COST_ESTIMATE = 100000; // Base cost for 4-year college
  private static readonly MIN_COVERAGE = 50000;
  /**
   * Get max coverage amount based on age
   */
  private static getMaxCoverage(age: number): number {
    if (age <= 55) return 1000000;
    if (age === 56) return 900000;
    if (age === 57) return 800000;
    if (age === 58) return 700000;
    if (age === 59) return 600000;
    if (age === 60) return 500000;
    return 0;
  }

  /**
   * Calculate suggested coverage amount using DIME method
   * (Debt, Income, Mortgage, Education)
   */
  public static calculateDIMECoverage(inputs: DIMEInputs): {
    suggestedAmount: number;
    breakdown: {
      debtCoverage: number;
      incomeCoverage: number;
      educationCoverage: number;
      total: number;
    };
  } {
    // Calculate debt coverage (including mortgage)
    const debtCoverage = (inputs.totalDebt || 0) + (inputs.mortgageBalance || 0);

    // Calculate income replacement (10x annual income)
    const incomeCoverage = (inputs.annualIncome || 0) * this.INCOME_MULTIPLIER;

    // Calculate education costs for dependents
    const educationCoverage = this.calculateEducationCosts(inputs.dependents || []);

    // Calculate total coverage needed
    let total = debtCoverage + incomeCoverage + educationCoverage;

    // Round to nearest 50k for cleaner numbers
    total = Math.ceil(total / 50000) * 50000;

    // Ensure within product limits
    const maxCoverage = this.getMaxCoverage(inputs.age || 0);
    const suggestedAmount = Math.max(
      this.MIN_COVERAGE,
      Math.min(total, maxCoverage)
    );

    return {
      suggestedAmount,
      breakdown: {
        debtCoverage,
        incomeCoverage,
        educationCoverage,
        total
      }
    };
  }

  /**
   * Suggest term length based on age and dependents
   */
  public static suggestTermLength(age: number, dependents?: Array<{ age: number }>): number {
    // Default to 20 years if no specific conditions are met
    let suggestedTerm = 20;

    // If there are young dependents, suggest longer term
    if (dependents && dependents.length > 0) {
      const youngestAge = Math.min(...dependents.map(d => d.age));
      const yearsToAdulthood = 18 - youngestAge;
      
      if (yearsToAdulthood > 20) {
        suggestedTerm = 30;
      }
    }

    // Adjust based on age limitations
    if (age > 50) {
      suggestedTerm = Math.min(suggestedTerm, 20);
    }
    if (age > 55) {
      suggestedTerm = Math.min(suggestedTerm, 10);
    }

    return suggestedTerm;
  }

  /**
   * Calculate estimated education costs for dependents
   */
  private static calculateEducationCosts(dependents: Array<{ age: number }>): number {
    return dependents.reduce((total, dependent) => {
      const yearsUntilCollege = 18 - dependent.age;
      // Adjust college cost estimate for inflation (assuming 3% annual increase)
      const inflatedCost = this.COLLEGE_COST_ESTIMATE * Math.pow(1.03, yearsUntilCollege);
      return total + inflatedCost;
    }, 0);
  }

  /**
   * Format currency for display
   */
  public static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
