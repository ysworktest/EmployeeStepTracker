declare module 'react-native-health' {
  export interface HealthValue {
    value: number;
    startDate?: string;
    endDate?: string;
  }

  export interface HealthKitPermissions {
    permissions: {
      read: string[];
      write: string[];
    };
  }

  export interface HealthKitOptions {
    startDate: string;
    endDate: string;
  }

  export const Constants: {
    Permissions: {
      Steps: string;
      [key: string]: string;
    };
  };

  export function isAvailable(): boolean;

  export function initHealthKit(
    permissions: HealthKitPermissions,
    callback: (error: string) => void
  ): void;

  export function getStepCount(
    options: HealthKitOptions,
    callback: (error: Object, results: HealthValue) => void
  ): void;

  const AppleHealthKit: {
    Constants: typeof Constants;
    isAvailable: typeof isAvailable;
    initHealthKit: typeof initHealthKit;
    getStepCount: typeof getStepCount;
  };

  export default AppleHealthKit;
}
