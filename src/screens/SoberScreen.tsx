import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSoberStore, SoberMission } from '../store/useSoberStore';
import { useTheme } from '../hooks/useTheme';
import { useIsFocused } from '@react-navigation/native';
import { Shield, Zap, RotateCcw, Target, Plus, X, BarChart2, Calendar, Trophy, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const MissionCard = ({ mission, onRelapse, onDelete }: { mission: SoberMission, onRelapse: (id: string) => void, onDelete: (id: string) => void }) => {
  const C = useTheme();
  const { getTimeElapsed } = useSoberStore();
  const [time, setTime] = useState(getTimeElapsed(mission.startDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeElapsed(mission.startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [mission.startDate]);

  const currentMs = time.totalMs;
  const maxHistory = Math.max(...(mission.history.map(h => h.durationMs) || []), mission.bestRecordMs, currentMs, 1000);

  return (
    <Animated.View entering={FadeInDown.duration(600)} style={[styles.card, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: C.accent + '15' }]}>
          <Text style={{ fontSize: 20 }}>{mission.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>{mission.name}</Text>
          <Text style={[styles.cardSub, { color: C.textMuted }]}>En combate por {time.days}d {time.hours}h</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(mission.id)} hitSlop={10}><Trash2 color={C.textDisabled} size={16} /></TouchableOpacity>
      </View>

      {/* Mini Chart */}
      <View style={styles.chartArea}>
        <Text style={[styles.chartLabel, { color: C.textMuted }]}>RESISTENCIA (ÚLTIMOS INTENTOS)</Text>
        <View style={styles.barContainer}>
          {[...mission.history].reverse().slice(-7).map((h, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, { height: Math.max(2, (h.durationMs / maxHistory) * 40), backgroundColor: C.textDisabled + '40' }]} />
            </View>
          ))}
          <View style={styles.barCol}>
             <View style={[styles.bar, { height: Math.max(4, (currentMs / maxHistory) * 40), backgroundColor: C.accent }]} />
          </View>
        </View>
      </View>

      {/* Clock Grid */}
      <View style={styles.cardClock}>
        <View style={styles.clockUnit}>
          <Text style={[styles.clockVal, { color: C.textPrimary }]}>{time.days}</Text>
          <Text style={[styles.clockLabel, { color: C.textMuted }]}>Días</Text>
        </View>
        <View style={styles.clockUnit}>
          <Text style={[styles.clockVal, { color: C.textPrimary }]}>{time.hours.toString().padStart(2, '0')}</Text>
          <Text style={[styles.clockLabel, { color: C.textMuted }]}>Hrs</Text>
        </View>
        <View style={styles.clockUnit}>
          <Text style={[styles.clockVal, { color: C.textPrimary }]}>{time.minutes.toString().padStart(2, '0')}</Text>
          <Text style={[styles.clockLabel, { color: C.textMuted }]}>Min</Text>
        </View>
        <View style={styles.clockUnit}>
          <Text style={[styles.clockVal, { color: C.accent }]}>{time.seconds.toString().padStart(2, '0')}</Text>
          <Text style={[styles.clockLabel, { color: C.textMuted }]}>Seg</Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => onRelapse(mission.id)} 
        style={[styles.relapseBtn, { backgroundColor: C.dangerSoft }]}
        activeOpacity={0.7}
      >
        <RotateCcw color={C.danger} size={16} />
        <Text style={[styles.relapseText, { color: C.danger }]}>HE RECAÍDO (-50 XP)</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SoberScreen = () => {
  const C = useTheme();
  const { missions, addMission, relapseMission, deleteMission } = useSoberStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚫');

  const handleCreate = () => {
    if (!name.trim()) return;
    addMission(name.trim(), icon);
    setName('');
    setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSub, { color: C.textMuted }]}>DISCIPLINA</Text>
            <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Abstinencia</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowAdd(true)} 
            style={[styles.addBtn, { backgroundColor: C.textPrimary }]}
          >
            <Plus color={C.background} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {missions.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield color={C.borderStrong} size={80} strokeWidth={1} />
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Sin Misiones Activas</Text>
              <Text style={[styles.emptySub, { color: C.textMuted }]}>La disciplina comienza con el primer paso. Añade un vicio que quieras derrotar.</Text>
              <TouchableOpacity onPress={() => setShowAdd(true)} style={[styles.emptyBtn, { backgroundColor: C.accent }]}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>INICIAR PRIMERA GUERRA</Text>
              </TouchableOpacity>
            </View>
          ) : (
            missions.map(m => (
              <MissionCard 
                key={m.id} 
                mission={m} 
                onRelapse={(id) => {
                  Alert.alert("⚠️ RECAÍDA", "¿Confirmas que has fallado? Perderás 50 XP.", [
                    { text: "No" },
                    { text: "Sí", style: 'destructive', onPress: () => relapseMission(id) }
                  ]);
                }} 
                onDelete={(id) => {
                  Alert.alert("Eliminar", "¿Borrar esta misión? No se restará XP.", [
                    { text: "No" },
                    { text: "Borrar", style: 'destructive', onPress: () => deleteMission(id) }
                  ]);
                }}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAdd(false)} activeOpacity={1} />
          <View style={[styles.modalSheet, { backgroundColor: C.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Nueva Guerra</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><X color={C.textMuted} size={24} /></TouchableOpacity>
            </View>
            <TextInput 
              autoFocus
              placeholder="Ej: Sin Tabaco, Cero Azúcar..."
              placeholderTextColor={C.textDisabled}
              style={[styles.input, { backgroundColor: C.card, borderColor: C.border, color: C.textPrimary }]}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.iconRow}>
              {['🚫', '🚭', '🍺', '📱', '🍔', '☕', '🎮', '🍫'].map(emoji => (
                <TouchableOpacity 
                  key={emoji} 
                  onPress={() => setIcon(emoji)}
                  style={[styles.iconBtn, icon === emoji && { backgroundColor: C.accent + '20', borderColor: C.accent }]}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleCreate} style={[styles.createBtn, { backgroundColor: C.textPrimary }]}>
              <Text style={{ color: C.background, fontWeight: '900', letterSpacing: 1 }}>EMPEZAR COMBATE</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 10 },
  headerSub: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  addBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 12, fontWeight: '600' },
  chartArea: { marginBottom: 16 },
  chartLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  barContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  cardClock: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#00000008', borderRadius: 20, padding: 15, marginBottom: 16 },
  clockUnit: { alignItems: 'center', flex: 1 },
  clockVal: { fontSize: 22, fontWeight: '900' },
  clockLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  relapseBtn: { height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  relapseText: { fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginTop: 20 },
  emptySub: { textAlign: 'center', marginTop: 10, lineHeight: 20 },
  emptyBtn: { marginTop: 30, paddingVertical: 16, paddingHorizontal: 30, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  input: { height: 60, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 20, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconBtn: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  createBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }
});
