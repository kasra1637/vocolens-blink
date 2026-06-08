/**
 * AnimatedPill
 *
 * Reusable pressable pill with spring scale animation + haptic feedback.
 * Matches the Emotional Themes ThemeChip interaction exactly:
 *   press → withSpring(0.95) scale down + tapHaptic()
 *   release → withSpring(1) bounce back
 *
 * Used across all Insights tab/range selectors for consistent feel.
 */

import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { tapHaptic } from '@/lib/haptics';

interface AnimatedPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeStyle: ViewStyle;
  inactiveStyle: ViewStyle;
  activeTextStyle: TextStyle;
  inactiveTextStyle: TextStyle;
}

export function AnimatedPill({
  label,
  isActive,
  onPress,
  activeStyle,
  inactiveStyle,
  activeTextStyle,
  inactiveTextStyle,
}: AnimatedPillProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    tapHaptic();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[isActive ? activeStyle : inactiveStyle, animStyle]}>
        <Text style={isActive ? activeTextStyle : inactiveTextStyle}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
