// src/lib/utils/stateValidation.ts
interface RiderAvailability {
  adbRider: boolean;
  childRider: boolean;
}

export class StateValidator {
  private static readonly stateRules = require('../../../config/stateRules.json');
  private static readonly STATE_RIDER_RULES: Record<string, RiderAvailability> = {
    'OK': { adbRider: true, childRider: true }
  };

  /**
   * Check if insurance is available in the state
   */
  static isStateAvailable(stateCode: string): boolean {
    return this.stateRules.available_states.includes(stateCode.toUpperCase());
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
   * Validate state code format and availability
   */
  static isValidStateCode(stateCode: string): boolean {
    const formattedCode = stateCode.toUpperCase();
    return /^[A-Z]{2}$/.test(formattedCode) && this.isStateAvailable(formattedCode);
  }

  /**
   * Get error message for unavailable state
   */
  static getUnavailableStateMessage(stateCode: string): string {
    return `We are currently only available in Oklahoma. ${stateCode} is not yet available, but we're working on expanding to more states soon!`;
  }
}
