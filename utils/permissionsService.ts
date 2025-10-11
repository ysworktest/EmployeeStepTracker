import { Platform, PermissionsAndroid } from 'react-native';
import { Pedometer } from 'expo-sensors';

export const requestActivityRecognitionPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await Pedometer.requestPermissionsAsync();
      return status === 'granted';
    }

    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;

      if (androidVersion >= 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: 'Activity Recognition Permission',
            message: 'This app needs access to your step counter to track your daily steps.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error requesting activity recognition permission:', error);
    return false;
  }
};

export const checkActivityRecognitionPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await Pedometer.getPermissionsAsync();
      return status === 'granted';
    }

    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;

      if (androidVersion >= 29) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
        );
        return granted;
      } else {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking activity recognition permission:', error);
    return false;
  }
};
