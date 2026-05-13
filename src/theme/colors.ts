// Theme color tokens for Grit App

export interface AppColors {
  background: string;
  surface: string;
  card: string;
  cardAlt: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  purple: string;
  purpleSoft: string;
  heroGradient: readonly [string, string, ...string[]];
  tabBar: string;
  tabBarBorder: string;
  isDark: boolean;
}

export const darkColors: AppColors = {
  background: '#000000',
  surface: '#0D0D0D',
  card: '#111111',
  cardAlt: '#141414',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.25)',
  textDisabled: 'rgba(255,255,255,0.12)',
  accent: '#0A84FF',
  accentSoft: 'rgba(10,132,255,0.15)',
  success: '#32D74B',
  successSoft: 'rgba(50,215,75,0.15)',
  danger: '#FF453A',
  dangerSoft: 'rgba(255,69,58,0.1)',
  warning: '#FF9F0A',
  warningSoft: 'rgba(255,159,10,0.15)',
  purple: '#BF5AF2',
  purpleSoft: 'rgba(191,90,242,0.15)',
  heroGradient: ['#0A2040', '#000D1F'],
  tabBar: 'rgba(18,18,18,0.95)',
  tabBarBorder: 'rgba(255,255,255,0.05)',
  isDark: true,
};

export const lightColors: AppColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F9F9FB',
  border: 'rgba(0,0,0,0.06)',
  borderStrong: 'rgba(0,0,0,0.15)',
  textPrimary: '#000000',
  textSecondary: 'rgba(0,0,0,0.55)',
  textMuted: 'rgba(0,0,0,0.3)',
  textDisabled: 'rgba(0,0,0,0.15)',
  accent: '#007AFF',
  accentSoft: 'rgba(0,122,255,0.1)',
  success: '#34C759',
  successSoft: 'rgba(52,199,89,0.1)',
  danger: '#FF3B30',
  dangerSoft: 'rgba(255,59,48,0.08)',
  warning: '#FF9500',
  warningSoft: 'rgba(255,149,0,0.1)',
  purple: '#AF52DE',
  purpleSoft: 'rgba(175,82,222,0.1)',
  heroGradient: ['#E3F0FF', '#EEF4FF'],
  tabBar: 'rgba(255,255,255,0.95)',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  isDark: false,
};

export type ThemeMode = 'dark' | 'light';
