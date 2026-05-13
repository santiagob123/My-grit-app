import './global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation';
import { useAuthStore } from './src/store/useAuthStore';
import { supabase } from './src/api/supabase';
import { useThemeStore } from './src/store/useThemeStore';
import { requestNotificationPermissions } from './src/services/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from './src/hooks/useTheme';

export default function App() {
  const { setSession, setIsLoading, isLoading } = useAuthStore();
  const { mode } = useThemeStore();

  useEffect(() => {
    // 1. Probar conexión
    const testConnection = async () => {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) console.error('❌ Error Supabase:', error.message);
      else console.log('✅ Supabase conectado.');
    };
    testConnection();

    // 2. Permisos
    requestNotificationPermissions();

    // 3. Gestionar Sesión Real
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
