import { useThemeStore } from '../store/useThemeStore';
import { darkColors, lightColors, AppColors } from '../theme/colors';

export const useTheme = (): AppColors => {
  const mode = useThemeStore((s) => s.mode);
  return mode === 'dark' ? darkColors : lightColors;
};
