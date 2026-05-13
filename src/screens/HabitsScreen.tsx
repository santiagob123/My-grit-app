import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabitStore, Habit } from '../store/useHabitStore';
import { Plus, X, Trash2, ToggleLeft, Hash, Bell, BellOff, Pencil } from 'lucide-react-native';
import { GritButton } from '../components/GritButton';
import { useTheme } from '../hooks/useTheme';
import { scheduleHabitReminder, cancelHabitReminder } from '../services/notifications';

const ICONS = ['🏋️', '📚', '💧', '🧘', '🏃', '🎯', '✍️', '🎸', '💤', '🥗', '🧠', '💊', '☕', '🚴', '🌿'];
const COLORS = ['#0A84FF', '#32D74B', '#FF453A', '#FF9F0A', '#BF5AF2', '#64D2FF', '#FF2D55', '#FFD60A'];
const UNITS = ['vasos', 'km', 'páginas', 'minutos', 'reps', 'litros', 'hrs', 'veces'];
const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_ALL = Array.from({ length: 60 }, (_, i) => i);
const fmt = (n: number) => String(n).padStart(2, '0');

export const HabitsScreen = () => {
  const C = useTheme();
  const { habits, addHabit, deleteHabit, updateHabit, fetchHabits } = useHabitStore();

  useEffect(() => {
    fetchHabits();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [habitType, setHabitType] = useState<'boolean' | 'counter'>('boolean');
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏋️');
  const [selectedColor, setSelectedColor] = useState('#0A84FF');
  const [target, setTarget] = useState('8');
  const [selectedUnit, setSelectedUnit] = useState('vasos');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);

  const isPM = reminderHour >= 12;
  const displayHour = reminderHour % 12 || 12;

  const handleHourSelect = (h: number) => {
    let newHour = h;
    if (isPM && h < 12) newHour += 12;
    if (!isPM && h === 12) newHour = 0;
    setReminderHour(newHour);
  };

  const toggleAMPM = (toPM: boolean) => {
    if (toPM && reminderHour < 12) setReminderHour(reminderHour + 12);
    else if (!toPM && reminderHour >= 12) setReminderHour(reminderHour - 12);
  };

  const openCreate = () => {
    setEditingHabit(null);
    setHabitType('boolean');
    setTitle('');
    setSelectedIcon('🏋️');
    setSelectedColor('#0A84FF');
    setTarget('8');
    setSelectedUnit('vasos');
    setReminderEnabled(false);
    setReminderHour(8);
    setReminderMinute(0);
    setShowModal(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitType(habit.type);
    setTitle(habit.title);
    setSelectedIcon(habit.icon);
    setSelectedColor(habit.color);
    setTarget(String(habit.daily_target));
    setSelectedUnit(habit.unit);
    setReminderEnabled(habit.reminder_enabled);
    const [h, m] = (habit.reminder_time || '08:00').split(':').map(Number);
    setReminderHour(h);
    setReminderMinute(m);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const reminderTime = `${fmt(reminderHour)}:${fmt(reminderMinute)}`;

    const baseData = {
      title: title.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: habitType,
      daily_target: habitType === 'counter' ? parseInt(target) || 1 : 1,
      unit: selectedUnit,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderTime,
    };

    if (editingHabit) {
      if (reminderEnabled) {
        const notifId = await scheduleHabitReminder(
          editingHabit.id,
          title.trim(),
          habitType === 'counter' ? `¡Meta de ${target} ${selectedUnit} hoy!` : '¡Registra tu hábito!',
          reminderHour,
          reminderMinute
        ).catch(() => editingHabit.notification_id);
        await updateHabit(editingHabit.id, { ...baseData, notification_id: notifId });
      } else {
        await cancelHabitReminder(editingHabit.id);
        await updateHabit(editingHabit.id, { ...baseData, notification_id: undefined });
      }
    } else {
      const id = Date.now().toString();
      const newHabit: any = {
        id,
        frequency: 'daily',
        category: 'general',
        streak: 0,
        completed_today: false,
        current_count: 0,
        ...baseData,
      };
      if (reminderEnabled) {
        const notifId = await scheduleHabitReminder(
          id, title.trim(),
          habitType === 'counter' ? `¡Meta de ${target} ${selectedUnit} hoy!` : '¡Registra tu hábito!',
          reminderHour, reminderMinute
        ).catch(() => undefined);
        newHabit.notification_id = notifId;
      }
      await addHabit(newHabit);
    }
    setShowModal(false);
    setEditingHabit(null);
  };

  const handleDelete = async (habit: Habit) => {
    if (habit.reminder_enabled) await cancelHabitReminder(habit.id);
    deleteHabit(habit.id);
  };

  const toggleReminder = async (habit: Habit) => {
    const newEnabled = !habit.reminder_enabled;
    if (newEnabled) {
      const [h, m] = (habit.reminder_time || '08:00').split(':').map(Number);
      const notifId = await scheduleHabitReminder(
        habit.id, habit.title,
        habit.type === 'counter' ? `¡Meta de ${habit.daily_target} ${habit.unit} hoy!` : '¡Registra tu hábito!',
        h, m
      ).catch(() => undefined);
      updateHabit(habit.id, { reminder_enabled: true, notification_id: notifId });
    } else {
      await cancelHabitReminder(habit.id);
      updateHabit(habit.id, { reminder_enabled: false, notification_id: undefined });
    }
  };

  const isEditing = !!editingHabit;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.header}>
            <View>
              <Text style={[styles.headerSub, { color: C.textMuted }]}>GESTIÓN</Text>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Hábitos</Text>
            </View>
            <TouchableOpacity onPress={openCreate} style={[styles.addBtn, { backgroundColor: C.textPrimary }]} activeOpacity={0.8}>
              <Plus color={C.background} size={22} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(700)}>
            <LinearGradient 
              colors={[C.card || '#FFF', C.surface || '#FFF']} 
              style={[styles.countCard, { borderColor: C.border, ...C.shadowStyle }]}
            >
              <Text style={[styles.countNum, { color: C.textPrimary }]}>{(habits || []).length}</Text>
              <View style={[styles.countDivider, { backgroundColor: C.border }]} />
              <View>
                <Text style={[styles.countLabel, { color: C.textSecondary }]}>Hábitos Activos</Text>
                <Text style={[styles.countSublabel, { color: C.textMuted }]}>
                  {(habits || []).filter(h => h.reminder_enabled).length} con Recordatorio 🔔
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={{ paddingHorizontal: 20, marginTop: 8, gap: 12 }}>
            {(habits || []).map((habit, i) => (
              <Animated.View key={habit.id} entering={FadeInDown.delay(280 + i * 80).duration(600)}>
                <View style={[styles.habitRow, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}>
                  <View style={[styles.habitStrip, { backgroundColor: habit.color }]} />
                  <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{habit.icon}</Text>
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitTitle, { color: C.textPrimary }]}>{habit.title}</Text>
                    <View style={styles.habitMeta}>
                      <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                      <Text style={[styles.habitMetaText, { color: C.textMuted }]}>
                        {habit.type === 'counter' ? `Meta: ${habit.daily_target} ${habit.unit}` : `Racha: ${habit.streak} días`}
                      </Text>
                    </View>
                    <View style={styles.reminderRow}>
                      <Switch
                        value={habit.reminder_enabled}
                        onValueChange={() => toggleReminder(habit)}
                        trackColor={{ false: C.border, true: habit.color + '60' }}
                        thumbColor={habit.reminder_enabled ? habit.color : C.textMuted}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                      <Text style={[styles.reminderText, { color: habit.reminder_enabled ? habit.color : C.textDisabled }]}>
                        {habit.reminder_enabled ? `🔔 ${(() => {
                          const [h, m] = (habit.reminder_time || '08:00').split(':').map(Number);
                          return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                        })()}` : 'Recordatorio apagado'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openEdit(habit)} style={[styles.actionBtn, { backgroundColor: habit.color + '18' }]} activeOpacity={0.7}>
                      <Pencil color={habit.color} size={15} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(habit)} style={[styles.actionBtn, { backgroundColor: C.dangerSoft }]} activeOpacity={0.7}>
                      <Trash2 color={C.danger} size={15} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowModal(false)} activeOpacity={1} />
          <ScrollView style={[styles.sheet, { backgroundColor: C.surface }]} contentContainerStyle={{ paddingBottom: 40 }} bounces={false}>
            <View style={[styles.sheetHandle, { backgroundColor: C.borderStrong }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: C.textPrimary }]}>{isEditing ? 'Editar Hábito' : 'Nuevo Hábito'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.closeBtn, { backgroundColor: C.card }]}><X color={C.textSecondary} size={18} /></TouchableOpacity>
            </View>
            
            <TextInput value={title} onChangeText={setTitle} placeholder="Ej: Beber Agua" placeholderTextColor={C.textDisabled} style={[styles.input, { backgroundColor: C.card, borderColor: C.border, color: C.textPrimary }]} />
            
            {/* TIPO DE HABITO */}
            <View style={styles.typeSelector}>
              <TouchableOpacity onPress={() => setHabitType('boolean')} style={[styles.typeBtn, habitType === 'boolean' && { backgroundColor: selectedColor, borderColor: selectedColor }]}>
                <ToggleLeft color={habitType === 'boolean' ? '#FFF' : C.textMuted} size={20} />
                <Text style={[styles.typeBtnText, { color: habitType === 'boolean' ? '#FFF' : C.textMuted }]}>Simple</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setHabitType('counter')} style={[styles.typeBtn, habitType === 'counter' && { backgroundColor: selectedColor, borderColor: selectedColor }]}>
                <Hash color={habitType === 'counter' ? '#FFF' : C.textMuted} size={20} />
                <Text style={[styles.typeBtnText, { color: habitType === 'counter' ? '#FFF' : C.textMuted }]}>Contador</Text>
              </TouchableOpacity>
            </View>

            {habitType === 'counter' && (
              <Animated.View entering={FadeInDown} style={[styles.counterConfig, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.configLabel, { color: C.textSecondary }]}>Meta Diaria</Text>
                  <TextInput value={target} onChangeText={setTarget} keyboardType="numeric" style={[styles.targetInput, { color: C.textPrimary }]} />
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: C.border, marginHorizontal: 15 }} />
                <View style={{ flex: 1.5 }}>
                  <Text style={[styles.configLabel, { color: C.textSecondary }]}>Unidad</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {UNITS.map(u => (
                      <TouchableOpacity key={u} onPress={() => setSelectedUnit(u)} style={[styles.unitChip, selectedUnit === u && { backgroundColor: selectedColor, borderColor: selectedColor }]}>
                        <Text style={[styles.unitChipText, { color: selectedUnit === u ? '#FFF' : C.textMuted }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Animated.View>
            )}

            {/* ICONOS */}
            <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 10 }]}>ICONO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.iconGrid}>
                {ICONS.map(icon => (
                  <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.iconBtn, selectedIcon === icon && { backgroundColor: selectedColor + '25', borderColor: selectedColor }]}>
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* COLORES */}
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>COLOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.colorGrid}>
                {COLORS.map(color => (
                  <TouchableOpacity key={color} onPress={() => setSelectedColor(color)} style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && { borderWidth: 3, borderColor: '#FFF' }]} />
                ))}
              </View>
            </ScrollView>

            {/* RECORDATORIO */}
            <View style={[styles.reminderSection, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: reminderEnabled ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Bell color={reminderEnabled ? selectedColor : C.textMuted} size={20} />
                  <View>
                    <Text style={[styles.reminderTitle, { color: C.textPrimary }]}>Recordatorio diario</Text>
                    <Text style={[styles.reminderSub, { color: C.textMuted }]}>{reminderEnabled ? `Suena a las ${displayHour}:${fmt(reminderMinute)} ${isPM ? 'PM' : 'AM'}` : 'Desactivado'}</Text>
                  </View>
                </View>
                <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: C.border, true: selectedColor + '60' }} thumbColor={reminderEnabled ? selectedColor : C.textMuted} />
              </View>

              {reminderEnabled && (
                <View>
                  <View style={styles.ampmContainer}>
                    <TouchableOpacity onPress={() => toggleAMPM(false)} style={[styles.ampmBtn, { backgroundColor: !isPM ? selectedColor : C.background, borderColor: !isPM ? selectedColor : C.border }]}><Text style={{ color: !isPM ? '#FFF' : C.textMuted, fontWeight: '700' }}>AM</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleAMPM(true)} style={[styles.ampmBtn, { backgroundColor: isPM ? selectedColor : C.background, borderColor: isPM ? selectedColor : C.border }]}><Text style={{ color: isPM ? '#FFF' : C.textMuted, fontWeight: '700' }}>PM</Text></TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {HOURS_12.map(h => (
                        <TouchableOpacity key={h} onPress={() => handleHourSelect(h)} style={[styles.timeBtn, { backgroundColor: displayHour === h ? selectedColor : C.background, borderColor: displayHour === h ? selectedColor : C.border }]}><Text style={[styles.timeBtnText, { color: displayHour === h ? '#FFF' : C.textMuted }]}>{h}</Text></TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {MINUTES_ALL.map(m => (
                        <TouchableOpacity 
                          key={m} 
                          onPress={() => setReminderMinute(m)} 
                          style={[styles.timeBtn, { backgroundColor: reminderMinute === m ? selectedColor : C.background, borderColor: reminderMinute === m ? selectedColor : C.border }]}
                        >
                          <Text style={[styles.timeBtnText, { color: reminderMinute === m ? '#FFF' : C.textMuted }]}>{fmt(m)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            <GritButton label={isEditing ? 'Guardar Cambios' : 'Crear Hábito'} onPress={handleSave} accentColor={selectedColor} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headerSub: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  addBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  countCard: { marginHorizontal: 20, borderRadius: 28, padding: 22, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  countNum: { fontSize: 40, fontWeight: '800', letterSpacing: -2 },
  countDivider: { width: 1, height: 44, marginHorizontal: 18 },
  countLabel: { fontSize: 14, fontWeight: '600' },
  countSublabel: { fontSize: 12, marginTop: 3 },
  habitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  habitStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  habitIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginLeft: 8 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontWeight: '700' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  habitDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  habitMetaText: { fontSize: 12, fontWeight: '500' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  reminderText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'column', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 26, paddingTop: 12, maxHeight: '92%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  sheetTitle: { fontSize: 22, fontWeight: '800' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  counterConfig: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 16 },
  configLabel: { fontSize: 10, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  targetInput: { fontSize: 22, fontWeight: '800', padding: 0 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginRight: 6 },
  unitChipText: { fontSize: 11, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  iconGrid: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 54, height: 54, borderRadius: 14, borderWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  colorGrid: { flexDirection: 'row', gap: 10 },
  colorBtn: { width: 36, height: 36, borderRadius: 18 },
  reminderSection: { borderRadius: 24, padding: 18, borderWidth: 1, marginBottom: 24 },
  reminderTitle: { fontSize: 15, fontWeight: '700' },
  reminderSub: { fontSize: 12, marginTop: 1 },
  ampmContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ampmBtn: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeBtn: { width: 44, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeBtnText: { fontSize: 13, fontWeight: '700' },
});
