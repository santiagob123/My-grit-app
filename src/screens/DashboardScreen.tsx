import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ScrollView, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useHabitStore, Habit } from '../store/useHabitStore';
import { useUserStore, getXPForNextLevel } from '../store/useUserStore';
import { useBadgeStore } from '../store/useBadgeStore';
import { useSoberStore, SoberMission } from '../store/useSoberStore';
import { useChallengeStore } from '../store/useChallengeStore';
import { useBossStore } from '../store/useBossStore';
import { 
  Flame, Calendar, CheckCircle2, Circle, Plus, Minus, 
  ChevronRight, ListOrdered, LayoutGrid, Sun, Moon, CloudSun, Clock,
  Swords, ShieldAlert, Zap, Trophy, Award, Star
} from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { scale } from '../utils/responsive';
import { ConfettiCelebration, ConfettiRef } from '../components/ConfettiCelebration';

const SCREEN_WIDTH = Dimensions.get('window').width;

const Particle = ({ delay, index, C }: any) => {
  const size = Math.random() * 8 + 4;
  const x = useSharedValue(SCREEN_WIDTH / 2);
  const y = useSharedValue(SCREEN_WIDTH / 2);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const angle = (index * (360 / 12)) * (Math.PI / 180);
    const distance = Math.random() * 150 + 100;
    
    x.value = withDelay(delay, withSpring(SCREEN_WIDTH / 2 + Math.cos(angle) * distance));
    y.value = withDelay(delay, withSpring(SCREEN_WIDTH / 2 + Math.sin(angle) * distance));
    scale.value = withDelay(delay, withSequence(withSpring(1.5), withTiming(0, { duration: 1000 })));
    opacity.value = withDelay(delay + 500, withTiming(0, { duration: 800 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: C.warning,
    transform: [
      { translateX: x.value - SCREEN_WIDTH / 2 },
      { translateY: y.value - SCREEN_WIDTH / 2 },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
};

const LevelUpModal = ({ visible, level, onHide, C }: any) => {
  const rotation = useSharedValue(0);
  const bgScale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(withTiming(360, { duration: 15000 }), -1, false);
      bgScale.value = withSpring(1, { damping: 12 });
    } else {
      bgScale.value = 0.5;
    }
  }, [visible]);

  const rayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: bgScale.value }],
    opacity: 0.3,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        {/* Cinematic Background Rays */}
        <Animated.View style={[styles.raysContainer, rayStyle]}>
          <LinearGradient 
            colors={[C.warning, 'transparent', C.warning, 'transparent']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.rayGradient} 
          />
        </Animated.View>

        <Animated.View entering={ZoomIn.duration(800).springify()} style={[styles.levelUpCard, { backgroundColor: C.card, borderColor: C.warning, borderWidth: 2 }]}>
          <LinearGradient colors={[C.warning + '30', 'transparent']} style={styles.levelUpGradient} />
          
          <View style={styles.particleContainer}>
            {visible && Array.from({ length: 12 }).map((_, i) => (
              <Particle key={i} index={i} delay={400 + (i * 50)} C={C} />
            ))}
          </View>

          <Animated.View entering={ZoomIn.delay(400).duration(1000).springify()}>
            <View style={[styles.trophyRing, { borderColor: C.warning + '40' }]}>
              <Trophy color={C.warning} size={80} strokeWidth={2} />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(600)} style={[styles.levelUpTitle, { color: C.textPrimary }]}>
            🔱 ¡NUEVO RANGO ALCANZADO! 🔱
          </Animated.Text>
          
          <Animated.View entering={ZoomIn.delay(800)} style={[styles.levelUpBadge, { backgroundColor: C.warning }]}>
             <Text style={styles.levelUpBadgeText}>NIVEL {level}</Text>
          </Animated.View>
          
          <Animated.Text entering={FadeIn.delay(1000)} style={[styles.levelUpSub, { color: C.textSecondary }]}>
            Tu disciplina es inquebrantable. El mundo tiembla ante tu avance.
          </Animated.Text>
          
          <TouchableOpacity onPress={onHide} style={[styles.levelUpBtn, { backgroundColor: C.textPrimary, shadowColor: C.warning, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 }]}>
            <Text style={{ color: C.card, fontWeight: '900', letterSpacing: 2, fontSize: 16 }}>CONTINUAR COMBATE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const HabitItem = ({ item: habit, onToggle, onIncrement, onDecrement, C }: any) => {
  const isCounter = habit.type === 'counter';

  return (
    <View
      style={[
        styles.habitCard, 
        { 
          backgroundColor: C.card, 
          borderColor: C.border,
          borderRadius: C.borderRadius,
          borderWidth: C.borderWidth,
          ...C.shadowStyle
        }
      ]}
    >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.habitMain}
            disabled={isCounter}
            onPress={() => onToggle(habit.id, habit.completed_today)}
          >
            <View style={[styles.habitIcon, { backgroundColor: habit.completed_today ? (habit.color + '25') : (C.background), borderColor: habit.color, borderWidth: 1.5, borderRadius: C.borderRadius / 1.5 }]}>
              <Text style={{ fontSize: 28 }}>{habit.icon}</Text>
            </View>
            <View style={styles.habitInfo}>
              <Text style={[styles.habitTitle, { color: C.textPrimary }, habit.completed_today && { textDecorationLine: 'line-through', color: C.textMuted }]}>
                {habit.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
                <View style={[styles.streakLabel, { backgroundColor: habit.color + '15' }]}>
                  <Flame size={12} color={habit.color} />
                  <Text style={{ color: habit.color, fontSize: 11, fontWeight: '900' }}>
                    {habit.streak} DÍAS
                  </Text>
                </View>
              </View>
            </View>
            
            <View>
              {habit.completed_today ? (
                <Animated.View entering={ZoomIn.duration(300)}>
                  <CheckCircle2 color={C.success || '#34C759'} size={scale(38)} strokeWidth={2.5} />
                </Animated.View>
              ) : (
                <Circle color={C.borderStrong || '#C7C7CC'} size={scale(38)} strokeWidth={1.5} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {isCounter && (
          <View style={[styles.counterControls, { borderTopWidth: 1, borderTopColor: C.border || '#EEE', paddingTop: 14, marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
               <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '700' }}>PROGRESO: {Math.round((habit.current_count / habit.daily_target) * 100)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => onDecrement(habit.id, habit)} style={[styles.counterBtn, { backgroundColor: C.border || '#EEE', borderRadius: 10 }]}>
                <Minus color={C.textPrimary || '#000'} size={18} />
              </TouchableOpacity>
              <Text style={[styles.counterLabel, { color: C.textPrimary || '#000' }]}>
                {habit.current_count} / {habit.daily_target}
              </Text>
              <TouchableOpacity 
                onPress={() => onIncrement(habit.id, habit)} 
                disabled={habit.current_count >= habit.daily_target}
                style={[styles.counterBtn, { backgroundColor: habit.current_count >= habit.daily_target ? (C.border || '#EEE') : habit.color, borderRadius: 10, opacity: habit.current_count >= habit.daily_target ? 0.6 : 1 }]}
              >
                <Plus color={habit.current_count >= habit.daily_target ? (C.textMuted || '#8E8E93') : "#FFF"} size={18} />
              </TouchableOpacity>
            </View>
          </View>
        )}
    </View>
  );
};
const RoutineSection = ({ title, icon: Icon, habits, C, onToggle, onIncrement, onDecrement }: any) => {
  if (habits.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown} style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Icon size={18} color={C.accent} />
        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>{title.toUpperCase()}</Text>
        <View style={[styles.sectionLine, { backgroundColor: C.border }]} />
      </View>
      {habits.map((h: any) => (
        <HabitItem 
          key={h.id} 
          item={h} 
          C={C} 
          onToggle={onToggle} 
          onIncrement={onIncrement} 
          onDecrement={onDecrement} 
        />
      ))}
    </Animated.View>
  );
};

export const DashboardScreen = () => {
  const C = useTheme();
  const isFocused = useIsFocused();
  const confettiRef = useRef<ConfettiRef>(null);
  const { habits, toggleHabit, incrementCount, decrementCount, fetchHabits } = useHabitStore();
  const { level, xp, name, fetchProfile, addXP } = useUserStore();
  const { missions, getTimeElapsed } = useSoberStore();
  const { currentBoss, initializeWeeklyBoss, dealDamage, isDefeated } = useBossStore();
  const { currentChallenge, isCompleted, generateDailyChallenge, completeChallenge } = useChallengeStore();
  const { checkBadges } = useBadgeStore();
  const navigation = useNavigation<any>();

  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchHabits();
    if (habits.length > 0) {
      initializeWeeklyBoss(habits.length);
    }
  }, [habits.length]);

  const onToggle = async (id: string, completed: boolean) => {
    await toggleHabit(id);
    if (!completed) {
      dealDamage(10);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    checkBadges();
  };

  const onIncrement = async (id: string, habit: any) => {
    await incrementCount(id);
    dealDamage(5);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onDecrement = async (id: string, habit: any) => {
    await decrementCount(id);
  };

  const triggerLevelUp = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    confettiRef.current?.trigger();
    setShowLevelUp(true);
  };

  const handleCompleteChallenge = async () => {
    if (isCompleted) return;
    const oldLevel = level;
    await completeChallenge();
    const currentLevel = useUserStore.getState().level;
    if (currentLevel > oldLevel) triggerLevelUp();
    else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiRef.current?.trigger();
    }
  };

  const xpNeeded = getXPForNextLevel(level);
  const xpProgress = xp / xpNeeded;

  const currentDay = new Date().getDay();
  const groupedHabits = useMemo(() => {
    const filtered = habits.filter(h => 
      !h.scheduled_days || h.scheduled_days.length === 0 || h.scheduled_days.includes(currentDay)
    );
    
    return {
      morning: filtered.filter(h => h.time_block === 'morning'),
      afternoon: filtered.filter(h => h.time_block === 'afternoon'),
      evening: filtered.filter(h => h.time_block === 'evening'),
      anytime: filtered.filter(h => h.time_block === 'anytime' || !h.time_block),
    };
  }, [habits, currentDay]);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <ConfettiCelebration ref={confettiRef} />
          <LevelUpModal visible={showLevelUp} level={level} C={C} onHide={() => setShowLevelUp(false)} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.headerSub, { color: C.textMuted }]}>¡HOLA, {name.toUpperCase()}!</Text>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tu Misión</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Hábitos')} style={[styles.actionIconBtn, { backgroundColor: C.card, borderColor: C.border, borderRadius: C.borderRadius / 2 }]}>
                <Plus color={C.textPrimary} size={18} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>

          {currentBoss && !isDefeated && (
            <View style={[styles.bossCard, { backgroundColor: C.card, borderColor: C.border }]}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <View style={[styles.bossIconCircle, { backgroundColor: C.background }]}>
                     <ShieldAlert size={32} color={C.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.bossName, { color: C.textPrimary }]}>{currentBoss.name.toUpperCase()}</Text>
                     <View style={[styles.hpBarBg, { backgroundColor: C.border }]}>
                        <View style={[styles.hpBarFill, { width: `${(currentBoss.currentHp / currentBoss.maxHp) * 100}%`, backgroundColor: C.warning }]} />
                     </View>
                     <Text style={[styles.bossHPText, { color: C.warning }]}>{currentBoss.currentHp} / {currentBoss.maxHp} HP</Text>
                  </View>
               </View>
            </View>
          )}

          <View style={styles.xpContainer}>
            <View style={styles.xpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Zap size={12} color={C.warning} fill={C.warning} />
                <Text style={[styles.xpText, { color: C.textSecondary }]}>{xp} / {xpNeeded} XP</Text>
              </View>
              <Text style={[styles.xpLevel, { color: C.warning }]}>LVL {level}</Text>
            </View>
            <View style={[styles.xpBarBg, { backgroundColor: C.border, borderRadius: C.borderRadius }]}>
              <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any, backgroundColor: C.warning }]} />
            </View>
          </View>

          {level < 3 ? (
            <View style={[styles.challengeCard, { backgroundColor: C.card, borderColor: C.border, borderStyle: 'dashed', opacity: 0.7 }]}>
               <View style={styles.challengeHeader}>
                  <View style={[styles.challengeIcon, { backgroundColor: C.border }]}>
                     <ShieldAlert color={C.textMuted} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.challengeTag, { color: C.textMuted }]}>MISIÓN BLOQUEADA</Text>
                     <Text style={[styles.challengeTitle, { color: C.textMuted }]}>Retos Diarios</Text>
                  </View>
               </View>
               <Text style={[styles.challengeDesc, { color: C.textMuted }]}>Demuestra tu disciplina. Alcanza el <Text style={{ fontWeight: 'bold', color: C.warning }}>Nivel 3</Text> para desbloquear misiones especiales de XP.</Text>
            </View>
          ) : (
            currentChallenge && (
              <Animated.View entering={FadeInDown.duration(800)} style={[styles.challengeCard, { backgroundColor: isCompleted ? C.success + '10' : C.accent + '08', borderColor: isCompleted ? C.success : C.accent, borderRadius: C.borderRadius }]}>
                <View style={styles.challengeHeader}>
                    <View style={[styles.challengeIcon, { backgroundColor: isCompleted ? C.success : C.accent }]}>
                      <Swords color="#FFF" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.challengeTag, { color: isCompleted ? C.success : C.accent }]}>{isCompleted ? 'COMPLETADO' : 'RETO DEL DÍA'}</Text>
                      <Text style={[styles.challengeTitle, { color: C.textPrimary }]}>{currentChallenge.title}</Text>
                    </View>
                </View>
                <Text style={[styles.challengeDesc, { color: C.textSecondary }]}>{currentChallenge.description}</Text>
                {!isCompleted && (
                  <TouchableOpacity onPress={handleCompleteChallenge} style={[styles.completeChallengeBtn, { backgroundColor: C.accent }]}>
                    <Text style={{ color: '#FFF', fontWeight: '900' }}>AFIRMAR VICTORIA (+{currentChallenge.xpReward} XP)</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )
          )}

          <View style={{ paddingHorizontal: 8, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>MISIONES DE ABSTINENCIA</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Sober')}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.accent }}>GESTIONAR</Text>
              </TouchableOpacity>
            </View>

            {missions.length === 0 ? (
              <TouchableOpacity onPress={() => navigation.navigate('Sober')} style={[styles.soberEmpty, { backgroundColor: C.card, borderColor: C.border, borderRadius: C.borderRadius, borderStyle: 'dashed', borderWidth: 1 }]}>
                <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '700' }}>Inicia una nueva guerra contra tus vicios</Text>
              </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {missions.map(m => (
                  <TouchableOpacity key={m.id} onPress={() => navigation.navigate('Sober')} style={[styles.soberMiniCard, { backgroundColor: C.card, borderColor: C.border, borderRadius: C.borderRadius, ...C.shadowStyle }]}>
                    <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                    <View>
                      <Text style={[styles.soberMiniTitle, { color: C.textPrimary }]}>{m.name}</Text>
                      <Text style={[styles.soberMiniDays, { color: C.accent }]}>{getTimeElapsed(m.startDate).days} DÍAS</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <Text style={[styles.sectionLabel, { color: C.textMuted, paddingHorizontal: 8, marginBottom: 16 }]}>HÁBITOS POR RUTINA</Text>
          
          <RoutineSection 
            title="Mañana" icon={Sun} habits={groupedHabits.morning} C={C} 
            onToggle={onToggle} onIncrement={onIncrement} onDecrement={onDecrement}
          />
          <RoutineSection 
            title="Tarde" icon={CloudSun} habits={groupedHabits.afternoon} C={C} 
            onToggle={onToggle} onIncrement={onIncrement} onDecrement={onDecrement}
          />
          <RoutineSection 
            title="Noche" icon={Moon} habits={groupedHabits.evening} C={C} 
            onToggle={onToggle} onIncrement={onIncrement} onDecrement={onDecrement}
          />
          <RoutineSection 
            title="Otros" icon={Clock} habits={groupedHabits.anytime} C={C} 
            onToggle={onToggle} onIncrement={onIncrement} onDecrement={onDecrement}
          />

          {habits.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
              <Text style={{ color: C.textMuted, fontWeight: '700' }}>No tienes hábitos hoy</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  levelUpCard: { width: SCREEN_WIDTH * 0.88, borderRadius: 40, padding: 35, alignItems: 'center', overflow: 'hidden', zIndex: 10 },
  levelUpGradient: { ...StyleSheet.absoluteFillObject },
  levelUpTitle: { fontSize: 22, fontWeight: '900', marginTop: 24, letterSpacing: 1, textAlign: 'center' },
  levelUpBadge: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 18, marginBottom: 24, transform: [{ rotate: '-2deg' }] },
  levelUpBadgeText: { color: '#000', fontWeight: '900', fontSize: 28 },
  levelUpSub: { textAlign: 'center', lineHeight: 24, fontSize: 16, marginBottom: 35, fontStyle: 'italic' },
  levelUpBtn: { width: '100%', height: 65, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  raysContainer: { position: 'absolute', width: SCREEN_WIDTH * 2, height: SCREEN_WIDTH * 2, alignItems: 'center', justifyContent: 'center', zIndex: 0 },
  rayGradient: { width: '100%', height: '100%', borderRadius: SCREEN_WIDTH },
  particleContainer: { position: 'absolute', top: '30%', left: '50%', zIndex: 5 },
  trophyRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,214,10,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 24, paddingBottom: 12 },
  headerSub: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  actionIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  xpContainer: { marginHorizontal: 20, marginTop: 10, marginBottom: 24 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  xpText: { fontSize: 12, fontWeight: '700' },
  xpLevel: { fontSize: 12, fontWeight: '900' },
  xpBarBg: { height: 8, overflow: 'hidden' },
  xpBarFill: { height: '100%' },
  challengeCard: { marginHorizontal: 8, padding: 20, borderWidth: 1.5, marginBottom: 24 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  challengeTag: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  challengeTitle: { fontSize: 18, fontWeight: '800' },
  challengeDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  completeChallengeBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  habitCard: { marginBottom: 16, padding: 20 },
  habitMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  habitIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  streakLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  counterControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  counterBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  counterLabel: { fontSize: 18, fontWeight: '800' },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  soberEmpty: { padding: 18, alignItems: 'center', justifyContent: 'center' },
  soberMiniCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minWidth: 160, borderWidth: 1 },
  soberMiniTitle: { fontSize: 14, fontWeight: '800', maxWidth: 100 },
  soberMiniDays: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  bossCard: { marginHorizontal: 20, padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  bossIconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bossName: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  bossHPText: { fontSize: 13, fontWeight: '900' },
  hpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: 8 },
  hpBarFill: { height: '100%', borderRadius: 4 },
  bossDesc: { fontSize: 11, fontWeight: '600' },
  victoryCard: { marginHorizontal: 20, padding: 15, borderRadius: 20, borderWidth: 1, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sectionContainer: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, marginLeft: 10, opacity: 0.5 },
});
