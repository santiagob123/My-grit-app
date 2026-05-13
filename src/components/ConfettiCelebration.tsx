import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useThemeStore } from '../store/useThemeStore';

export interface ConfettiRef {
  trigger: () => void;
}

const { width } = Dimensions.get('window');

const ConfettiComponent = forwardRef<ConfettiRef>((_, ref) => {
  const [explosionCount, setExplosionCount] = useState(0);
  const { reduceMotion } = useThemeStore();

  useImperativeHandle(ref, () => ({
    trigger: () => {
      if (!reduceMotion) {
        setExplosionCount((prev) => prev + 1);
      }
    },
  }));

  if (explosionCount === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        key={`left-${explosionCount}`}
        count={40}
        origin={{ x: -10, y: 0 }}
        fadeOut={true}
        fallSpeed={2500}
        autoStart={true}
        colors={['#0A84FF', '#32D74B', '#FF9F0A', '#BF5AF2', '#FF453A']}
      />
      <ConfettiCannon
        key={`right-${explosionCount}`}
        count={40}
        origin={{ x: width + 10, y: 0 }}
        fadeOut={true}
        fallSpeed={2500}
        autoStart={true}
        colors={['#0A84FF', '#32D74B', '#FF9F0A', '#BF5AF2', '#FF453A']}
      />
    </View>
  );
});

// Asignamos el nombre para evitar el error de displayName
ConfettiComponent.displayName = 'ConfettiCelebration';

export const ConfettiCelebration = React.memo(ConfettiComponent);
