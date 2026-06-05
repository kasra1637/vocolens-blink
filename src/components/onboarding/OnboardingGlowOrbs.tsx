/**
 * OnboardingGlowOrbs
 *
 * Pulsing background glow orbs rendered as a full-screen absolute overlay
 * ON TOP of each screen's LinearGradient (rendered as the LAST child of
 * OnboardingFlow so it sits above the gradient but below interactive content).
 *
 * Uses pointerEvents="none" so it never blocks any touches.
 * Color adapts to the user's selected theme primary color.
 */

import React, { useEffect } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import useOnboardingStore, { THEME_COLORS } from "@/lib/state/onboarding-store";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function OnboardingGlowOrbs() {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const primary = THEME_COLORS[selectedTheme].primary;
  const glowColor = hexToRgba(primary, 0.18);

  const orb1Opacity = useSharedValue(0.3);
  const orb2Opacity = useSharedValue(0.15);

  const orb1Style = useAnimatedStyle(() => ({ opacity: orb1Opacity.value }));
  const orb2Style = useAnimatedStyle(() => ({ opacity: orb2Opacity.value }));

  useEffect(() => {
    orb1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.70, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    orb2Opacity.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.12, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  return (
    // absoluteFill wrapper — sits on top of screen gradient, below interactive UI
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Orb 1 — upper-left */}
      <Animated.View
        style={[
          orb1Style,
          {
            position: "absolute",
            top: screenHeight * 0.04,
            left: -screenWidth * 0.22,
            width: screenWidth * 0.90,
            height: screenWidth * 0.90,
            borderRadius: screenWidth * 0.45,
            backgroundColor: glowColor,
          },
        ]}
      />
      {/* Orb 2 — lower-right */}
      <Animated.View
        style={[
          orb2Style,
          {
            position: "absolute",
            bottom: screenHeight * 0.04,
            right: -screenWidth * 0.28,
            width: screenWidth * 0.85,
            height: screenWidth * 0.85,
            borderRadius: screenWidth * 0.425,
            backgroundColor: glowColor,
          },
        ]}
      />
    </View>
  );
}
