import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabitStore } from '../store/useHabitStore';
import { CheckCircle2, Circle, Flame, Plus, TrendingUp, Award, Minus, BarChart3 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

// Mock data for the weekly chart
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKLY_PROGRESS = [0.8, 0.4, 1.0, 0.7, 0.9, 0.5, 0.2]; // percentages

export const DashboardScreen = () => {
  const C = useTheme();
  const { habits, toggleHabit, incrementCount, decrementCount } = useHabitStore();
  const navigation = useNavigation<any>();

  const completed = habits.filter(h => h.completed_today).length;
  const total = habits.length;
  const progress = total > 0 ? completed / total : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.header}>
            <View>
              <Text style={[styles.headerSub, { color: C.textMuted }]}>
                HOY · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
              </Text>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tu Misión</Text>
            </View>
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: C.textPrimary, shadowColor: C.accent }]} 
              activeOpacity={0.85} 
              onPress={() => navigation.navigate('Habits')}
            >
              <Plus color={C.background} size={22} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          {/* ── Hero Progress Card ── */}
          <Animated.View entering={FadeInDown.delay(250).duration(700)}>
            <LinearGradient colors={C.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard, { borderColor: C.isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.12)' }]}>
              <View style={[styles.glowDot, { backgroundColor: C.accentSoft }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroLabel, { color: C.textMuted }]}>PROGRESO HOY</Text>
                  <Text style={[styles.heroPercent, { color: C.textPrimary }]}>{Math.round(progress * 100)}%</Text>
                  <Text style={[styles.heroSub, { color: C.textMuted }]}>{completed} de {total} hábitos{'\n'}completados</Text>
                </View>
                <View style={styles.ringWrapper}>
                  <View style={[styles.ringBg, { borderColor: C.border }]} />
                  <View style={styles.ringCenter}>
                    <Flame color={C.accent} size={32} />
                    <Text style={[styles.ringText, { color: C.textMuted }]}>{completed}/{total}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.bar, { backgroundColor: C.border }]}>
                <View style={[styles.barFill, { width: `${progress * 100}%` as any }]}>
                  <LinearGradient colors={[C.accent, '#5AC8FA']} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Weekly Activity Chart ── */}
          <Animated.View entering={FadeInDown.delay(350).duration(700)} style={styles.chartSection}>
             <View style={[styles.chartCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={styles.chartHeader}>
                  <BarChart3 color={C.textMuted} size={16} />
                  <Text style={[styles.chartTitle, { color: C.textSecondary }]}>Actividad Semanal</Text>
                </View>
                
                <View style={styles.chartBody}>
                  {WEEKLY_PROGRESS.map((p, i) => (
                    <View key={i} style={styles.chartCol}>
                      <View style={[styles.chartBarBg, { backgroundColor: C.border }]}>
                        <View style={[styles.chartBarFill, { height: `${p * 100}%`, backgroundColor: i === 6 ? C.accent : C.textMuted + '40' }]} />
                      </View>
                      <Text style={[styles.chartDay, { color: i === 6 ? C.textPrimary : C.textMuted }]}>{WEEK_DAYS[i]}</Text>
                    </View>
                  ))}
                </View>
             </View>
          </Animated.View>

          {/* ── Section Label ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Hábitos Actuales</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Habits')}>
              <Text style={{ color: C.accent, fontWeight: '600' }}>Gestionar</Text>
            </TouchableOpacity>
          </View>

          {/* ── Habits ── */}
          {habits.length === 0 ? (
            <TouchableOpacity style={[styles.empty, { borderColor: C.border }]} onPress={() => navigation.navigate('Habits')} activeOpacity={0.7}>
              <Plus color={C.textDisabled} size={32} />
              <Text style={[styles.emptyText, { color: C.textMuted }]}>Toca para crear tu primer hábito</Text>
            </TouchableOpacity>
          ) : (
            habits.map((habit, i) => (
              <Animated.View key={habit.id} entering={FadeInRight.delay(450 + i * 90).duration(600)}>
                {habit.type === 'counter' ? (
                  <View style={[styles.habitCard, { backgroundColor: C.card, borderColor: C.border }]}>
                    <View style={[styles.habitStrip, { backgroundColor: habit.color }]} />
                    <View style={[styles.habitIcon, { backgroundColor: habit.color + '15' }]}>
                      <Text style={{ fontSize: 24 }}>{habit.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.habitTitle, { color: C.textPrimary }]}>{habit.title}</Text>
                      <View style={[styles.miniBar, { backgroundColor: C.border }]}>
                        <View style={[styles.miniBarFill, { width: `${Math.min((habit.current_count / habit.daily_target) * 100, 100)}%` as any, backgroundColor: habit.color }]} />
                      </View>
                      <Text style={[styles.counterLabel, { color: habit.color }]}>{habit.current_count} / {habit.daily_target} {habit.unit}</Text>
                    </View>
                    <View style={styles.counterControls}>
                      <TouchableOpacity onPress={() => decrementCount(habit.id)} style={[styles.counterBtn, { backgroundColor: C.border }]} activeOpacity={0.7}>
                        <Minus color={C.textPrimary} size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => incrementCount(habit.id)} style={[styles.counterBtn, { backgroundColor: habit.color }]} activeOpacity={0.7}>
                        <Plus color="#FFF" size={16} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => toggleHabit(habit.id)} activeOpacity={0.85} style={[styles.habitCard, { backgroundColor: C.card, borderColor: C.border }, habit.completed_today && { opacity: 0.6 }]}>
                    <View style={[styles.habitStrip, { backgroundColor: habit.color }]} />
                    <View style={[styles.habitIcon, { backgroundColor: habit.color + '15' }]}>
                      <Text style={{ fontSize: 24 }}>{habit.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.habitTitle, { color: C.textPrimary }, habit.completed_today && { textDecorationLine: 'line-through', color: C.textMuted }]}>{habit.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Flame size={11} color={habit.completed_today ? C.textDisabled : C.warning} />
                        <Text style={[styles.habitStreak, { color: C.textMuted }]}> {habit.streak} días racha</Text>
                      </View>
                    </View>
                    {habit.completed_today ? <CheckCircle2 color={C.success} size={32} /> : <Circle color={C.borderStrong} size={32} />}
                  </TouchableOpacity>
                )}
              </Animated.View>
            ))
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  headerSub: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  addBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  heroCard: { marginHorizontal: 20, borderRadius: 32, padding: 24, marginTop: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1 },
  glowDot: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -40, top: -60 },
  heroLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 8 },
  heroPercent: { fontSize: 56, fontWeight: '800', letterSpacing: -2 },
  heroSub: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  ringWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ringBg: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 8 },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  bar: { height: 6, borderRadius: 4, marginTop: 24, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  // Chart Section
  chartSection: { paddingHorizontal: 20, marginBottom: 28 },
  chartCard: { borderRadius: 28, padding: 20, borderWidth: 1 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  chartTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  chartBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingHorizontal: 4 },
  chartCol: { alignItems: 'center', gap: 10 },
  chartBarBg: { width: 12, height: 70, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBarFill: { width: '100%', borderRadius: 6 },
  chartDay: { fontSize: 10, fontWeight: '700' },
  // Habits List
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  empty: { marginHorizontal: 20, borderRadius: 28, padding: 44, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  habitCard: { marginHorizontal: 20, marginBottom: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', padding: 18, borderWidth: 1, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  habitStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 2 },
  habitIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16, marginLeft: 8 },
  habitTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  habitStreak: { fontSize: 12, fontWeight: '600' },
  miniBar: { height: 4, borderRadius: 2, marginTop: 10, marginBottom: 6, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  counterLabel: { fontSize: 12, fontWeight: '800' },
  counterControls: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  counterBtn: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
});
