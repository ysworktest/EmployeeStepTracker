import { Pedometer } from 'expo-sensors';
import { getStepBaseline, getTodayDateString } from './stepStorageService';
import { checkActivityRecognitionPermission } from './permissionsService';

export const debugStepCounter = async (): Promise<void> => {
  console.log('=== Step Counter Debug Info ===');

  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    console.log('1. Pedometer Available:', isAvailable);

    const hasPermission = await checkActivityRecognitionPermission();
    console.log('2. Permission Granted:', hasPermission);

    const baseline = await getStepBaseline();
    console.log('3. Stored Baseline:', baseline);

    const today = getTodayDateString();
    console.log('4. Today Date:', today);

    if (isAvailable && hasPermission) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      console.log('5. Raw Step Count (midnight to now):', result?.steps || 0);

      if (baseline) {
        const todaySteps = Math.max(0, (result?.steps || 0) - baseline.baseline);
        console.log('6. Calculated Today Steps:', todaySteps);
        console.log('   Formula: Raw Steps - Baseline');
        console.log(`   ${result?.steps || 0} - ${baseline.baseline} = ${todaySteps}`);
      }
    }

  } catch (error) {
    console.error('Debug Error:', error);
  }

  console.log('================================');
};

export const resetBaseline = async (): Promise<void> => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.removeItem('step_baseline');
  await AsyncStorage.removeItem('step_baseline_date');
  console.log('Baseline reset complete. Restart the app to reinitialize.');
};
