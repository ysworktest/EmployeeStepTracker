import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getDeviceId } from '@/utils/deviceService';
import { checkDeviceRegistration } from '@/utils/supabaseService';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDeviceAndRedirect();
  }, []);

  const checkDeviceAndRedirect = async () => {
    try {
      const deviceId = await getDeviceId();

      if (!deviceId) {
        setError('Unable to retrieve device ID. Please restart the app.');
        setChecking(false);
        return;
      }

      const existingEmployee = await checkDeviceRegistration(deviceId);

      if (existingEmployee) {
        router.replace('/(tabs)/individual');
      } else {
        router.replace('/register');
      }
    } catch (err: any) {
      console.error('Device check error:', err);
      setError(err.message || 'Failed to check device registration');
      setChecking(false);

      setTimeout(() => {
        router.replace('/register');
      }, 2000);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Redirecting to registration...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Checking device registration...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
});
