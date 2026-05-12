import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GritButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  accentColor?: string;
}

export const GritButton: React.FC<GritButtonProps> = ({
  label, onPress, variant = 'primary', loading = false, disabled = false, accentColor,
}) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={{ opacity: disabled ? 0.5 : 1 }}>
        <LinearGradient
          colors={accentColor ? [accentColor, accentColor + 'CC'] : ['#FFFFFF', '#E0E0E0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          {loading
            ? <ActivityIndicator color={accentColor ? '#FFF' : '#000'} />
            : <Text style={[styles.btnText, { color: accentColor ? '#FFF' : '#000' }]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={[styles.outlineBtn, { borderColor: 'rgba(255,69,58,0.4)', opacity: disabled ? 0.5 : 1 }]}>
        <Text style={[styles.outlineText, { color: '#FF453A' }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={[styles.outlineBtn, { opacity: disabled ? 0.5 : 1 }]}>
      {loading
        ? <ActivityIndicator color="#FFF" />
        : <Text style={styles.outlineText}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 20,
  },
  btnText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  outlineBtn: {
    height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  outlineText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
