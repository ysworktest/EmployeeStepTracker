import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { getDeviceId } from '@/utils/deviceService';
import { fetchCompanies, registerEmployee } from '@/utils/supabaseService';
import {
  validateEmployeeId,
  validateProfileName,
  validateCompany,
} from '@/utils/validation';
import { Company } from '@/types/employee';

export default function RegisterScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [profileName, setProfileName] = useState('');

  const [employeeIdError, setEmployeeIdError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [profileNameError, setProfileNameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const [deviceIdResult, companiesResult] = await Promise.all([
        getDeviceId(),
        fetchCompanies(),
      ]);

      setDeviceId(deviceIdResult);
      setCompanies(companiesResult);
      console.log('Companies loaded:', companiesResult);
      console.log('Device ID:', deviceIdResult);
    } catch (error) {
      setGeneralError('Failed to load registration form. Please try again.');
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeIdChange = (text: string) => {
    setEmployeeId(text.toUpperCase());
    if (employeeIdError) {
      setEmployeeIdError(null);
    }
    setGeneralError(null);
  };

  const handleCompanyChange = (value: string) => {
    console.log('Company selected:', value);
    setSelectedCompany(value);
    if (companyError) {
      setCompanyError(null);
    }
    setGeneralError(null);
  };

  const handleProfileNameChange = (text: string) => {
    setProfileName(text);
    if (profileNameError) {
      setProfileNameError(null);
    }
    setGeneralError(null);
  };

  const validateForm = (): boolean => {
    const empIdError = validateEmployeeId(employeeId);
    const compError = validateCompany(selectedCompany);
    const profNameError = validateProfileName(profileName);

    setEmployeeIdError(empIdError);
    setCompanyError(compError);
    setProfileNameError(profNameError);

    return !empIdError && !compError && !profNameError;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!deviceId) {
      setGeneralError('Device ID not available. Please restart the app.');
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    try {
      await registerEmployee(
        {
          employeeId,
          company: selectedCompany,
          profileName,
        },
        deviceId
      );

      await new Promise(resolve => setTimeout(resolve, 500));
      router.replace('/(tabs)/individual');
    } catch (error: any) {
      setGeneralError(error.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading registration form...</Text>
      </View>
    );
  }

  const isFormValid =
    employeeId.length === 7 &&
    selectedCompany !== '' &&
    profileName.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Employee Registration</Text>
          <Text style={styles.subtitle}>Register your device to get started</Text>
        </View>

        {generalError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{generalError}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Device ID</Text>
            <Text style={styles.infoValue}>{deviceId || 'Not Available'}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Employee ID <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, employeeIdError && styles.inputError]}
              value={employeeId}
              onChangeText={handleEmployeeIdChange}
              placeholder="K123456"
              maxLength={7}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {employeeIdError && (
              <Text style={styles.errorText}>{employeeIdError}</Text>
            )}
            <Text style={styles.hint}>Format: K followed by 6 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Company <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.pickerContainer,
                companyError && styles.inputError,
              ]}
            >
              <Picker
                selectedValue={selectedCompany}
                onValueChange={handleCompanyChange}
                style={styles.picker}
                itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
              >
                <Picker.Item label="Select a company" value="" enabled={false} />
                {companies.map((company) => (
                  <Picker.Item
                    key={company.id}
                    label={company.name}
                    value={company.name}
                  />
                ))}
              </Picker>
            </View>
            {companyError && (
              <Text style={styles.errorText}>{companyError}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Profile Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, profileNameError && styles.inputError]}
              value={profileName}
              onChangeText={handleProfileNameChange}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {profileNameError && (
              <Text style={styles.errorText}>{profileNameError}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Register Device</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorBoxText: {
    color: '#c00',
    fontSize: 14,
  },
  form: {
    gap: 20,
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3d9e6',
  },
  infoLabel: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#003d73',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  required: {
    color: '#ff3b30',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ff3b30',
    borderWidth: 2,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
    width: '100%',
  },
  pickerItem: {
    height: 180,
    fontSize: 16,
    color: '#1a1a1a',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
  },
  hint: {
    fontSize: 13,
    color: '#8e8e93',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#b3d9ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
