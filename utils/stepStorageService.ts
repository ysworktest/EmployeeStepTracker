import AsyncStorage from '@react-native-async-storage/async-storage';

const BASELINE_KEY = 'step_baseline';
const BASELINE_DATE_KEY = 'step_baseline_date';

interface StepBaseline {
  baseline: number;
  date: string;
}

export const getStepBaseline = async (): Promise<StepBaseline | null> => {
  try {
    const baselineStr = await AsyncStorage.getItem(BASELINE_KEY);
    const dateStr = await AsyncStorage.getItem(BASELINE_DATE_KEY);

    if (baselineStr && dateStr) {
      return {
        baseline: parseInt(baselineStr, 10),
        date: dateStr,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting step baseline:', error);
    return null;
  }
};

export const setStepBaseline = async (baseline: number, date: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(BASELINE_KEY, baseline.toString());
    await AsyncStorage.setItem(BASELINE_DATE_KEY, date);
  } catch (error) {
    console.error('Error setting step baseline:', error);
  }
};

export const clearStepBaseline = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BASELINE_KEY);
    await AsyncStorage.removeItem(BASELINE_DATE_KEY);
  } catch (error) {
    console.error('Error clearing step baseline:', error);
  }
};

export const getTodayDateString = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
};

export const needsBaselineReset = (storedDate: string): boolean => {
  const today = getTodayDateString();
  return storedDate !== today;
};
