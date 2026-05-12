import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, StyleSheet, Switch,
} from 'react-native';
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
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const fmt = (n: number) => String(n).padStart(2, '0');

const EMPTY_FORM = {
  habitType: 'boolean' as 'boolean' | 'counter',
  title: '',
  selectedIcon: '🏋️',
  selectedColor: '#0A84FF',
  target: '8',
  selectedUnit: 'vasos',
  reminderEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
};

export const HabitsScreen = () => {
  const C = useTheme();
  const { habits, addHabit, deleteHabit, updateHabit } = useHabitStore();

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [habitType, setHabitType] = useState<'boolean' | 'counter'>('boolean');
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏋️');
  const [selectedColor, setSelectedColor] = useState('#0A84FF');
  const [target, setTarget] = useState('8');
  const [selectedUnit, setSelectedUnit] = useState('vasos');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);

  const openCreate = () => {
    setEditingHabit(null);
    setHabitType('boolean');
    setTitle('');
    setSelectedIcon('🏋️');
    setSelectedColor('#0A84FF');
    setTarget('8');
    setSelectedUnit('vasos');
    setReminderEnabled(false);
    setReminderHour(9);
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
    setReminderHour(habit.reminder_hour);
    setReminderMinute(habit.reminder_minute);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    const baseData = {
      title: title.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: habitType,
      daily_target: habitType === 'counter' ? parseInt(target) || 1 : 1,
      unit: selectedUnit,
      reminder_enabled: reminderEnabled,
      reminder_hour: reminderHour,
      reminder_minute: reminderMinute,
    };

    if (editingHabit) {
      // ── EDIT MODE ──
      // Re-schedule notification if reminder settings changed
      if (reminderEnabled) {
        const notifId = await scheduleHabitReminder(
          editingHabit.id,
          title.trim(),
          habitType === 'counter'
            ? `¡Meta de ${target} ${selectedUnit} hoy!`
            : '¡Registra tu hábito de hoy!',
          reminderHour,
          reminderMinute
        ).catch(() => editingHabit.notification_id);
        updateHabit(editingHabit.id, { ...baseData, notification_id: notifId });
      } else {
        await cancelHabitReminder(editingHabit.id);
        updateHabit(editingHabit.id, { ...baseData, notification_id: undefined });
      }
    } else {
      // ── CREATE MODE ──
      const id = Date.now().toString();
      const newHabit: Habit = {
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
      addHabit(newHabit);
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
      const notifId = await scheduleHabitReminder(
        habit.id, habit.title,
        habit.type === 'counter' ? `¡Meta de ${habit.daily_target} ${habit.unit} hoy!` : '¡Registra tu hábito!',
        habit.reminder_hour, habit.reminder_minute
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

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.header}>
            <View>
              <Text style={[styles.headerSub, { color: C.textMuted }]}>GESTIÓN</Text>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Hábitos</Text>
            </View>
            <TouchableOpacity onPress={openCreate} style={[styles.addBtn, { backgroundColor: C.textPrimary }]} activeOpacity={0.8}>
              <Plus color={C.background} size={22} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          {/* Count Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(700)}>
            <LinearGradient colors={[C.card, C.surface]} style={[styles.countCard, { borderColor: C.border }]}>
              <Text style={[styles.countNum, { color: C.textPrimary }]}>{habits.length}</Text>
              <View style={[styles.countDivider, { backgroundColor: C.border }]} />
              <View>
                <Text style={[styles.countLabel, { color: C.textSecondary }]}>hábitos activos</Text>
                <Text style={[styles.countSublabel, { color: C.textMuted }]}>
                  {habits.filter(h => h.reminder_enabled).length} con recordatorio 🔔
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Habits List */}
          {habits.length === 0 ? (
            <TouchableOpacity onPress={openCreate} style={[styles.empty, { borderColor: C.border }]} activeOpacity={0.7}>
              <View style={[styles.emptyPlus, { backgroundColor: C.accentSoft }]}>
                <Plus color={C.textDisabled} size={32} />
              </View>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>Crea tu primer hábito</Text>
              <Text style={[styles.emptySubText, { color: C.textMuted }]}>Toca para empezar tu viaje</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ paddingHorizontal: 20, marginTop: 8, gap: 12 }}>
              {habits.map((habit, i) => (
                <Animated.View key={habit.id} entering={FadeInDown.delay(280 + i * 80).duration(600)}>
                  <View style={[styles.habitRow, { backgroundColor: C.card, borderColor: C.border }]}>
                    {/* Color Strip */}
                    <View style={[styles.habitStrip, { backgroundColor: habit.color }]} />

                    {/* Icon */}
                    <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '18' }]}>
                      <Text style={{ fontSize: 26 }}>{habit.icon}</Text>
                    </View>

                    {/* Info */}
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitTitle, { color: C.textPrimary }]}>{habit.title}</Text>
                      <View style={styles.habitMeta}>
                        <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                        <Text style={[styles.habitMetaText, { color: C.textMuted }]}>
                          {habit.type === 'counter'
                            ? `Meta: ${habit.daily_target} ${habit.unit}`
                            : `${habit.streak} días racha`}
                        </Text>
                      </View>
                      {/* Reminder toggle */}
                      <View style={styles.reminderRow}>
                        <Switch
                          value={habit.reminder_enabled}
                          onValueChange={() => toggleReminder(habit)}
                          trackColor={{ false: C.border, true: habit.color + '60' }}
                          thumbColor={habit.reminder_enabled ? habit.color : C.textMuted}
                          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                        <Text style={[styles.reminderText, { color: habit.reminder_enabled ? habit.color : C.textDisabled }]}>
                          {habit.reminder_enabled ? `🔔 ${fmt(habit.reminder_hour)}:${fmt(habit.reminder_minute)}` : 'Sin recordatorio'}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
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
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── Create / Edit Modal ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowModal(false)} activeOpacity={1} />
          <ScrollView
            style={[styles.sheet, { backgroundColor: C.surface }]}
            contentContainerStyle={{ paddingBottom: 40 }}
            bounces={false}
          >
            <View style={[styles.sheetHandle, { backgroundColor: C.borderStrong }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: C.textPrimary }]}>
                {isEditing ? 'Editar Hábito' : 'Nuevo Hábito'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.closeBtn, { backgroundColor: C.card }]}>
                <X color={C.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            {/* Type Selector — only for new habits */}
            {!isEditing && (
              <>
                <Text style={[styles.inputLabel, { color: C.textMuted }]}>TIPO DE HÁBITO</Text>
                <View style={styles.typeRow}>
                  {([
                    { value: 'boolean', label: 'Completable', sub: 'Hecho / No hecho', Icon: ToggleLeft, accent: C.accent },
                    { value: 'counter', label: 'Contador', sub: 'Ej: 8 vasos', Icon: Hash, accent: C.success },
                  ] as const).map(({ value, label, sub, Icon, accent }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setHabitType(value)}
                      style={[styles.typeBtn, { borderColor: habitType === value ? accent : C.border, backgroundColor: habitType === value ? accent + '12' : C.card }]}
                      activeOpacity={0.7}
                    >
                      <Icon color={habitType === value ? accent : C.textMuted} size={20} />
                      <Text style={[styles.typeBtnText, { color: habitType === value ? accent : C.textSecondary }]}>{label}</Text>
                      <Text style={[styles.typeBtnSub, { color: C.textMuted }]}>{sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Name */}
            <Text style={[styles.inputLabel, { color: C.textMuted }]}>NOMBRE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Tomar agua"
              placeholderTextColor={C.textDisabled}
              style={[styles.input, { backgroundColor: C.card, borderColor: C.border, color: C.textPrimary }]}
            />

            {/* Counter target */}
            {habitType === 'counter' && (
              <>
                <Text style={[styles.inputLabel, { color: C.textMuted }]}>META DIARIA</Text>
                <View style={styles.counterRow}>
                  <TextInput
                    value={target}
                    onChangeText={setTarget}
                    keyboardType="numeric"
                    maxLength={3}
                    style={[styles.input, { flex: 1, marginBottom: 0, textAlign: 'center', fontSize: 28, fontWeight: '800', color: C.success, backgroundColor: C.card, borderColor: C.border }]}
                  />
                  <Text style={[styles.counterX, { color: C.textMuted }]}>×</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 2 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                      {UNITS.map(u => (
                        <TouchableOpacity key={u} onPress={() => setSelectedUnit(u)}
                          style={[styles.unitBtn, { backgroundColor: selectedUnit === u ? C.successSoft : C.card, borderColor: selectedUnit === u ? C.success : C.border }]}>
                          <Text style={[styles.unitText, { color: selectedUnit === u ? C.success : C.textMuted }]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View style={[styles.previewPill, { backgroundColor: C.successSoft, borderColor: C.success + '40', marginTop: 12 }]}>
                  <Text style={[styles.previewText, { color: C.success }]}>Meta: {target || '0'} {selectedUnit} por día</Text>
                </View>
              </>
            )}

            {/* Icon */}
            <Text style={[styles.inputLabel, { color: C.textMuted, marginTop: 24 }]}>ÍCONO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 4 }}>
                {ICONS.map(icon => (
                  <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)}
                    style={[styles.iconBtn, { backgroundColor: selectedIcon === icon ? C.borderStrong : C.card, borderWidth: selectedIcon === icon ? 1.5 : 0, borderColor: C.textSecondary }]}>
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Color */}
            <Text style={[styles.inputLabel, { color: C.textMuted }]}>COLOR</Text>
            <View style={[styles.colorRow, { marginBottom: 24 }]}>
              {COLORS.map(color => (
                <TouchableOpacity key={color} onPress={() => setSelectedColor(color)}
                  style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotActive]} />
              ))}
            </View>

            {/* Reminder */}
            <View style={[styles.reminderSection, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: reminderEnabled ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {reminderEnabled ? <Bell color={selectedColor} size={20} /> : <BellOff color={C.textMuted} size={20} />}
                  <View>
                    <Text style={[styles.reminderTitle, { color: C.textPrimary }]}>Recordatorio diario</Text>
                    <Text style={[styles.reminderSub, { color: C.textMuted }]}>
                      {reminderEnabled ? `Todos los días a las ${fmt(reminderHour)}:${fmt(reminderMinute)}` : 'Desactivado'}
                    </Text>
                  </View>
                </View>
                <Switch value={reminderEnabled} onValueChange={setReminderEnabled}
                  trackColor={{ false: C.border, true: selectedColor + '60' }}
                  thumbColor={reminderEnabled ? selectedColor : C.textMuted} />
              </View>

              {reminderEnabled && (
                <View>
                  <Text style={[styles.inputLabel, { color: C.textMuted, marginBottom: 10 }]}>HORA</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {HOURS.map(h => (
                        <TouchableOpacity key={h} onPress={() => setReminderHour(h)}
                          style={[styles.timeBtn, { backgroundColor: reminderHour === h ? selectedColor : C.background, borderColor: reminderHour === h ? selectedColor : C.border }]}>
                          <Text style={[styles.timeBtnText, { color: reminderHour === h ? '#FFF' : C.textMuted }]}>{fmt(h)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={[styles.inputLabel, { color: C.textMuted, marginTop: 14, marginBottom: 10 }]}>MINUTO</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {MINUTES.map(m => (
                      <TouchableOpacity key={m} onPress={() => setReminderMinute(m)}
                        style={[styles.timeBtn, { backgroundColor: reminderMinute === m ? selectedColor : C.background, borderColor: reminderMinute === m ? selectedColor : C.border }]}>
                        <Text style={[styles.timeBtnText, { color: reminderMinute === m ? '#FFF' : C.textMuted }]}>{fmt(m)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.timePill, { backgroundColor: selectedColor + '15', borderColor: selectedColor + '40' }]}>
                    <Bell color={selectedColor} size={14} />
                    <Text style={[styles.timePillText, { color: selectedColor }]}>
                      Notificación todos los días a las {fmt(reminderHour)}:{fmt(reminderMinute)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={{ marginTop: 20 }}>
              <GritButton
                label={isEditing ? 'Guardar Cambios' : 'Crear Hábito'}
                onPress={handleSave}
                accentColor={selectedColor}
              />
            </View>
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
  empty: { marginHorizontal: 20, borderRadius: 28, padding: 44, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', marginTop: 8 },
  emptyPlus: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubText: { fontSize: 13, marginTop: 6 },
  habitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 14, borderWidth: 1, overflow: 'hidden' },
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
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  typeBtnSub: { fontSize: 11, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, marginBottom: 24 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  counterX: { fontSize: 22, fontWeight: '300' },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  unitText: { fontSize: 13, fontWeight: '600' },
  previewPill: { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  previewText: { fontSize: 12, fontWeight: '700' },
  iconBtn: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotActive: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.2 }] },
  reminderSection: { borderRadius: 24, padding: 18, borderWidth: 1 },
  reminderTitle: { fontSize: 15, fontWeight: '700' },
  reminderSub: { fontSize: 12, marginTop: 1 },
  timeBtn: { width: 44, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeBtnText: { fontSize: 13, fontWeight: '700' },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 12, marginTop: 14, borderWidth: 1 },
  timePillText: { fontSize: 12, fontWeight: '600', flex: 1 },
});
