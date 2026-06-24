import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export async function requestNotificationPermission() {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFcmToken() {
  try {
    await messaging().registerDeviceForRemoteMessages();
    return await messaging().getToken();
  } catch (e) {
    console.error('FCM token alınamadı:', e);
    return null;
  }
}

// Returns an unsubscribe function
export function setupForegroundHandler() {
  return messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title ?? remoteMessage.data?.title;
    const body = remoteMessage.notification?.body ?? remoteMessage.data?.body;
    if (title || body) {
      Alert.alert(title ?? '', body ?? '');
    }
  });
}

// Returns an unsubscribe function
export function subscribeToTokenRefresh(callback) {
  return messaging().onTokenRefresh(callback);
}
