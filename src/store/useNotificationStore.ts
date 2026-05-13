import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NotificationsService from '../services/notifications';
import { Alert } from 'react-native';

interface NotificationState {
  isEnabled: boolean;
  morningTime: { hour: number; minute: number };
  eveningTime: { hour: number; minute: number };
  toggleNotifications: (value: boolean) => Promise<void>;
  updateMorningTime: (hour: number, minute: number) => Promise<void>;
  syncNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      morningTime: { hour: 8, minute: 0 },
      eveningTime: { hour: 20, minute: 0 },

      toggleNotifications: async (value: boolean) => {
        if (value) {
          const granted = await NotificationsService.requestNotificationPermissions();
          if (!granted) {
            Alert.alert("Permiso Denegado", "Debes activar las notificaciones en los ajustes de tu teléfono para recibir recordatorios.");
            return;
          }
          set({ isEnabled: true });
          await get().syncNotifications();
          Alert.alert("¡Activado!", "Recibirás recordatorios inteligentes para mantener tu disciplina.");
        } else {
          await NotificationsService.cancelAllReminders();
          set({ isEnabled: false });
        }
      },

      updateMorningTime: async (hour: number, minute: number) => {
        set({ morningTime: { hour, minute } });
        if (get().isEnabled) await get().syncNotifications();
      },

      syncNotifications: async () => {
        if (!get().isEnabled) return;
        
        await NotificationsService.cancelAllReminders();
        const { morningTime, eveningTime } = get();
        
        await NotificationsService.scheduleSmartMorningReminder(morningTime.hour, morningTime.minute);
        await NotificationsService.scheduleStreakAtRiskReminder(eveningTime.hour, eveningTime.minute);
      }
    }),
    {
      name: 'grit-notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
