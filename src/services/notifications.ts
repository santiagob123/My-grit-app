import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications look when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the OS.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('grit-habits', {
      name: 'Recordatorios de Hábitos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A84FF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a daily local notification for a habit.
 * @param habitId  - unique ID of the habit (used as identifier)
 * @param title    - habit name shown in the notification
 * @param body     - subtitle / body text
 * @param hour     - hour (0-23)
 * @param minute   - minute (0-59)
 * @returns        - the notification identifier string (save this to cancel later)
 */
export async function scheduleHabitReminder(
  habitId: string,
  title: string,
  body: string,
  hour: number,
  minute: number
): Promise<string> {
  // Cancel any existing notification for this habit first
  await cancelHabitReminder(habitId);

  const notifId = await Notifications.scheduleNotificationAsync({
    identifier: `habit-${habitId}`,
    content: {
      title: `⏰ ${title}`,
      body,
      sound: true,
      data: { habitId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return notifId;
}

/**
 * Cancel the daily reminder for a specific habit.
 */
export async function cancelHabitReminder(habitId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`);
}

/**
 * Cancel ALL scheduled notifications (e.g. on logout / reset).
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all currently scheduled notifications (useful for debugging).
 */
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
