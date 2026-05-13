import { useThemeStore } from '../store/useThemeStore';
import { SKINS, Skin } from '../theme/skins';

export const useTheme = () => {
  const { mode, skinId } = useThemeStore();
  const isDark = mode === 'dark';
  
  const currentSkin = SKINS.find(s => s.id === skinId) || SKINS[0];

  // Paleta Base (Classic)
  const baseColors = {
    light: {
      background: '#F2F2F7',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      textPrimary: '#000000',
      textSecondary: '#3C3C43',
      textMuted: '#8E8E93',
      textDisabled: '#C7C7CC',
      accent: '#0A84FF',
      accentSoft: '#0A84FF15',
      border: '#E5E5EA',
      borderStrong: '#C7C7CC',
      success: '#34C759',
      warning: '#FF9500',
      danger: '#FF3B30',
      dangerSoft: '#FF3B3015',
    },
    dark: {
      background: '#000000',
      surface: '#1C1C1E',
      card: '#1C1C1E',
      textPrimary: '#FFFFFF',
      textSecondary: '#EBEBF5',
      textMuted: '#8E8E93',
      textDisabled: '#48484A',
      accent: '#0A84FF',
      accentSoft: '#0A84FF20',
      border: '#38383A',
      borderStrong: '#48484A',
      success: '#32D74B',
      warning: '#FFD60A',
      danger: '#FF453A',
      dangerSoft: '#FF453A20',
    }
  };

  let colors = isDark ? baseColors.dark : baseColors.light;

  // Personalización por Skin
  if (skinId === 'minecraft') {
    colors = {
      ...colors,
      accent: '#4CAF50', // Grass Green
      background: isDark ? '#1a1a1a' : '#87CEEB', // Dark stone or Sky blue
      card: isDark ? '#3d3d3d' : '#795548', // Stone or Dirt
      textPrimary: '#FFFFFF',
      border: '#000000',
      borderStrong: '#000000',
    };
  } else if (skinId === 'football') {
    colors = {
      ...colors,
      accent: '#1B5E20', // Pitch Green
      background: isDark ? '#0a1a0a' : '#E8F5E9',
      card: isDark ? '#1b3b1b' : '#FFFFFF',
      border: '#1B5E20',
    };
  } else if (skinId === 'fire') {
    colors = {
      ...colors,
      accent: '#FF4500', // Orange Red
      warning: '#FFD700',
      danger: '#8B0000',
    };
  } else if (skinId === 'ice') {
    colors = {
      ...colors,
      accent: '#00FFFF', // Cyan
      background: isDark ? '#000b1a' : '#F0F8FF',
      card: isDark ? '#001a33' : '#FFFFFF',
    };
  }

  const shadowStyle = currentSkin.shadowStyle || (isDark ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  });

  return {
    ...colors,
    mode,
    skinId,
    borderRadius: currentSkin.borderRadius,
    borderWidth: currentSkin.borderWidth,
    showGlow: currentSkin.showGlow,
    shadowStyle,
  };
};
