import { supabase } from '@/lib/supabase';
import { Company, Employee, RegistrationFormData } from '@/types/employee';
import { DailySteps, GlobalSettings, StepSyncResult } from '@/types/steps';
import { getTodayDateStringInTimezone } from './timezoneUtils';

export const fetchCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data || [];
};

export const checkDeviceRegistration = async (deviceId: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('deviceId', deviceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check device registration: ${error.message}`);
  }

  return data;
};

export const registerEmployee = async (
  formData: RegistrationFormData,
  deviceId: string
): Promise<Employee> => {
  const employeeData = {
    employeeId: formData.employeeId,
    company: formData.company,
    profileName: formData.profileName,
    deviceId: deviceId,
    isActive: true,
    registrationDate: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employees')
    .insert(employeeData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('employeeId')) {
        throw new Error('Employee ID already exists');
      }
      if (error.message.includes('deviceId')) {
        throw new Error('This device is already registered');
      }
    }
    throw new Error(`Failed to register employee: ${error.message}`);
  }

  return data;
};

export const fetchEmployeeByDeviceId = async (deviceId: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('deviceId', deviceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch employee: ${error.message}`);
  }

  return data;
};

export const fetchGlobalSettings = async (): Promise<GlobalSettings | null> => {
  const { data, error } = await supabase
    .from('global_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch global settings: ${error.message}`);
  }

  return data;
};

export const syncDailySteps = async (
  employeeId: string,
  deviceId: string,
  stepCount: number,
  stepDate: string,
  goalAchieved: boolean,
  dailyCharityEarned: number
): Promise<StepSyncResult> => {
  try {
    const { data, error } = await supabase
      .from('daily_steps')
      .upsert(
        {
          employee_id: employeeId,
          device_id: deviceId,
          step_date: stepDate,
          step_count: stepCount,
          goal_achieved: goalAchieved,
          daily_charity_earned: dailyCharityEarned,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'employee_id,step_date',
        }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const fetchLast7DaysSteps = async (employeeId: string): Promise<DailySteps[]> => {
  const todayDateString = getTodayDateStringInTimezone();
  const today = new Date(todayDateString);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_steps')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('step_date', sevenDaysAgoString)
    .lte('step_date', todayDateString)
    .order('step_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch step history: ${error.message}`);
  }

  return data || [];
};

export const fetchLifetimeSteps = async (employeeId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('daily_steps')
    .select('step_count')
    .eq('employee_id', employeeId);

  if (error) {
    throw new Error(`Failed to fetch lifetime steps: ${error.message}`);
  }

  const totalSteps = data?.reduce((sum, record) => sum + (record.step_count || 0), 0) || 0;
  return totalSteps;
};

export const fetchTotalCharityEarned = async (employeeId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('daily_steps')
    .select('daily_charity_earned')
    .eq('employee_id', employeeId);

  if (error) {
    throw new Error(`Failed to fetch total charity: ${error.message}`);
  }

  const totalCharity = data?.reduce((sum, record) => sum + (record.daily_charity_earned || 0), 0) || 0;
  return totalCharity;
};
