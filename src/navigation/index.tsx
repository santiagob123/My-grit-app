import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';

import { DashboardScreen } from '../screens/DashboardScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useTheme } from '../hooks/useTheme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const C = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: C.tabBar,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          marginHorizontal: 20,
          marginBottom: Platform.OS === 'ios' ? 24 : 12,
          borderRadius: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.3,
          shadowRadius: 30,
          elevation: 20,
          borderWidth: 1,
          borderColor: C.tabBarBorder,
        },
        tabBarActiveTintColor: C.textPrimary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarShowLabel: false,
      }}
    >
      {[
        { name: 'Dashboard', component: DashboardScreen, Icon: Home },
        { name: 'Habits', component: HabitsScreen, Icon: Calendar },
        { name: 'Profile', component: ProfileScreen, Icon: User },
      ].map(({ name, component, Icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: focused ? (C.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                width: 48, height: 40, borderRadius: 14,
              }}>
                <Icon color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { session } = useAuthStore();
  const { mode } = useThemeStore();

  const navTheme = mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#000000' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#F2F2F7' } };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session
          ? <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          : <Stack.Screen name="Main" component={TabNavigator} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};
