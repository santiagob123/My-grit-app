import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, BarChart3, Shield, User, Calendar, Target, Trophy, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../hooks/useTheme';

import { DashboardScreen } from '../screens/DashboardScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SoberScreen } from '../screens/SoberScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { CommunityScreen } from '../screens/CommunityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AnimatedIcon = ({ Icon, color, focused }: any) => {
  const isIOS = Platform.OS === 'ios';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (focused && isIOS) {
      scale.value = withSpring(1.3, { damping: 10, stiffness: 100 }, () => {
        scale.value = withSpring(1);
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [focused]);

  return (
    <Animated.View style={animatedStyle}>
      <Icon color={color} size={24} />
    </Animated.View>
  );
};

const TabNavigator = () => {
  const C = useTheme();
  const isIOS = Platform.OS === 'ios';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textDisabled || '#8E8E93',
        tabBarShowLabel: isIOS ? false : true, // En iPhone queda mejor sin etiquetas con este efecto
        tabBarBackground: () => isIOS ? (
          <BlurView 
            intensity={80} 
            tint={C.mode === 'dark' ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
          />
        ) : null,
        tabBarStyle: {
          backgroundColor: isIOS ? 'transparent' : C.card,
          borderTopColor: isIOS ? 'transparent' : C.border,
          height: isIOS ? 70 : 85,
          paddingBottom: isIOS ? 0 : 25,
          paddingTop: 10,
          position: 'absolute',
          ...(isIOS ? {
            bottom: 30,
            left: 20,
            right: 20,
            borderRadius: 35,
            borderWidth: 1,
            borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            elevation: 0,
            overflow: 'hidden',
          } : {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          })
        },
      }}
    >
      <Tab.Screen 
        name="Hoy" 
        component={DashboardScreen} 
        options={{ 
          tabBarIcon: ({ color, focused }) => <AnimatedIcon Icon={Calendar} color={color} focused={focused} /> 
        }} 
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ 
          tabBarIcon: ({ color, focused }) => <AnimatedIcon Icon={BarChart3} color={color} focused={focused} />,
          title: 'Estadísticas'
        }} 
      />
      <Tab.Screen 
        name="Sober" 
        component={SoberScreen} 
        options={{ 
          tabBarIcon: ({ color, focused }) => <AnimatedIcon Icon={Shield} color={color} focused={focused} />,
          title: 'Abstinencia'
        }} 
      />
      <Tab.Screen 
        name="Tribu" 
        component={CommunityScreen} 
        options={{ 
          tabBarIcon: ({ color, focused }) => <AnimatedIcon Icon={Users} color={color} focused={focused} />,
          title: 'Tribu'
        }} 
      />
      <Tab.Screen 
        name="Hábitos" 
        component={HabitsScreen} 
        options={{ 
          tabBarIcon: ({ color, focused }) => <AnimatedIcon Icon={Target} color={color} focused={focused} /> 
        }} 
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          title: 'Perfil'
        }} 
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { session } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
