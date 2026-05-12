import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface GritCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'glass' | 'solid';
}

export const GritCard: React.FC<GritCardProps> = ({ 
  children, 
  className, 
  variant = 'solid',
  ...props 
}) => {
  return (
    <View
      className={cn(
        'rounded-[32px] p-6 shadow-2xl',
        variant === 'solid' ? 'bg-[#121212] border border-white/5' : 'bg-secondary/50 border border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
};
