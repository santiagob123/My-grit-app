import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

const MOTIVATIONAL_PHRASES = [
  "¡LEVÁNTATE Y HAZLO! El sofá no construye imperios. 🔱",
  "¿Vas a rendirte hoy? Recuerda por qué empezaste. ⚔️",
  "El dolor es temporal, la disciplina es para siempre. 🔥",
  "Tus excusas no queman calorías ni completan misiones. 🛡️",
  "Un día más o un día menos. TÚ DECIDES. 🎖️",
  "No te detengas cuando estés cansado, detente cuando hayas terminado. 🦁",
  "La disciplina es hacer lo que odias como si lo amaras. 🔱",
  "Si fuera fácil, todos lo harían. Tú no eres todos. 💎"
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('grit-habits', {
      name: 'Recordatorios de Hábitos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD60A',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function sendInstantTestNotification() {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚀 PRUEBA DE GUERRERO",
        body: "¡Si lees esto, las notificaciones funcionan perfectamente! ⚔️",
        sound: 'default',
        android: { channelId: 'grit-habits' },
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false 
      },
    });
    Alert.alert("ÉXITO", `Notificación ID: ${id}\n\nSAL DE LA APP AHORA y espera 2 segundos.`);
    return id;
  } catch (error: any) {
    Alert.alert("Error Técnico", error.message);
  }
}

export async function scheduleSmartMorningReminder(hour: number, minute: number) {
  const phrase = MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];
  await Notifications.cancelScheduledNotificationAsync('smart-morning');
  return await Notifications.scheduleNotificationAsync({
    identifier: 'smart-morning',
    content: {
      title: "⚔️ INICIO DE MISIÓN",
      body: phrase,
      sound: 'default',
      android: { channelId: 'grit-habits' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleStreakAtRiskReminder(hour = 20, minute = 0) {
  await Notifications.cancelScheduledNotificationAsync('streak-danger');
  return await Notifications.scheduleNotificationAsync({
    identifier: 'streak-danger',
    content: {
      title: "🔥 RACHA EN PELIGRO",
      body: "Tu racha está a punto de morir. ¡Completa tus misiones! ⚔️",
      sound: 'default',
      android: { channelId: 'grit-habits' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleHabitReminder(
  habitId: string,
  title: string,
  body: string,
  hour: number,
  minute: number
): Promise<string> {
  await cancelHabitReminder(habitId);
  const notifId = await Notifications.scheduleNotificationAsync({
    identifier: `habit-${habitId}`,
    content: {
      title: `⏰ ${title}`,
      body,
      sound: true,
      android: { channelId: 'grit-habits' },
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

export async function cancelHabitReminder(habitId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
