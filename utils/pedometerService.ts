import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import {
  getStepBaseline,
  setStepBaseline,
  getTodayDateString as getTodayDateStringFromStorage,
  needsBaselineReset,
} from './stepStorageService';
import {
  requestActivityRecognitionPermission,
  checkActivityRecognitionPermission,
} from './permissionsService';

export { getTodayDateString } from './stepStorageService';

let currentBaseline = 0;
let baselineDate = '';

export const checkPedometerAvailability = async (): Promise<boolean> => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Pedometer not available on this device');
    }
    return isAvailable;
  } catch (error) {
    console.error('Error checking pedometer availability:', error);
    return false;
  }
};

export const requestPedometerPermissions = async (): Promise<boolean> => {
  try {
    return await requestActivityRecognitionPermission();
  } catch (error) {
    console.error('Error requesting pedometer permissions:', error);
    return false;
  }
};

export const getPedometerPermissions = async (): Promise<boolean> => {
  try {
    return await checkActivityRecognitionPermission();
  } catch (error) {
    console.error('Error getting pedometer permissions:', error);
    return false;
  }
};

const initializeBaseline = async (): Promise<void> => {
  try {
    const today = getTodayDateStringFromStorage();
    const storedBaseline = await getStepBaseline();

    if (!storedBaseline || needsBaselineReset(storedBaseline.date)) {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const result = await Pedometer.getStepCountAsync(start, end);
      const totalSteps = result?.steps || 0;

      currentBaseline = totalSteps;
      baselineDate = today;
      await setStepBaseline(currentBaseline, baselineDate);

      console.log(`[Pedometer] Initialized baseline: ${currentBaseline} on ${today}`);
    } else {
      currentBaseline = storedBaseline.baseline;
      baselineDate = storedBaseline.date;
      console.log(`[Pedometer] Loaded baseline: ${currentBaseline} from ${baselineDate}`);
    }
  } catch (error) {
    console.error('Error initializing baseline:', error);
    currentBaseline = 0;
    baselineDate = getTodayDateStringFromStorage();
  }
};

export const getTodaySteps = async (): Promise<number> => {
  try {
    const today = getTodayDateStringFromStorage();

    if (!baselineDate || needsBaselineReset(baselineDate)) {
      await initializeBaseline();
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    const totalSteps = result?.steps || 0;

    const todaySteps = Math.max(0, totalSteps - currentBaseline);

    console.log(`[Pedometer] Total: ${totalSteps}, Baseline: ${currentBaseline}, Today: ${todaySteps}`);

    return todaySteps;
  } catch (error) {
    console.error('Error getting today steps:', error);
    return 0;
  }
};

export const getStepsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<number> => {
  try {
    const result = await Pedometer.getStepCountAsync(startDate, endDate);
    return result?.steps || 0;
  } catch (error) {
    console.error('Error getting steps for date range:', error);
    return 0;
  }
};

export const subscribeToPedometerUpdates = (
  callback: (steps: number) => void
): (() => void) => {
  try {
    let lastStepCount = 0;

    const initialize = async () => {
      await initializeBaseline();
      const steps = await getTodaySteps();
      lastStepCount = steps;
      callback(steps);
    };

    initialize();

    const subscription = Pedometer.watchStepCount(async (result) => {
      try {
        const today = getTodayDateStringFromStorage();

        if (needsBaselineReset(baselineDate)) {
          console.log('[Pedometer] Day changed, resetting baseline');
          await initializeBaseline();
        }

        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const stepResult = await Pedometer.getStepCountAsync(start, end);
        const totalSteps = stepResult?.steps || 0;

        const todaySteps = Math.max(0, totalSteps - currentBaseline);

        if (todaySteps !== lastStepCount) {
          lastStepCount = todaySteps;
          callback(todaySteps);
          console.log(`[Pedometer] Step update: ${todaySteps}`);
        }
      } catch (error) {
        console.error('Error in step watch callback:', error);
      }
    });

    return () => {
      subscription && subscription.remove();
    };
  } catch (error) {
    console.error('Error subscribing to pedometer updates:', error);
    return () => {};
  }
};

export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};
