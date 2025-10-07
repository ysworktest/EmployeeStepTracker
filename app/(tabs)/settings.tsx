import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CircleCheck as CheckCircle } from 'lucide-react-native';
import { getDeviceId } from '@/utils/deviceService';
import { fetchEmployeeByDeviceId } from '@/utils/supabaseService';
import { Employee } from '@/types/employee';
import { formatDateWithZone } from '@/utils/timezoneUtils';

export default function SettingsScreen() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployeeProfile();
  }, []);

  const loadEmployeeProfile = async (retryCount = 0) => {
    try {
      const deviceIdResult = await getDeviceId();

      if (!deviceIdResult) {
        setError('Device ID not available');
        setLoading(false);
        return;
      }

      const employeeData = await fetchEmployeeByDeviceId(deviceIdResult);

      if (!employeeData) {
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadEmployeeProfile(retryCount + 1);
        }
        setError('Employee profile not found');
        setLoading(false);
        return;
      }

      setEmployee(employeeData);
    } catch (err: any) {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadEmployeeProfile(retryCount + 1);
      }
      setError(err.message || 'Failed to load profile');
      console.error('Profile loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    return formatDateWithZone(dateString, { includeTime: true });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !employee) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            loadEmployeeProfile(0);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <CheckCircle color="#34C759" size={24} />
          <Text style={styles.statusText}>Device Registered</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>Employee Profile</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Profile Name</Text>
            <Text style={styles.infoValue}>{employee.profileName || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>{employee.employeeId}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company</Text>
            <Text style={styles.infoValue}>{employee.company}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  employee.isActive ? styles.statusActive : styles.statusInactive,
                ]}
              />
              <Text style={styles.infoValue}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration Date</Text>
            <Text style={styles.infoValueSmall}>
              {formatDate(employee.registrationDate)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.deviceCard}>
        <Text style={styles.deviceTitle}>Device Information</Text>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceLabel}>Device ID</Text>
          <Text style={styles.deviceId}>{employee.deviceId || 'N/A'}</Text>
        </View>
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
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f8ed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  profileCard: {
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
  profileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  infoSection: {
    gap: 0,
  },
  infoRow: {
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoValueSmall: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5ea',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: '#ff3b30',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  deviceInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  deviceLabel: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600',
    marginBottom: 8,
  },
  deviceId: {
    fontSize: 13,
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
});
