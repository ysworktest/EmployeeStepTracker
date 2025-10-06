export interface DailySteps {
  record_id: number;
  employee_id: string;
  device_id: string;
  step_date: string;
  step_count: number;
  goal_achieved: boolean;
  daily_charity_earned: number;
  current_streak: number;
  streak_bonus_earned: number;
  streak_tier_achieved: string | null;
  total_charity_earned: number;
  last_updated: string;
}

export interface GlobalSettings {
  id: string;
  dailyStepGoal: number;
  charityAmountPerGoal: number;
  created_at: string;
  updated_at: string;
}

export interface StepData {
  date: string;
  steps: number;
  goalAchieved: boolean;
}

export interface PedometerResult {
  steps: number;
}

export interface StepSyncResult {
  success: boolean;
  error?: string;
  data?: DailySteps;
}
