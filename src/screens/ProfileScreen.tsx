import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, TextInput, Modal, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import { useThemeStore } from '../store/useThemeStore';
import { useUserStore, getXPForNextLevel } from '../store/useUserStore';
import { useBadgeStore, ALL_BADGES } from '../store/useBadgeStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { sendInstantTestNotification } from '../services/notifications';
import { useTheme } from '../hooks/useTheme';
import { scale } from '../utils/responsive';
import { useIsFocused } from '@react-navigation/native';
import { SKINS } from '../theme/skins';
import { TrendingUp, Flame, Star, LogOut, Zap, Clock, Edit3, Trash2, RotateCcw, Moon, Sun, Award, Settings2, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ProfileScreen = () => {
  const C = useTheme();
  const isFocused = useIsFocused();
  const { setSession } = useAuthStore();
  const { habits, fetchHabits, resetHabits } = useHabitStore();
  const { mode, toggleTheme, skinId } = useThemeStore();
  const { level, xp, totalHabitsCompleted, name, avatar, fetchProfile, updateProfile, resetStats } = useUserStore();
  const { unlockedBadgeIds, resetBadges } = useBadgeStore();
  const { isEnabled: notificationsEnabled, toggleNotifications, morningTime, updateMorningTime } = useNotificationStore();

  const [editModal, setEditModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newAvatar, setNewAvatar] = useState(avatar);

  const [tempHour, setTempHour] = useState(morningTime.hour.toString());
  const [tempMin, setTempMin] = useState(morningTime.minute.toString());

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
      
      fetchProfile();
      fetchHabits();
    }
  }, [isFocused]);

  const safeHabits = habits || [];
  const totalStreak = safeHabits.reduce((acc, h) => acc + (h.streak || 0), 0);
  const isDark = mode === 'dark';
  
  const displayLevel = level || 1;
  const xpNeeded = getXPForNextLevel(displayLevel);
  const xpProgress = (xp || 0) / xpNeeded;

  const handleUpdateProfile = () => {
    updateProfile({ name: newName, avatar: newAvatar });
    setEditModal(false);
  };

  const handleSaveTime = async () => {
    const h = parseInt(tempHour);
    const m = parseInt(tempMin);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert("Error", "Por favor ingresa una hora (0-23) y minutos (0-59) válidos.");
      return;
    }
    await updateMorningTime(h, m);
    setTimeModal(false);
    Alert.alert("Horario Actualizado", `Tu recordatorio de guerra llegará a las ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}.`);
  };

  const handleSkinPress = (skin: any) => {
    const userLevel = level || 1;
    if (skin.minLevel && userLevel < skin.minLevel) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Nivel Insuficiente",
        `Necesitas alcanzar el Nivel ${skin.minLevel} para desbloquear el tema "${skin.name}".\n\n¡Sigue completando hábitos para ganar XP!`,
        [{ text: "Entendido", style: "default" }]
      );
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    useThemeStore.getState().setSkin(skin.id);
    Alert.alert("¡Skin Equipada!", `Has activado el tema ${skin.name}.`);
  };

  const handleFullReset = () => {
    Alert.alert("RESET TOTAL", "¿Estás seguro? Se borrarán rachas, nivel, XP, MEDALLAS y MISIONES.", [
      { text: "Cancelar" },
      { text: "SÍ, BORRAR TODO", style: 'destructive', onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await resetStats();
          await resetHabits();
          await resetBadges();
          useSoberStore.getState().resetMissions(); // Limpiar también abstinencia
          Alert.alert("Grit Reiniciado", "Has vuelto al inicio del camino.");
      }}
    ]);
  };

  const handleStatsReset = () => {
    Alert.alert("Resetear Estadísticas", "¿Vuelves a nivel 1, 0 XP y pierdes todas tus medallas y rachas?", [
      {text: "No"}, 
      {text: "Si", onPress: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await resetStats();
        await resetBadges();
        await resetHabits(); // Importante para que las medallas no se vuelvan a activar por rachas viejas
        Alert.alert("Limpieza completada", "Estadísticas y medallas borradas.");
      }}
    ]);
  };

  const handleDebugUnlock = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Subir a nivel 10 instantáneamente
    useUserStore.getState().addXP(5000); 
    Alert.alert("🔱 MODO DESARROLLADOR", "Nivel 10 alcanzado. Todas las skins han sido desbloqueadas para revisión.");
  };

  const stats = [
    { label: 'Racha Total', value: totalStreak, icon: Flame, color: C.warning },
    { label: 'Hábitos', value: safeHabits.length, icon: TrendingUp, color: C.accent },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

            {/* Hero Section */}
            <View style={[styles.heroSection, { borderBottomColor: C.border }]}>
              <View style={[styles.avatarContainer, { ...C.shadowStyle }]}>
                <LinearGradient colors={[C.accentSoft || '#0A84FF20', C.border]} style={styles.avatarGradient}>
                  <Text style={{ fontSize: 52 }}>{avatar}</Text>
                </LinearGradient>
                <TouchableOpacity style={styles.editBadge} onPress={() => setEditModal(true)}>
                  <Edit3 color="#FFF" size={14} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.name, { color: C.textPrimary }]}>{name}</Text>
              <Text style={[styles.levelLabel, { color: C.textMuted }]}>GUERRERO NIVEL {displayLevel}</Text>
              
              <View style={styles.xpWrapper}>
                <View style={[styles.xpBarBg, { backgroundColor: C.border }]}>
                  <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any, backgroundColor: '#BF5AF2' }]} />
                </View>
                <Text style={[styles.xpText, { color: C.textMuted, marginTop: 6 }]}>{xp || 0} / {xpNeeded} XP</Text>
              </View>
            </View>

            {/* Medallas Collection */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>COLECCIÓN DE MEDALLAS</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: C.accent }}>{unlockedBadgeIds.length} / {ALL_BADGES.length}</Text>
              </View>
              <View style={styles.badgesGrid}>
                {ALL_BADGES.map((badge) => {
                  const isUnlocked = unlockedBadgeIds.includes(badge.id);
                  return (
                    <TouchableOpacity 
                      key={badge.id} 
                      style={[styles.badgeItem, { backgroundColor: isUnlocked ? (C.mode === 'dark' ? '#1c1c1e' : '#f2f2f7') : 'transparent', borderColor: isUnlocked ? C.accent : C.border }]}
                      onPress={() => Alert.alert(badge.title, badge.description + (isUnlocked ? "" : `\n\nRequisito: ${badge.requirementValue} ${badge.requirementType}`))}
                    >
                      <Text style={{ fontSize: 32, opacity: isUnlocked ? 1 : 0.2 }}>{badge.icon}</Text>
                      {isUnlocked && <View style={[styles.unlockDot, { backgroundColor: C.success }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <View key={i} style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}>
                    <View style={[styles.statIconWrap, { backgroundColor: s.color + '20' }]}>
                      <Icon color={s.color} size={18} />
                    </View>
                    <Text style={[styles.statValue, { color: C.textPrimary }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Ajustes Rápidos */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
               <Text style={[styles.sectionLabel, { color: C.textMuted, marginBottom: 12 }]}>AJUSTES DE GUERRERO</Text>
               
               <TouchableOpacity 
                 onPress={() => toggleNotifications(!notificationsEnabled)} 
                 activeOpacity={0.7} 
                 style={[styles.settingsRow, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}
               >
                <View style={[styles.settingsIconWrap, { backgroundColor: notificationsEnabled ? '#34C75918' : '#8E8E9318' }]}>
                  <Zap color={notificationsEnabled ? '#34C759' : '#8E8E93'} size={17} />
                </View>
                <Text style={[styles.settingsLabel, { color: C.textPrimary, flex: 1 }]}>Recordatorios Inteligentes</Text>
                <Switch 
                  value={notificationsEnabled} 
                  onValueChange={(val) => toggleNotifications(val)} 
                  trackColor={{ false: '#ddd', true: '#34C75940' }} 
                  thumbColor={notificationsEnabled ? '#34C759' : '#fff'} 
                />
              </TouchableOpacity>

              {notificationsEnabled && (
                <View style={{ gap: 12, marginTop: 12 }}>
                  <TouchableOpacity 
                    onPress={() => setTimeModal(true)}
                    style={[styles.settingsRow, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}
                  >
                    <View style={[styles.settingsIconWrap, { backgroundColor: C.accent + '15' }]}>
                      <Clock color={C.accent} size={17} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingsLabel, { color: C.textPrimary }]}>Hora de Misión</Text>
                      <Text style={{ color: C.textMuted, fontSize: 12 }}>Actual: {morningTime.hour.toString().padStart(2, '0')}:{morningTime.minute.toString().padStart(2, '0')}</Text>
                    </View>
                    <Settings2 color={C.textMuted} size={18} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => sendInstantTestNotification()}
                    style={[styles.settingsRow, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle }]}
                  >
                    <View style={[styles.settingsIconWrap, { backgroundColor: C.success + '15' }]}>
                      <Zap color={C.success} size={17} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: C.textPrimary, flex: 1 }]}>Enviar Notificación de Prueba</Text>
                  </TouchableOpacity>
                </View>
              )}

               <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7} style={[styles.settingsRow, { backgroundColor: C.card, borderColor: C.border, ...C.shadowStyle, marginTop: 12 }]}>
                <View style={[styles.settingsIconWrap, { backgroundColor: isDark ? '#FFD60A18' : '#00000010' }]}>
                  {isDark ? <Moon color="#FFD60A" size={17} /> : <Sun color="#FF9500" size={17} />}
                </View>
                <Text style={[styles.settingsLabel, { color: C.textPrimary, flex: 1 }]}>Modo {isDark ? 'Oscuro' : 'Claro'}</Text>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#ddd', true: '#FFD60A40' }} thumbColor={isDark ? '#FFD60A' : '#fff'} />
              </TouchableOpacity>
            </View>

            {/* Skins Section */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={[styles.sectionLabel, { color: C.textMuted, marginBottom: 12 }]}>TEMAS DISPONIBLES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 10 }}>
                  {SKINS.map((skin) => {
                    const isUnlocked = (level || 1) >= (skin.minLevel || 1);
                    const isSelected = skinId === skin.id;

                    return (
                      <TouchableOpacity 
                        key={skin.id}
                        onPress={() => handleSkinPress(skin)}
                        style={[
                          styles.skinCard, 
                          { 
                            backgroundColor: C.card, 
                            borderColor: isSelected ? C.accent : C.border,
                            opacity: isUnlocked ? 1 : 0.5,
                            borderRadius: C.borderRadius / 1.5,
                            borderWidth: isSelected ? 2 : 1,
                            ...C.shadowStyle
                          }
                        ]}
                      >
                        <View style={[styles.skinPreview, { backgroundColor: isUnlocked ? C.accent : C.borderStrong, borderRadius: C.borderRadius / 3 }]}>
                          {isUnlocked ? (isSelected ? <Star color="#FFF" size={16} /> : <Zap color="#FFF" size={16} />) : <Text style={{ fontSize: 12 }}>🔒</Text>}
                        </View>
                        <Text style={[styles.skinName, { color: isSelected ? C.accent : C.textPrimary }]}>
                          {skin.name}
                        </Text>
                        {!isUnlocked && (
                          <Text style={{ fontSize: 9, fontWeight: '900', color: C.danger }}>LVL {skin.minLevel}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Danger Zone */}
            <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
              <Text style={[styles.sectionLabel, { color: C.danger, marginBottom: 12 }]}>ZONA DE PELIGRO</Text>
              
              <TouchableOpacity 
                onPress={handleStatsReset} 
                style={[styles.dangerRow, { backgroundColor: C.card, borderColor: C.border }]}
              >
                <RotateCcw color={C.danger} size={18} />
                <Text style={[styles.dangerLabel, { color: C.textPrimary }]}>Reiniciar Nivel, XP y Medallas</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Alert.alert("Reiniciar Rachas", "¿Poner todas las rachas a cero? Tus hábitos se mantendrán.", [{text: "No"}, {text: "Si", onPress: resetHabits}])} style={[styles.dangerRow, { backgroundColor: C.card, borderColor: C.border }]}>
                <RotateCcw color={C.danger} size={18} />
                <Text style={[styles.dangerLabel, { color: C.textPrimary }]}>Reiniciar todas las Rachas</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFullReset} style={[styles.dangerRow, { backgroundColor: C.card, borderColor: C.border, borderStyle: 'dashed' }]}>
                <Trash2 color={C.danger} size={18} />
                <Text style={[styles.dangerLabel, { color: C.danger, fontWeight: '900' }]}>RESETEO GENERAL (TOTAL)</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDebugUnlock} style={[styles.dangerRow, { backgroundColor: C.accentSoft, borderColor: C.accent, marginTop: 20 }]}>
                <ShieldCheck color={C.accent} size={18} />
                <Text style={[styles.dangerLabel, { color: C.accent }]}>MODO DIOS: DESBLOQUEAR TODO</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSession(null)} style={[styles.logoutBtn, { borderColor: C.dangerSoft, backgroundColor: C.dangerSoft, marginTop: 24 }]} activeOpacity={0.8}>
                <LogOut color={C.danger} size={18} />
                <Text style={[styles.logoutText, { color: C.danger }]}>Cerrar Sesión</Text>
              </TouchableOpacity>

              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>GRIT v1.2.0-ULTIMATE</Text>
                <Text style={{ color: C.textMuted, fontSize: 8, marginTop: 4 }}>BUILD 2026.05.12-PREMIUM</Text>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: C.card }]}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Editar Perfil</Text>
              <Text style={[styles.inputLabel, { color: C.textMuted }]}>NOMBRE DE GUERRERO</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, color: C.textPrimary, borderColor: C.border }]} value={newName} onChangeText={setNewName} />
              <Text style={[styles.inputLabel, { color: C.textMuted, marginTop: 16 }]}>AVATAR (EMOJI)</Text>
              <TextInput style={[styles.input, { backgroundColor: C.background, color: C.textPrimary, borderColor: C.border }]} value={newAvatar} onChangeText={setNewAvatar} maxLength={2} />
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={{ color: C.textMuted }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateProfile} style={[styles.saveBtn, { backgroundColor: C.accent }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={timeModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: C.card }]}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Horario de Misión</Text>
              <Text style={{ color: C.textMuted, marginBottom: 20 }}>Configura la hora exacta para recibir tu frase motivadora.</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.inputLabel, { color: C.textMuted }]}>HORA</Text>
                  <TextInput 
                    style={[styles.timeInput, { backgroundColor: C.background, color: C.textPrimary, borderColor: C.border }]} 
                    value={tempHour} 
                    onChangeText={setTempHour}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="08"
                  />
                </View>
                <Text style={{ fontSize: 32, fontWeight: '800', color: C.textPrimary, marginTop: 15 }}>:</Text>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.inputLabel, { color: C.textMuted }]}>MINUTOS</Text>
                  <TextInput 
                    style={[styles.timeInput, { backgroundColor: C.background, color: C.textPrimary, borderColor: C.border }]} 
                    value={tempMin} 
                    onChangeText={setTempMin}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="00"
                  />
                </View>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setTimeModal(false)} style={styles.cancelBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={{ color: C.textMuted }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSaveTime} style={[styles.saveBtn, { backgroundColor: C.accent }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={{ color: '#FFF', fontWeight: '800' }}>Confirmar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 24, borderBottomWidth: 1 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, position: 'relative' },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0A84FF', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  levelLabel: { fontSize: 12, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  xpWrapper: { width: '70%', marginTop: 16, alignItems: 'center' },
  xpBarBg: { height: 6, width: '100%', borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 3 },
  xpText: { fontSize: 10, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 24, padding: 18, borderWidth: 1 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeItem: { width: (SCREEN_WIDTH - 100) / 4, height: (SCREEN_WIDTH - 100) / 4, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unlockDot: { position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFF' },
  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8, gap: 12 },
  dangerLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1 },
  settingsIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingsLabel: { fontSize: 15, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 22, paddingVertical: 16 },
  logoutText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 },
  cancelBtn: { padding: 12 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  skinCard: { width: 110, padding: 12, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  skinPreview: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  skinName: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  timeInput: { width: 70, height: 70, borderRadius: 16, borderWidth: 1.5, fontSize: 32, fontWeight: '800', textAlign: 'center' },
});
