import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useHabitStore } from '../store/useHabitStore';
import { useSoberStore } from '../store/useSoberStore';
import { useTheme } from '../hooks/useTheme';
import { useIsFocused } from '@react-navigation/native';
import { 
  Flame, Star, Award, TrendingUp, Shield, Zap, History, Trophy, 
  ChevronRight, Sparkles, Brain, Target
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Modal, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/useUserStore';
import { ConfettiCelebration, ConfettiRef } from '../components/ConfettiCelebration';
import { useRef, useState } from 'react';
import { ZoomIn } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;

const GritGrid = ({ history, color, C }: any) => {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: dateStr,
      completed: (history || []).includes(dateStr)
    };
  });

  return (
    <View style={styles.gridContainer}>
      {days.map((day, i) => (
        <View 
          key={i} 
          style={[
            styles.gridSquare, 
            { 
              backgroundColor: day.completed ? color : (C.mode === 'dark' ? '#2c2c2e' : '#e5e5ea'),
              opacity: day.completed ? 1 : 0.5
            }
          ]} 
        />
      ))}
    </View>
  );
};
const WeeklyOracleModal = ({ visible, report, onHide, C, onClaimXP }: any) => {
  if (!report) return null;
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        <Animated.View entering={ZoomIn.duration(800)} style={[styles.oracleCard, { backgroundColor: C.card, borderColor: C.warning }]}>
          <LinearGradient colors={[C.warning + '20', 'transparent']} style={styles.oracleGradient} />
          
          <Sparkles color={C.warning} size={40} style={{ marginBottom: 15 }} />
          <Text style={[styles.oracleTitle, { color: C.textPrimary }]}>EL ORÁCULO HA HABLADO</Text>
          <Text style={[styles.oracleSub, { color: C.textSecondary }]}>Tu desempeño en los últimos 7 días:</Text>
          
          <View style={styles.gradeContainer}>
            <Animated.Text entering={ZoomIn.delay(400)} style={[styles.gradeText, { color: C.warning }]}>{report.grade}</Animated.Text>
            <Text style={[styles.gradeLabel, { color: C.textMuted }]}>{report.label.toUpperCase()}</Text>
          </View>
          
          <View style={styles.oracleStats}>
             <View style={styles.oracleStatItem}>
                <Text style={[styles.oracleStatValue, { color: C.textPrimary }]}>{Math.round(report.average)}%</Text>
                <Text style={[styles.oracleStatLabel, { color: C.textMuted }]}>Consistencia</Text>
             </View>
             <View style={{ width: 1, height: 30, backgroundColor: C.border }} />
             <View style={styles.oracleStatItem}>
                <Text style={[styles.oracleStatValue, { color: C.warning }]}>+{report.xpReward}</Text>
                <Text style={[styles.oracleStatLabel, { color: C.textMuted }]}>XP Bonus</Text>
             </View>
          </View>
          
          <TouchableOpacity 
            onPress={onClaimXP} 
            style={[styles.claimBtn, { backgroundColor: C.textPrimary }]}
          >
            <Text style={{ color: C.card, fontWeight: '900', letterSpacing: 1 }}>RECLAMAR RECOMPENSA</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const StatsScreen = () => {
  const C = useTheme();
  const isFocused = useIsFocused();
  const { habits, fetchHabits, getWeeklyReport } = useHabitStore();
  const { missions } = useSoberStore();
  const { addXP } = useUserStore();
  const confettiRef = useRef<ConfettiRef>(null);

  const [showOracle, setShowOracle] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  useEffect(() => {
    if (isFocused) {
      fadeAnim.value = 0;
      slideAnim.value = 20;
      fadeAnim.value = withDelay(100, withSpring(1));
      slideAnim.value = withDelay(100, withSpring(0));
      fetchHabits();
    }
  }, [isFocused]);

  const handleOpenOracle = () => {
    const report = getWeeklyReport();
    setWeeklyReport(report);
    setShowOracle(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleClaimXP = async () => {
    if (weeklyReport) {
      await addXP(weeklyReport.xpReward);
      confettiRef.current?.trigger();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowOracle(false);
  };

  const weeklyStats = useMemo(() => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const count = (habits || []).filter(h => (h.history || []).includes(dateStr)).length;
      return { label: days[d.getDay()], count, date: dateStr };
    });
  }, [habits]);

  const maxWeekly = Math.max(...weeklyStats.map(d => d.count), 1);

  const formatMsToDays = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            
            <View style={styles.header}>
              <Text style={[styles.headerSub, { color: C.textMuted }]}>TU PROGRESO</Text>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Grit Stats</Text>
            </View>

            <ConfettiCelebration ref={confettiRef} />
            <WeeklyOracleModal 
              visible={showOracle} 
              report={weeklyReport} 
              onHide={() => setShowOracle(false)} 
              onClaimXP={handleClaimXP}
              C={C} 
            />

            {/* BOTÓN ORÁCULO */}
            <TouchableOpacity onPress={handleOpenOracle} activeOpacity={0.8} style={{ marginHorizontal: 20, marginBottom: 25 }}>
              <LinearGradient 
                colors={[C.warning, '#FFD60A']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.oracleTrigger}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.oracleIconCircle}>
                    <Brain color="#000" size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.oracleTriggerTitle}>EL ORÁCULO SEMANAL</Text>
                    <Text style={styles.oracleTriggerSub}>Analiza tu disciplina y reclama XP</Text>
                  </View>
                  <ChevronRight color="#000" size={20} opacity={0.5} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* SECCIÓN ABSTINENCIA (NUEVA) */}
            {missions.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
                 <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Disciplina de Abstinencia</Text>
                 <View style={styles.soberStatsGrid}>
                   {missions.map((mission) => (
                     <View key={mission.id} style={[styles.soberStatCard, { backgroundColor: C.card, borderColor: C.border }]}>
                        <View style={styles.soberStatHeader}>
                           <Text style={{ fontSize: 18 }}>{mission.icon}</Text>
                           <Text style={[styles.soberStatName, { color: C.textPrimary }]} numberOfLines={1}>{mission.name}</Text>
                        </View>
                        
                        <View style={styles.miniChartContainer}>
                          {[...mission.history].reverse().slice(-5).map((h, i) => {
                             const max = Math.max(...mission.history.map(x => x.durationMs), 1);
                             return (
                               <View key={i} style={[styles.miniBar, { height: (h.durationMs / max) * 30, backgroundColor: C.textDisabled + '30' }]} />
                             );
                          })}
                          <View style={[styles.miniBar, { height: 30, backgroundColor: C.accent }]} />
                        </View>
                        
                        <View style={styles.soberStatFooter}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Trophy size={10} color={C.warning} />
                              <Text style={{ fontSize: 10, color: C.textMuted }}>Mejor: {formatMsToDays(mission.bestRecordMs)}</Text>
                           </View>
                        </View>
                     </View>
                   ))}
                 </View>
              </View>
            )}

            {/* Gráfica Semanal */}
            <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}>
              <View style={styles.cardHeader}>
                <TrendingUp size={20} color={C.accent} />
                <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Actividad Semanal</Text>
              </View>
              <View style={styles.chartContainer}>
                {weeklyStats.map((day, i) => (
                  <View key={i} style={styles.chartBarCol}>
                    <View style={[styles.chartBarBg, { backgroundColor: C.border }]}>
                      <View 
                        style={[
                          styles.chartBarFill, 
                          { 
                            height: `${(day.count / maxWeekly) * 100}%` as any, 
                            backgroundColor: C.accent 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.chartLabel, { color: C.textMuted }]}>{day.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Lista de Hábitos Detallada */}
            <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Detalle por Hábito</Text>
              {(habits || []).map((habit, idx) => (
                <View key={habit.id} style={[styles.habitDetailCard, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}>
                  <View style={styles.habitDetailHeader}>
                    <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '15' }]}>
                      <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.habitDetailTitle, { color: C.textPrimary }]}>{habit.title}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Flame size={12} color={habit.color} />
                          <Text style={{ color: habit.color, fontSize: 11, fontWeight: '800' }}>{habit.streak}d Racha</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Award size={12} color={C.textMuted} />
                          <Text style={{ color: C.textMuted, fontSize: 11 }}>{habit.history?.length || 0} Total</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={[styles.gridLabel, { color: C.textMuted }]}>Últimos 30 días</Text>
                  <GritGrid history={habit.history} color={habit.color} C={C} />
                </View>
              ))}
            </View>

          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 24, marginBottom: 20 },
  headerSub: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  card: { marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingHorizontal: 10 },
  chartBarCol: { alignItems: 'center', flex: 1 },
  chartBarBg: { width: 12, height: 100, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 6 },
  chartLabel: { fontSize: 10, fontWeight: '800', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, paddingHorizontal: 4 },
  soberStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  soberStatCard: { width: (SCREEN_WIDTH - 52) / 2, borderRadius: 24, padding: 16, borderWidth: 1 },
  soberStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  soberStatName: { fontSize: 13, fontWeight: '800', flex: 1 },
  miniChartContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 35, marginBottom: 10 },
  miniBar: { flex: 1, borderRadius: 3, minHeight: 2 },
  soberStatFooter: { borderTopWidth: 1, borderTopColor: '#00000008', paddingTop: 8 },
  habitDetailCard: { padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  habitDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  habitIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitDetailTitle: { fontSize: 16, fontWeight: '700' },
  gridLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 2 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridSquare: { width: (SCREEN_WIDTH - 110) / 10, height: (SCREEN_WIDTH - 110) / 10, borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  oracleCard: { width: SCREEN_WIDTH * 0.85, borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  oracleGradient: { ...StyleSheet.absoluteFillObject },
  oracleTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  oracleSub: { fontSize: 14, textAlign: 'center', marginBottom: 25 },
  gradeContainer: { alignItems: 'center', marginBottom: 25 },
  gradeText: { fontSize: 100, fontWeight: '900', lineHeight: 110 },
  gradeLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  oracleStats: { flexDirection: 'row', alignItems: 'center', gap: 30, marginBottom: 35 },
  oracleStatItem: { alignItems: 'center' },
  oracleStatValue: { fontSize: 20, fontWeight: '800' },
  oracleStatLabel: { fontSize: 10, fontWeight: '700' },
  claimBtn: { width: '100%', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  oracleTrigger: { borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  oracleIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  oracleTriggerTitle: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  oracleTriggerSub: { color: '#000', fontSize: 12, opacity: 0.7 },
});
