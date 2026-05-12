import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import { useThemeStore } from '../store/useThemeStore';
import { useTheme } from '../hooks/useTheme';
import { TrendingUp, Award, Flame, Star, ChevronRight, LogOut, Bell, Lock, Info, Moon, Sun } from 'lucide-react-native';

const QUOTE = { text: '"No cuentes los días, haz que los días cuenten."', author: '— Muhammad Ali' };

export const ProfileScreen = () => {
  const C = useTheme();
  const { setSession } = useAuthStore();
  const { habits } = useHabitStore();
  const { mode, toggleTheme } = useThemeStore();

  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const done = habits.filter(h => h.completed_today).length;
  const isDark = mode === 'dark';

  const stats = [
    { label: 'Racha Total', value: totalStreak, icon: Flame, color: C.warning },
    { label: 'Hoy', value: `${done}/${habits.length}`, icon: Star, color: '#FFD60A' },
    { label: 'Hábitos', value: habits.length, icon: TrendingUp, color: C.accent },
    { label: 'Logros', value: 12, icon: Award, color: C.purple },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* Avatar Hero */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)}>
            <View style={[styles.heroSection, { borderBottomColor: C.border }]}>
              <LinearGradient colors={[C.accentSoft, C.purpleSoft]} style={styles.avatarGradient}>
                <Text style={{ fontSize: 52 }}>🧠</Text>
              </LinearGradient>
              <Text style={[styles.name, { color: C.textPrimary }]}>Guerrero Digital</Text>
              <Text style={[styles.since, { color: C.textMuted }]}>Miembro desde Mayo 2025</Text>
              <View style={[styles.badge, { backgroundColor: C.accentSoft, borderColor: isDark ? 'rgba(10,132,255,0.25)' : 'rgba(0,122,255,0.2)' }]}>
                <Text style={[styles.badgeText, { color: C.accent }]}>⚡ NIVEL 3 · CONSTANTE</Text>
              </View>
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View entering={FadeInDown.delay(250).duration(700)} style={styles.statsGrid}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <View key={i} style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: s.color + '20' }]}>
                    <Icon color={s.color} size={18} />
                  </View>
                  <Text style={[styles.statValue, { color: C.textPrimary }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
                </View>
              );
            })}
          </Animated.View>

          {/* Quote */}
          <Animated.View entering={FadeInDown.delay(400).duration(700)}>
            <LinearGradient colors={C.heroGradient} style={[styles.quoteCard, { borderColor: isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)' }]}>
              <Text style={[styles.quoteTag, { color: C.textMuted }]}>MOTIVACIÓN DEL DÍA</Text>
              <Text style={[styles.quoteText, { color: C.textPrimary }]}>{QUOTE.text}</Text>
              <Text style={[styles.quoteAuthor, { color: C.textMuted }]}>{QUOTE.author}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Settings */}
          <Animated.View entering={FadeInDown.delay(550).duration(700)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>APARIENCIA</Text>

            {/* Theme Toggle Row */}
            <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7} style={[styles.settingsRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={[styles.settingsIconWrap, { backgroundColor: isDark ? '#FFD60A18' : '#00000010' }]}>
                {isDark ? <Moon color="#FFD60A" size={17} /> : <Sun color="#FF9500" size={17} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingsLabel, { color: C.textPrimary }]}>
                  Modo {isDark ? 'Oscuro' : 'Claro'}
                </Text>
                <Text style={[styles.settingsSub, { color: C.textMuted }]}>
                  {isDark ? 'Toca para activar modo claro' : 'Toca para activar modo oscuro'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#ddd', true: '#FFD60A40' }}
                thumbColor={isDark ? '#FFD60A' : '#fff'}
                ios_backgroundColor={C.border}
              />
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>CONFIGURACIÓN</Text>

            {[
              { label: 'Notificaciones', sub: 'Próximamente', icon: Bell, color: C.accent },
              { label: 'Privacidad', sub: 'Protege tus datos', icon: Lock, color: C.purple },
              { label: 'Acerca de Grit', sub: 'Versión 1.0.0', icon: Info, color: C.textSecondary },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity key={i} style={[styles.settingsRow, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.7}>
                  <View style={[styles.settingsIconWrap, { backgroundColor: item.color + '15' }]}>
                    <Icon color={item.color} size={17} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: C.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.settingsSub, { color: C.textMuted }]}>{item.sub}</Text>
                  </View>
                  <ChevronRight color={C.textDisabled} size={17} />
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Sign Out */}
          <Animated.View entering={FadeInDown.delay(650).duration(700)} style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <TouchableOpacity onPress={() => setSession(null)} style={[styles.logoutBtn, { borderColor: C.dangerSoft, backgroundColor: C.dangerSoft }]} activeOpacity={0.8}>
              <LogOut color={C.danger} size={18} />
              <Text style={[styles.logoutText, { color: C.danger }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 32, borderBottomWidth: 1 },
  avatarGradient: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  since: { fontSize: 13, marginTop: 5, marginBottom: 14 },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 24, padding: 18, borderWidth: 1 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 2 },
  quoteCard: { marginHorizontal: 20, marginTop: 14, borderRadius: 28, padding: 24, borderWidth: 1 },
  quoteTag: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 12 },
  quoteText: { fontSize: 17, fontWeight: '600', fontStyle: 'italic', lineHeight: 26 },
  quoteAuthor: { fontSize: 12, marginTop: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 12 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 8, borderWidth: 1 },
  settingsIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingsLabel: { fontSize: 15, fontWeight: '600' },
  settingsSub: { fontSize: 12, marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 22, borderWidth: 1, paddingVertical: 16, marginTop: 4 },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
