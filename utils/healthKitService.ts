import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
};

export const initializeHealthKit = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.error('[HealthKit] Initialization error:', error);
        resolve(false);
      } else {
        console.log('[HealthKit] Initialized successfully');
        resolve(true);
      }
    });
  });
};

export const isHealthKitAvailable = (): boolean => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return AppleHealthKit.isAvailable();
};

export const getStepsForDate = async (date: Date): Promise<number> => {
  if (Platform.OS !== 'ios') {
    return 0;
  }

  return new Promise((resolve) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    };

    AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
      if (err) {
        console.error('[HealthKit] Error getting steps for date:', err);
        resolve(0);
        return;
      }

      const steps = results?.value || 0;
      console.log(`[HealthKit] Steps for ${date.toDateString()}: ${steps}`);
      resolve(steps);
    });
  });
};

export const getTodaySteps = async (): Promise<number> => {
  if (Platform.OS !== 'ios') {
    return 0;
  }

  return new Promise((resolve) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const now = new Date();

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: now.toISOString(),
    };

    AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
      if (err) {
        console.error('[HealthKit] Error getting today steps:', err);
        resolve(0);
        return;
      }

      const steps = results?.value || 0;
      console.log(`[HealthKit] Today's steps: ${steps}`);
      resolve(steps);
    });
  });
};

export const getLast7DaysSteps = async (): Promise<Array<{ date: string; steps: number }>> => {
  if (Platform.OS !== 'ios') {
    return [];
  }

  const result: Array<{ date: string; steps: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const steps = await getStepsForDate(date);
    const dateString = date.toISOString().split('T')[0];

    result.push({
      date: dateString,
      steps,
    });
  }

  console.log('[HealthKit] Retrieved 7-day history:', result);
  return result;
};

export const getStepsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<number> => {
  if (Platform.OS !== 'ios') {
    return 0;
  }

  return new Promise((resolve) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
      if (err) {
        console.error('[HealthKit] Error getting steps for range:', err);
        resolve(0);
        return;
      }

      const steps = results?.value || 0;
      resolve(steps);
    });
  });
};

export const subscribeToStepUpdates = (callback: (steps: number) => void): (() => void) => {
  if (Platform.OS !== 'ios') {
    return () => {};
  }

  let isSubscribed = true;

  const pollSteps = async () => {
    if (!isSubscribed) return;

    const steps = await getTodaySteps();
    callback(steps);

    if (isSubscribed) {
      setTimeout(pollSteps, 5000);
    }
  };

  pollSteps();

  return () => {
    isSubscribed = false;
  };
};
