import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity,
  Dimensions, StyleSheet, Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GritButton } from '../components/GritButton';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    title: 'Disciplina\nes Libertad.',
    subtitle: 'Domina tus hábitos. El camino a la grandeza empieza con un solo paso diario.',
    accent: '01 — ESTOICISMO',
    gradientColors: ['#0A84FF22', '#00000000'] as const,
    accentColor: '#0A84FF',
    emoji: '⚡',
  },
  {
    title: 'Visualiza tu\nProgreso.',
    subtitle: 'Mantén tus rachas vivas y observa cómo pequeñas acciones se convierten en victorias.',
    accent: '02 — ENFOQUE',
    gradientColors: ['#32D74B22', '#00000000'] as const,
    accentColor: '#32D74B',
    emoji: '🎯',
  },
  {
    title: 'Únete a\nla Élite.',
    subtitle: 'La consistencia separa a los soñadores de los realizadores. Sé imparable.',
    accent: '03 — LEGADO',
    gradientColors: ['#BF5AF222', '#00000000'] as const,
    accentColor: '#BF5AF2',
    emoji: '👑',
  },
];

export const OnboardingScreen = () => {
  const [current, setCurrent] = useState(0);
  const { setSession } = useAuthStore();

  const slide = slides[current];

  const handleNext = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else setSession({ access_token: 'mock', user: { id: '1' } } as any);
  };

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <LinearGradient
        colors={slide.gradientColors}
        style={styles.glowTop}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safe}>
        {/* Top pill label */}
        <Animated.View key={`pill-${current}`} entering={FadeInDown.duration(600)} style={styles.pillContainer}>
          <View style={[styles.pill, { borderColor: slide.accentColor + '40' }]}>
            <Text style={[styles.pillText, { color: slide.accentColor }]}>{slide.accent}</Text>
          </View>
        </Animated.View>

        {/* Main Content */}
        <Animated.View key={`content-${current}`} entering={FadeIn.duration(800)} style={styles.content}>
          <Text style={[styles.emoji]}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.bottom}>
          {/* Dots */}
          <View style={styles.dots}>
            {slides.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: i === current ? 28 : 6,
                    backgroundColor: i === current ? slide.accentColor : 'rgba(255,255,255,0.15)',
                  },
                ]}
              />
            ))}
          </View>

          <GritButton label={current === slides.length - 1 ? 'Comenzar' : 'Siguiente'} onPress={handleNext} accentColor={slide.accentColor} />

          {current < slides.length - 1 && (
            <TouchableOpacity onPress={() => setSession({ access_token: 'mock', user: { id: '1' } } as any)} style={styles.skip}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  glowTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.6,
  },
  safe: { flex: 1 },
  pillContainer: { paddingTop: 20, paddingHorizontal: 32 },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 36 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: {
    fontSize: 52, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -2, lineHeight: 58, marginBottom: 20,
  },
  subtitle: {
    fontSize: 17, color: 'rgba(255,255,255,0.4)',
    lineHeight: 26, fontWeight: '400',
  },
  bottom: { paddingHorizontal: 32, paddingBottom: 40 },
  dots: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  dot: { height: 6, borderRadius: 3, marginRight: 8 },
  skip: { alignItems: 'center', marginTop: 20 },
  skipText: { color: 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: '500' },
});
