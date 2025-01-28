// src/lib/utils/calculations.ts
interface DIMEInputs {
  annualIncome?: number;
  totalDebt?: number;
  mortgageBalance?: number;
  dependents?: Array<{ age: number }>;
  age?: number;
}

export class InsuranceCalculator {
  private static readonly INCOME_MULTIPLIER = 10;
  private static readonly COLLEGE_COST_ESTIMATE = 100000;
  private static readonly MIN_COVERAGE = 50000;

  private static getMaxCoverage(age: number): number {
    if (age <= 55) return 1000000;
    if (age === 56) return 900000;
    if (age === 57) return 800000;
    if (age === 58) return 700000;
    if (age === 59) return 600000;
    if (age === 60) return 500000;
    return 0;
  }

  public static calculateDIMECoverage(inputs: DIMEInputs): {
    suggestedAmount: number;
    breakdown: {
      debtCoverage: number;
      incomeCoverage: number;
      educationCoverage: number;
      total: number;
    };
  } {
    const debtCoverage = (inputs.totalDebt || 0) + (inputs.mortgageBalance || 0);
    const incomeCoverage = (inputs.annualIncome || 0) * this.INCOME_MULTIPLIER;
    const educationCoverage = InsuranceCalculator.calculateEducationCosts(inputs.dependents || []);
    
    let total = debtCoverage + incomeCoverage + educationCoverage;
    total = Math.ceil(total / 50000) * 50000;
    
    const maxCoverage = InsuranceCalculator.getMaxCoverage(inputs.age || 0);
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

  public static suggestTermLength(age: number, dependents?: Array<{ age: number }>): number {
    let suggestedTerm = 20;
    
    if (dependents && dependents.length > 0) {
      const youngestAge = Math.min(...dependents.map(d => d.age));
      const yearsToAdulthood = 18 - youngestAge;
      
      if (yearsToAdulthood > 20) {
        suggestedTerm = 30;
      }
    }
    
    if (age > 50) {
      suggestedTerm = Math.min(suggestedTerm, 20);
    }
    if (age > 55) {
      suggestedTerm = Math.min(suggestedTerm, 10);
    }
    return suggestedTerm;
  }

  private static calculateEducationCosts(dependents: Array<{ age: number }>): number {
    return dependents.reduce((total, dependent) => {
      const yearsUntilCollege = 18 - dependent.age;
      const inflatedCost = this.COLLEGE_COST_ESTIMATE * Math.pow(1.03, yearsUntilCollege);
      return total + inflatedCost;
    }, 0);
  }

  public static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
