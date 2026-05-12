import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation';
import { useAuthStore } from './src/store/useAuthStore';
import { supabase } from './src/api/supabase';
import { useHabitStore } from './src/store/useHabitStore';
import { useThemeStore } from './src/store/useThemeStore';
import { requestNotificationPermissions } from './src/services/notifications';

export default function App() {
  const { setSession, setIsLoading } = useAuthStore();
  const { habits, addHabit } = useHabitStore();
  const { mode } = useThemeStore();

  useEffect(() => {
    // Request notification permissions on first launch
    requestNotificationPermissions().then(granted => {
      if (!granted) console.log('Notification permissions not granted');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Seed mock data only if store is empty
    if (habits.length === 0) {
      addHabit({
        id: '1',
        title: 'Meditación Matutina',
        icon: '🧘',
        color: '#BF5AF2',
        frequency: 'daily',
        category: 'Mental',
        streak: 5,
        completed_today: false,
        type: 'boolean',
        daily_target: 1,
        current_count: 0,
        unit: 'veces',
      });
      addHabit({
        id: '2',
        title: 'Tomar Agua',
        icon: '💧',
        color: '#0A84FF',
        frequency: 'daily',
        category: 'Salud',
        streak: 12,
        completed_today: false,
        type: 'counter',
        daily_target: 8,
        current_count: 3,
        unit: 'vasos',
      });
      addHabit({
        id: '3',
        title: 'Entrenamiento HIIT',
        icon: '🏋️',
        color: '#FF453A',
        frequency: 'daily',
        category: 'Físico',
        streak: 3,
        completed_today: false,
        type: 'boolean',
        daily_target: 1,
        current_count: 0,
        unit: 'veces',
      });
      addHabit({
        id: '4',
        title: 'Lectura',
        icon: '📚',
        color: '#FF9F0A',
        frequency: 'daily',
        category: 'Crecimiento',
        streak: 7,
        completed_today: false,
        type: 'counter',
        daily_target: 30,
        current_count: 0,
        unit: 'páginas',
      });
    }
  }, []);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}
