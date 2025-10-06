import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

let healthConnectInitialized = false;

const initializeHealthConnect = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (healthConnectInitialized) {
    return true;
  }

  try {
    const isInitialized = await initialize();
    if (isInitialized) {
      healthConnectInitialized = true;
      return true;
    }
    console.log('Health Connect not available');
    return false;
  } catch (error) {
    console.error('Error initializing Health Connect:', error);
    return false;
  }
};

export const checkPedometerAvailability = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return await initializeHealthConnect();
    }
    const isAvailable = await Pedometer.isAvailableAsync();
    return isAvailable;
  } catch (error) {
    console.error('Error checking pedometer availability:', error);
    return false;
  }
};

export const requestPedometerPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const initialized = await initializeHealthConnect();
      if (!initialized) {
        return false;
      }

      const grantedPermissions = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
      ]);

      return grantedPermissions.length > 0;
    } else {
      const { status } = await Pedometer.requestPermissionsAsync();
      return status === 'granted';
    }
  } catch (error) {
    console.error('Error requesting pedometer permissions:', error);
    return false;
  }
};

export const getPedometerPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return await initializeHealthConnect();
    }
    const { status } = await Pedometer.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error getting pedometer permissions:', error);
    return false;
  }
};

export const getTodaySteps = async (): Promise<number> => {
  try {
    if (Platform.OS === 'android') {
      const initialized = await initializeHealthConnect();
      if (!initialized) {
        return 0;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const now = new Date();

      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: today.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalSteps = result.records.reduce((sum, record) => sum + (record.count || 0), 0);
      return totalSteps;
    } else {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const result = await Pedometer.getStepCountAsync(start, end);
      return result?.steps || 0;
    }
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
    if (Platform.OS === 'android') {
      const initialized = await initializeHealthConnect();
      if (!initialized) {
        return 0;
      }

      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const totalSteps = result.records.reduce((sum, record) => sum + (record.count || 0), 0);
      return totalSteps;
    } else {
      const result = await Pedometer.getStepCountAsync(startDate, endDate);
      return result?.steps || 0;
    }
  } catch (error) {
    console.error('Error getting steps for date range:', error);
    return 0;
  }
};

export const subscribeToPedometerUpdates = (
  callback: (steps: number) => void
): (() => void) => {
  try {
    if (Platform.OS === 'android') {
      const pollSteps = async () => {
        const steps = await getTodaySteps();
        callback(steps);
      };

      pollSteps();
      const interval = setInterval(pollSteps, 60000);

      return () => {
        clearInterval(interval);
      };
    } else {
      const subscription = Pedometer.watchStepCount((result) => {
        callback(result.steps);
      });

      return () => {
        subscription && subscription.remove();
      };
    }
  } catch (error) {
    console.error('Error subscribing to pedometer updates:', error);
    return () => {};
  }
};

export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};
