/**
 * OnboardingGlowOrbs
 *
 * Reusable pulsing background glow orbs used on every onboarding screen.
 * Renders as a non-interactive absolute overlay — place as the FIRST
 * child inside any screen's root View so content renders on top.
 *
 * Two orbs pulse independently at different frequencies and offsets,
 * creating a gentle living background effect without distraction.
 */

import React, { useEffect } from "react";
import { useWindowDimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

// Primary purple at very low opacity — matches Midnight Glow default
const GLOW_COLOR = "rgba(147, 112, 219, 0.10)";

export function OnboardingGlowOrbs() {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const orb1Opacity = useSharedValue(0.25);
  const orb2Opacity = useSharedValue(0.12);

  const orb1Style = useAnimatedStyle(() => ({ opacity: orb1Opacity.value }));
  const orb2Style = useAnimatedStyle(() => ({ opacity: orb2Opacity.value }));

  useEffect(() => {
    orb1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.20, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    orb2Opacity.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(0.42, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.08, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  return (
    <>
      {/* Orb 1 — upper-left */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb,
          orb1Style,
          {
            top: -screenHeight * 0.12,
            left: -screenWidth * 0.20,
            width: screenWidth * 0.85,
            height: screenWidth * 0.85,
            borderRadius: screenWidth * 0.425,
            backgroundColor: GLOW_COLOR,
          },
        ]}
      />
      {/* Orb 2 — lower-right */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb,
          orb2Style,
          {
            bottom: -screenHeight * 0.10,
            right: -screenWidth * 0.25,
            width: screenWidth * 0.80,
            height: screenWidth * 0.80,
            borderRadius: screenWidth * 0.40,
            backgroundColor: GLOW_COLOR,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  orb: { position: "absolute" },
});
