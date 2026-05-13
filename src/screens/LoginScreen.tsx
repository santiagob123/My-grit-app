import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../hooks/useTheme';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { Mail, Lock, User, LogIn, ChevronRight, Globe as Google } from 'lucide-react-native';

export const LoginScreen = () => {
  const C = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { username },
            emailRedirectTo: 'https://jhjmxnijihftgyrdmkbt.supabase.co/auth/v1/callback'
          }
        });
        if (error) throw error;
        Alert.alert('Éxito', '¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('Error de Autenticación', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://jhjmxnijihftgyrdmkbt.supabase.co/auth/v1/callback'
      }
    });
    
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            
            <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
              <LinearGradient colors={[C.accent, '#BF5AF2']} style={styles.logoBox}>
                <Text style={{ fontSize: scale(40) }}>💎</Text>
              </LinearGradient>
              <Text style={[styles.title, { color: C.textPrimary }]}>Grit Habit</Text>
              <Text style={[styles.subtitle, { color: C.textMuted }]}>
                {isLogin ? 'Bienvenido de nuevo, Guerrero' : 'Crea tu leyenda hoy'}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.form}>
              {!isLogin && (
                <View style={[styles.inputGroup, { backgroundColor: C.card, borderColor: C.border }]}>
                  <User color={C.textMuted} size={20} />
                  <TextInput
                    placeholder="Nombre de usuario"
                    placeholderTextColor={C.textDisabled}
                    style={[styles.input, { color: C.textPrimary }]}
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
              )}

              <View style={[styles.inputGroup, { backgroundColor: C.card, borderColor: C.border }]}>
                <Mail color={C.textMuted} size={20} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={C.textDisabled}
                  style={[styles.input, { color: C.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: C.card, borderColor: C.border }]}>
                <Lock color={C.textMuted} size={20} />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor={C.textDisabled}
                  style={[styles.input, { color: C.textPrimary }]}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.mainBtn, { backgroundColor: C.accent, shadowColor: C.accent }]} 
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.mainBtnText}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</Text>
                    <ChevronRight color="#FFF" size={20} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: C.border }]} />
                <Text style={[styles.dividerText, { color: C.textMuted }]}>O CONTINÚA CON</Text>
                <View style={[styles.line, { backgroundColor: C.border }]} />
              </View>

              <TouchableOpacity style={[styles.googleBtn, { borderColor: C.border }]} onPress={handleGoogleLogin}>
                <Google color={C.textPrimary} size={20} />
                <Text style={[styles.googleBtnText, { color: C.textPrimary }]}>Google</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.footer}>
              <Text style={{ color: C.textMuted }}>
                {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <Text style={{ color: C.accent, fontWeight: '700' }}>{isLogin ? 'Regístrate' : 'Inicia Sesión'}</Text>
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: scale(24), paddingBottom: verticalScale(40) },
  header: { alignItems: 'center', marginTop: verticalScale(60), marginBottom: verticalScale(40) },
  logoBox: { width: scale(80), height: scale(80), borderRadius: scale(24), alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: moderateScale(32), fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: moderateScale(16), marginTop: 8 },
  form: { gap: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: scale(56), borderRadius: 16, borderWidth: 1 },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  mainBtn: { height: scale(56), borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, elevation: 4 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30, gap: 10 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: '800' },
  googleBtn: { height: scale(56), borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1 },
  googleBtnText: { fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 40 },
});
