import * as Application from 'expo-application';
import { Platform } from 'react-native';

const WEB_DEVICE_ID_KEY = 'web_device_id';

export const getDeviceId = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync();
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        let deviceId = localStorage.getItem(WEB_DEVICE_ID_KEY);

        if (!deviceId) {
          deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(WEB_DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
      }

      const uniqueId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return uniqueId;
    }
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};
