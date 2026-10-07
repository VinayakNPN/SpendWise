import { Alert, Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  // Expo Go SDK 53+ removed remote notifications.
  // For local development, we will just use in-app alerts.
  console.log("Push notifications mocked for Expo Go compatibility.");
}

export async function schedulePushNotification(title: string, body: string) {
  // Fallback to a simple in-app alert since Expo Go doesn't support background push well
  Alert.alert(title, body);
}
