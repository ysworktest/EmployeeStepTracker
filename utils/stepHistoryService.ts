import { Platform } from 'react-native';
import { getLast7DaysSteps } from './pedometerService';
import { syncDailySteps, fetchGlobalSettings } from './supabaseService';

export interface StepHistoryItem {
  date: string;
  steps: number;
  goalAchieved: boolean;
  charityEarned: number;
}

export const sync7DayHistoryToSupabase = async (
  employeeId: string,
  deviceId: string
): Promise<{ success: boolean; data?: StepHistoryItem[]; error?: string }> => {
  try {
    console.log(`[StepHistory] Starting 7-day history sync for employee: ${employeeId} on ${Platform.OS}`);

    const settings = await fetchGlobalSettings();
    if (!settings) {
      return {
        success: false,
        error: 'Failed to load global settings',
      };
    }

    const historyData = await getLast7DaysSteps();
    console.log('[StepHistory] Retrieved 7-day data:', historyData);

    const results: StepHistoryItem[] = [];

    for (const dayData of historyData) {
      const { date, steps } = dayData;

      const goalAchieved = steps >= settings.dailyStepGoal;
      const charityEarned = goalAchieved ? settings.charityAmountPerGoal : 0;

      const syncResult = await syncDailySteps(
        employeeId,
        deviceId,
        steps,
        date,
        goalAchieved,
        charityEarned
      );

      if (syncResult.success) {
        results.push({
          date,
          steps,
          goalAchieved,
          charityEarned,
        });
        console.log(`[StepHistory] Synced ${date}: ${steps} steps`);
      } else {
        console.warn(`[StepHistory] Failed to sync ${date}:`, syncResult.error);
      }
    }

    console.log('[StepHistory] Sync complete. Synced', results.length, 'days');

    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    console.error('[StepHistory] Error syncing 7-day history:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync history',
    };
  }
};

export const getStepHistorySummary = (history: StepHistoryItem[]): {
  totalSteps: number;
  totalCharity: number;
  goalsAchieved: number;
  averageSteps: number;
} => {
  const totalSteps = history.reduce((sum, day) => sum + day.steps, 0);
  const totalCharity = history.reduce((sum, day) => sum + day.charityEarned, 0);
  const goalsAchieved = history.filter((day) => day.goalAchieved).length;
  const averageSteps = history.length > 0 ? Math.round(totalSteps / history.length) : 0;

  return {
    totalSteps,
    totalCharity,
    goalsAchieved,
    averageSteps,
  };
};
