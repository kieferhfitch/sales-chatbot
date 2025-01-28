// src/lib/utils/stateValidation.ts
interface RiderAvailability {
  adbRider: boolean;
  childRider: boolean;
}

export class StateValidator {
  private static readonly EXCLUDED_STATES = ['WY', 'NY'];
  private static readonly STATE_RIDER_RULES: Record<string, RiderAvailability> = {
    // Example rules - update based on actual state rules
    'AZ': { adbRider: true, childRider: true },
    'CA': { adbRider: true, childRider: false },
    // Add more states as needed
  };

  /**
   * Check if insurance is available in the state
   */
  static isStateAvailable(stateCode: string): boolean {
    return !this.EXCLUDED_STATES.includes(stateCode.toUpperCase());
  }

  /**
   * Get available riders for a state
   */
  static getAvailableRiders(stateCode: string): RiderAvailability {
    const upperStateCode = stateCode.toUpperCase();
    return this.STATE_RIDER_RULES[upperStateCode] || {
      adbRider: false,
      childRider: false
    };
  }

  /**
   * Check if specific rider is available in state
   */
  static isRiderAvailable(stateCode: string, rider: 'ADB Rider' | 'Dependent Child Rider'): boolean {
    const availability = this.getAvailableRiders(stateCode);
    switch (rider) {
      case 'ADB Rider':
        return availability.adbRider;
      case 'Dependent Child Rider':
        return availability.childRider;
      default:
        return false;
    }
  }

  /**
   * Validate state code format
   */
  static isValidStateCode(stateCode: string): boolean {
    return /^[A-Z]{2}$/.test(stateCode.toUpperCase());
  }

  /**
   * Get state-specific coverage limits
   */
  static getStateCoverageLimits(stateCode: string): {
    min: number;
    max: number;
  } {
    // Example - update with actual state-specific limits if any
    return {
      min: 50000,
      max: 1000000
    };
  }
}
