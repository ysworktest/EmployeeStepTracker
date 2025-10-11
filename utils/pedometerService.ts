import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export const checkPedometerAvailability = async (): Promise<boolean> => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    return isAvailable;
  } catch (error) {
    console.error('Error checking pedometer availability:', error);
    return false;
  }
};

export const requestPedometerPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting pedometer permissions:', error);
    return false;
  }
};

export const getPedometerPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Pedometer.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error getting pedometer permissions:', error);
    return false;
  }
};

export const getTodaySteps = async (): Promise<number> => {
  try {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    return result?.steps || 0;
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
    const subscription = Pedometer.watchStepCount((result) => {
      callback(result.steps);
    });

    return () => {
      subscription && subscription.remove();
    };
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
