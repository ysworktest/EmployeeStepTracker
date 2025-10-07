import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { TrendingUp, Target, Heart, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Star } from 'lucide-react-native';
import { getDeviceId } from '@/utils/deviceService';
import {
  fetchEmployeeByDeviceId,
  fetchGlobalSettings,
  syncDailySteps,
  fetchLast7DaysSteps,
  fetchLifetimeSteps,
  fetchTotalCharityEarned,
} from '@/utils/supabaseService';
import {
  checkPedometerAvailability,
  requestPedometerPermissions,
  getTodaySteps,
  subscribeToPedometerUpdates,
} from '@/utils/pedometerService';
import { registerBackgroundFetchAsync } from '@/utils/backgroundTasks';
import { Employee } from '@/types/employee';
import { GlobalSettings, DailySteps, StepData } from '@/types/steps';
import { formatAbsoluteTime } from '@/utils/timeFormatter';
import { formatDateShortWithZone, formatWeekday, getTodayDateStringInTimezone } from '@/utils/timezoneUtils';

export default function IndividualScreen() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [todaySteps, setTodaySteps] = useState(0);
  const [lifetimeSteps, setLifetimeSteps] = useState(0);
  const [totalCharity, setTotalCharity] = useState(0);
  const [last7Days, setLast7Days] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    initializeStepTracking();
  }, []);

  useEffect(() => {
    if (!permissionGranted || !pedometerAvailable) return;

    const unsubscribe = subscribeToPedometerUpdates((steps) => {
      setTodaySteps(steps);
    });

    return () => {
      unsubscribe();
    };
  }, [permissionGranted, pedometerAvailable]);

  const initializeStepTracking = async () => {
    try {
      const available = await checkPedometerAvailability();
      setPedometerAvailable(available);

      if (!available) {
        setError('Pedometer not available on this device');
        setLoading(false);
        return;
      }

      const hasPermission = await requestPedometerPermissions();
      setPermissionGranted(hasPermission);

      if (!hasPermission) {
        if (Platform.OS === 'android') {
          setError('Health Connect permission required. Please grant permission to read step data from Google Fit or Samsung Health.');
        } else {
          setError('Pedometer permission denied. Please enable in device settings.');
        }
        setLoading(false);
        return;
      }

      await loadAllData();

      await registerBackgroundFetchAsync();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize step tracking');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const deviceId = await getDeviceId();
      if (!deviceId) {
        setError('Device ID not available');
        return;
      }

      const employeeData = await fetchEmployeeByDeviceId(deviceId);
      if (!employeeData) {
        setError('Employee profile not found');
        return;
      }
      setEmployee(employeeData);

      const settingsData = await fetchGlobalSettings();
      if (!settingsData) {
        setError('Failed to load settings');
        return;
      }
      setSettings(settingsData);

      const steps = await getTodaySteps();
      setTodaySteps(steps);

      const goalAchieved = steps >= settingsData.dailyStepGoal;
      const charityEarned = goalAchieved ? settingsData.charityAmountPerGoal : 0;

      const syncResult = await syncDailySteps(
        employeeData.employeeId,
        deviceId,
        steps,
        getTodayDateStringInTimezone(),
        goalAchieved,
        charityEarned
      );

      if (syncResult.success && syncResult.data) {
        setLastUpdated(syncResult.data.last_updated);
      }

      const history = await fetchLast7DaysSteps(employeeData.employeeId);
      const formattedHistory = formatLast7Days(history, settingsData.dailyStepGoal);
      setLast7Days(formattedHistory);

      const lifetime = await fetchLifetimeSteps(employeeData.employeeId);
      setLifetimeSteps(lifetime);

      const charity = await fetchTotalCharityEarned(employeeData.employeeId);
      setTotalCharity(charity);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Data loading error:', err);
    }
  };

  const formatLast7Days = (history: DailySteps[], dailyGoal: number): StepData[] => {
    const result: StepData[] = [];
    const todayDateString = getTodayDateStringInTimezone();
    const today = new Date(todayDateString);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const record = history.find((h) => h.step_date === dateString);

      result.push({
        date: dateString,
        steps: record?.step_count || 0,
        goalAchieved: record ? record.goal_achieved : false,
      });
    }

    return result;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatCurrency = (num: number): string => {
    return `$${num.toFixed(2)}`;
  };

  const getProgressPercentage = (): number => {
    if (!settings) return 0;
    return Math.min((todaySteps / settings.dailyStepGoal) * 100, 100);
  };

  const isGoalAchieved = (): boolean => {
    if (!settings) return false;
    return todaySteps >= settings.dailyStepGoal;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading step tracking...</Text>
      </View>
    );
  }

  if (error || !employee || !settings) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#ff3b30" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || 'Failed to load data'}</Text>
        {!pedometerAvailable && (
          <Text style={styles.errorSubtext}>
            Pedometer is not available on this device
          </Text>
        )}
        {!permissionGranted && pedometerAvailable && (
          <Text style={styles.errorSubtext}>
            Please enable pedometer permissions in your device settings
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
      }>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Activity</Text>
        <Text style={styles.headerSubtitle}>Keep moving to reach your goal!</Text>
      </View>

      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <Target size={32} color="#007AFF" />
          <Text style={styles.todaySteps}>{formatNumber(todaySteps)}</Text>
          <Text style={styles.todayLabel}>Steps Today</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${getProgressPercentage()}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {getProgressPercentage().toFixed(0)}% of {formatNumber(settings.dailyStepGoal)} goal
          </Text>
        </View>

        {isGoalAchieved() && (
          <View style={styles.achievementBadge}>
            <CheckCircle size={20} color="#34C759" />
            <Text style={styles.achievementText}>Goal Achieved!</Text>
          </View>
        )}

        <View style={styles.timestampContainer}>
          <Text style={styles.timestampText}>
            Last updated: {formatAbsoluteTime(lastUpdated)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatNumber(lifetimeSteps)}</Text>
          <Text style={styles.statLabel}>Lifetime Steps</Text>
        </View>

        <View style={styles.statCard}>
          <Heart size={24} color="#ff3b30" />
          <Text style={styles.statValue}>{formatCurrency(totalCharity)}</Text>
          <Text style={styles.statLabel}>Charity Earned</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Last 7 Days Performance</Text>
        <View style={styles.chart}>
          {last7Days.map((day, index) => {
            const maxSteps = Math.max(...last7Days.map(d => d.steps), settings.dailyStepGoal);
            const barHeight = maxSteps > 0 ? (day.steps / maxSteps) * 100 : 0;

            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.starIcon}>
                  {day.goalAchieved ? (
                    <Star size={18} color="#FFD700" fill="#FFD700" />
                  ) : (
                    <Star size={18} color="#D3D3D3" fill="none" />
                  )}
                </View>
                <Text style={styles.chartSteps}>{formatNumber(day.steps)}</Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${Math.min(barHeight, 100)}%`,
                        backgroundColor: '#007AFF',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>
                  {formatWeekday(day.date)}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.legendText}>Goal Achieved</Text>
          </View>
          <View style={styles.legendItem}>
            <Star size={14} color="#D3D3D3" fill="none" />
            <Text style={styles.legendText}>Goal Not Met</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Step Tracking Info</Text>
        {Platform.OS === 'android' ? (
          <>
            <Text style={styles.infoText}>
              Android: Steps are synced from Google Fit or Samsung Health via Health Connect. Steps update every minute while the app is open.
            </Text>
            <Text style={styles.infoText}>
              Make sure you have Google Fit or Samsung Health installed and tracking your steps.
            </Text>
          </>
        ) : (
          <Text style={styles.infoText}>
            iOS: Steps are tracked in real-time using Apple HealthKit. Pull down to manually refresh your data.
          </Text>
        )}
        <Text style={styles.infoText}>
          Lifetime steps are calculated from your registration date: {formatDateShortWithZone(employee.registrationDate)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff3b30',
    marginTop: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
  },
  todayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  todayHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  todaySteps: {
    fontSize: 48,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 12,
  },
  todayLabel: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 4,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e5e5ea',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f8ed',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  timestampContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 240,
    marginBottom: 16,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarContainer: {
    width: '80%',
    height: 140,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  starIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 22,
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 4,
  },
  chartSteps: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});
