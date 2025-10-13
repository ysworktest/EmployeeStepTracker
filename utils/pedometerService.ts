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
import * as HealthKit from './healthKitService';

export { getTodayDateString } from './stepStorageService';

let currentBaseline = 0;
let baselineDate = '';
let isInitializing = false;

export const checkPedometerAvailability = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const available = HealthKit.isHealthKitAvailable();
      if (!available) {
        console.log('[iOS] HealthKit not available on this device');
      }
      return available;
    }

    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('[Android] Pedometer not available on this device');
    }
    return isAvailable;
  } catch (error) {
    console.error('Error checking pedometer availability:', error);
    return false;
  }
};

export const requestPedometerPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const initialized = await HealthKit.initializeHealthKit();
      console.log('[iOS] HealthKit initialized:', initialized);
      return initialized;
    }

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
  if (isInitializing) {
    console.log('[Pedometer] Baseline initialization already in progress');
    return;
  }

  try {
    isInitializing = true;
    const today = getTodayDateStringFromStorage();
    const storedBaseline = await getStepBaseline();

    console.log('[Pedometer] Initializing baseline for date:', today);
    console.log('[Pedometer] Stored baseline:', storedBaseline);

    if (!storedBaseline || needsBaselineReset(storedBaseline.date)) {
      console.log('[Pedometer] Need to set new baseline');
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      console.log('[Pedometer] Querying steps from', start.toISOString(), 'to', end.toISOString());
      const result = await Pedometer.getStepCountAsync(start, end);
      const totalSteps = result?.steps || 0;

      console.log('[Pedometer] Total steps from sensor:', totalSteps);

      currentBaseline = totalSteps;
      baselineDate = today;
      await setStepBaseline(currentBaseline, baselineDate);

      console.log(`[Pedometer] Initialized baseline: ${currentBaseline} on ${today}`);
    } else {
      currentBaseline = storedBaseline.baseline;
      baselineDate = storedBaseline.date;
      console.log(`[Pedometer] Loaded existing baseline: ${currentBaseline} from ${baselineDate}`);
    }
  } catch (error) {
    console.error('[Pedometer] Error initializing baseline:', error);
    currentBaseline = 0;
    baselineDate = getTodayDateStringFromStorage();
    await setStepBaseline(0, baselineDate);
  } finally {
    isInitializing = false;
  }
};

export const getTodaySteps = async (): Promise<number> => {
  try {
    if (Platform.OS === 'ios') {
      const steps = await HealthKit.getTodaySteps();
      return steps;
    }

    console.log('[Pedometer] Getting today steps for Android');
    const today = getTodayDateStringFromStorage();

    if (!baselineDate || needsBaselineReset(baselineDate)) {
      console.log('[Pedometer] Baseline needs reset or not set');
      await initializeBaseline();
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    console.log('[Pedometer] Querying today steps from', start.toISOString(), 'to', end.toISOString());
    const result = await Pedometer.getStepCountAsync(start, end);
    const totalSteps = result?.steps || 0;

    console.log(`[Pedometer] Raw sensor data - Total: ${totalSteps}, Baseline: ${currentBaseline}`);

    if (totalSteps < currentBaseline) {
      console.log('[Pedometer] Device sensor reset detected, reinitializing baseline');
      currentBaseline = 0;
      baselineDate = today;
      await setStepBaseline(0, baselineDate);
    }

    const todaySteps = Math.max(0, totalSteps - currentBaseline);

    console.log(`[Pedometer] Calculated today steps: ${todaySteps}`);

    return todaySteps;
  } catch (error) {
    console.error('[Pedometer] Error getting today steps:', error);
    return 0;
  }
};

export const getStepsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<number> => {
  try {
    if (Platform.OS === 'ios') {
      return await HealthKit.getStepsForDateRange(startDate, endDate);
    }

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
    if (Platform.OS === 'ios') {
      return HealthKit.subscribeToStepUpdates(callback);
    }

    console.log('[Pedometer] Setting up Android step subscription');
    let lastStepCount = 0;
    let isActive = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const initialize = async () => {
      console.log('[Pedometer] Initializing step tracking subscription');
      await initializeBaseline();
      const steps = await getTodaySteps();
      lastStepCount = steps;
      console.log('[Pedometer] Initial step count:', steps);
      callback(steps);
    };

    initialize();

    const pollSteps = async () => {
      if (!isActive) return;

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

        if (totalSteps < currentBaseline) {
          console.log('[Pedometer] Sensor reset detected in subscription');
          currentBaseline = 0;
          baselineDate = today;
          await setStepBaseline(0, baselineDate);
        }

        const todaySteps = Math.max(0, totalSteps - currentBaseline);

        if (todaySteps !== lastStepCount) {
          lastStepCount = todaySteps;
          callback(todaySteps);
          console.log(`[Pedometer] Step update: ${todaySteps} (Total: ${totalSteps}, Baseline: ${currentBaseline})`);
        }
      } catch (error) {
        console.error('[Pedometer] Error in polling callback:', error);
      }
    };

    pollInterval = setInterval(pollSteps, 3000);

    const subscription = Pedometer.watchStepCount((result) => {
      console.log('[Pedometer] Sensor event received:', result?.steps);
      pollSteps();
    });

    return () => {
      console.log('[Pedometer] Cleaning up step subscription');
      isActive = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      subscription && subscription.remove();
    };
  } catch (error) {
    console.error('[Pedometer] Error subscribing to pedometer updates:', error);
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

export const getLast7DaysSteps = async (): Promise<Array<{ date: string; steps: number }>> => {
  try {
    if (Platform.OS === 'ios') {
      return await HealthKit.getLast7DaysSteps();
    }

    console.log('[Pedometer] Fetching last 7 days steps for Android');
    const result: Array<{ date: string; steps: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        console.log(`[Pedometer] Querying steps for ${date.toDateString()}`);
        const stepResult = await Pedometer.getStepCountAsync(startOfDay, endOfDay);
        const steps = stepResult?.steps || 0;

        const dateString = date.toISOString().split('T')[0];
        result.push({
          date: dateString,
          steps,
        });

        console.log(`[Pedometer] ${dateString}: ${steps} steps`);
      } catch (error) {
        console.error(`[Pedometer] Error getting steps for ${date.toDateString()}:`, error);
        const dateString = date.toISOString().split('T')[0];
        result.push({
          date: dateString,
          steps: 0,
        });
      }
    }

    console.log('[Pedometer] Retrieved 7-day history:', result);
    return result;
  } catch (error) {
    console.error('[Pedometer] Error in getLast7DaysSteps:', error);
    return [];
  }
};
