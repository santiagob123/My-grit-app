import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ScrollView, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn, FadeIn, ScaleInCenter, useSharedValue, useAnimatedStyle, withSpring, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useHabitStore, Habit } from '../store/useHabitStore';
import { useUserStore, getXPForNextLevel } from '../store/useUserStore';
import { useBadgeStore } from '../store/useBadgeStore';
import { useSoberStore, SoberMission } from '../store/useSoberStore';
import { useChallengeStore } from '../store/useChallengeStore';
import { CheckCircle2, Circle, Flame, Plus, Minus, Zap, Clock, RotateCcw, ListOrdered, Check, Shield, Swords, Star, Award, Trophy } from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { scale } from '../utils/responsive';
import { ConfettiCelebration, ConfettiRef } from '../components/ConfettiCelebration';

const SCREEN_WIDTH = Dimensions.get('window').width;

const LevelUpModal = ({ visible, level, onHide, C }: any) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View entering={ZoomIn.duration(600).springify()} style={[styles.levelUpCard, { backgroundColor: C.surface }]}>
          <LinearGradient colors={[C.warning + '20', 'transparent']} style={styles.levelUpGradient} />
          
          <Animated.View entering={ZoomIn.delay(300).duration(800)}>
            <Trophy color={C.warning} size={100} strokeWidth={1.5} />
          </Animated.View>

          <Text style={[styles.levelUpTitle, { color: C.textPrimary }]}>¡NUEVO RANGO!</Text>
          <View style={[styles.levelUpBadge, { backgroundColor: C.warning }]}>
             <Text style={styles.levelUpBadgeText}>NIVEL {level}</Text>
          </View>
          
          <Text style={[styles.levelUpSub, { color: C.textSecondary }]}>Tu disciplina se fortalece. Has desbloqueado nuevas skins y medallas.</Text>
          
          <TouchableOpacity onPress={onHide} style={[styles.levelUpBtn, { backgroundColor: C.textPrimary }]}>
            <Text style={{ color: C.background, fontWeight: '900', letterSpacing: 1 }}>CONTINUAR COMBATE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const HabitItem = ({ item: habit, drag, isActive, onToggle, onIncrement, onDecrement, onRescue, isReorderMode, C }: any) => {
  const isCounter = habit.type === 'counter';

  return (
    <ScaleDecorator>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => isReorderMode && drag()}
        disabled={isActive}
        style={[
          styles.habitCard, 
          { 
            backgroundColor: isActive ? (C.mode === 'dark' ? '#1c1c1e' : '#f2f2f7') : C.card, 
            borderColor: isActive ? C.accent : C.border,
            borderRadius: C.borderRadius,
            borderWidth: C.borderWidth,
            ...C.shadowStyle
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isReorderMode && (
             <View style={{ marginRight: 15, opacity: 0.5 }}>
               <ListOrdered size={20} color={C.textMuted} />
             </View>
          )}

          <TouchableOpacity 
            style={styles.habitMain}
            disabled={isCounter || isReorderMode}
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
            
            {!isReorderMode && (
              <View>
                {habit.completed_today ? (
                  <Animated.View entering={ZoomIn.duration(300)}>
                    <CheckCircle2 color={C.success || '#34C759'} size={scale(38)} strokeWidth={2.5} />
                  </Animated.View>
                ) : (
                  <Circle color={C.borderStrong || '#C7C7CC'} size={scale(38)} strokeWidth={1.5} />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isCounter && !isReorderMode && (
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
      </TouchableOpacity>
    </ScaleDecorator>
  );
};

export const DashboardScreen = () => {
  const C = useTheme();
  const isFocused = useIsFocused();
  const confettiRef = useRef<ConfettiRef>(null);
  const { habits, toggleHabit, incrementCount, decrementCount, fetchHabits, reorderHabits } = useHabitStore();
  const { level, xp, name, fetchProfile, addXP } = useUserStore();
  const { missions, getTimeElapsed } = useSoberStore();
  const { currentChallenge, isCompleted, generateDailyChallenge, completeChallenge } = useChallengeStore();
  const { checkBadges } = useBadgeStore();
  const navigation = useNavigation<any>();

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (isFocused) {
      if (habits.length === 0) fetchHabits();
      fetchProfile();
      generateDailyChallenge();
    }
  }, [isFocused]);

  const triggerLevelUp = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    confettiRef.current?.trigger();
    setShowLevelUp(true);
  };

  const handleToggle = async (id: string, isCurrentlyCompleted: boolean) => {
    if (!isCurrentlyCompleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      confettiRef.current?.trigger();
      const levelUp = await addXP(10);
      if (levelUp) triggerLevelUp();
    } else {
      await useUserStore.getState().removeXP(10);
    }
    await toggleHabit(id);
  };

  const handleIncrement = async (id: string, habit: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCount = habit.current_count + 1;
    if (newCount === habit.daily_target) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      confettiRef.current?.trigger();
      const levelUp = await addXP(15);
      if (levelUp) triggerLevelUp();
    }
    await incrementCount(id);
  };

  const handleDecrement = async (id: string, habit: any) => {
    if (habit.current_count === habit.daily_target) await useUserStore.getState().removeXP(15);
    await decrementCount(id);
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

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <DraggableFlatList
          data={habits}
          onDragEnd={({ data }) => reorderHabits(data)}
          keyExtractor={(item) => item.id}
          onRefresh={fetchHabits}
          refreshing={useHabitStore((s) => s.isLoading)}
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 12 }}
          ListHeaderComponent={() => (
            <>
              <ConfettiCelebration ref={confettiRef} />
              <LevelUpModal visible={showLevelUp} level={level} C={C} onHide={() => setShowLevelUp(false)} />

              <View style={styles.header}>
                <View>
                  <Text style={[styles.headerSub, { color: C.textMuted }]}>¡HOLA, {name.toUpperCase()}!</Text>
                  <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tu Misión</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                    style={[styles.actionIconBtn, { backgroundColor: isReorderMode ? C.success : C.card, borderColor: C.border, borderRadius: C.borderRadius / 2 }]} 
                    onPress={() => setIsReorderMode(!isReorderMode)}
                  >
                    {isReorderMode ? <Check color="#FFF" size={18} /> : <ListOrdered color={C.textPrimary} size={18} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('Hábitos')} style={[styles.actionIconBtn, { backgroundColor: C.card, borderColor: C.border, borderRadius: C.borderRadius / 2 }]}>
                    <Plus color={C.textPrimary} size={18} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>

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

              {/* RETO DEL DÍA (BLOQUEADO POR NIVEL) */}
              {level < 3 ? (
                <View style={[styles.challengeCard, { backgroundColor: C.card, borderColor: C.border, borderStyle: 'dashed', opacity: 0.7 }]}>
                   <View style={styles.challengeHeader}>
                      <View style={[styles.challengeIcon, { backgroundColor: C.border }]}>
                         <Shield color={C.textMuted} size={18} />
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

              {/* Sober Panel */}
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
              <Text style={[styles.sectionLabel, { color: C.textMuted, paddingHorizontal: 8, marginBottom: 16 }]}>HÁBITOS DIARIOS</Text>
            </>
          )}
          renderItem={(props) => (
            <HabitItem {...props} C={C} isReorderMode={isReorderMode} onToggle={handleToggle} onIncrement={handleIncrement} onDecrement={handleDecrement} />
          )}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  levelUpCard: { width: SCREEN_WIDTH * 0.85, borderRadius: 32, padding: 30, alignItems: 'center', overflow: 'hidden' },
  levelUpGradient: { ...StyleSheet.absoluteFillObject },
  levelUpTitle: { fontSize: 24, fontWeight: '900', marginTop: 20, letterSpacing: 2 },
  levelUpBadge: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 16, marginBottom: 20 },
  levelUpBadgeText: { color: '#000', fontWeight: '900', fontSize: 22 },
  levelUpSub: { textAlign: 'center', lineHeight: 22, fontSize: 15, marginBottom: 30 },
  levelUpBtn: { width: '100%', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
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
  soberMiniDays: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
