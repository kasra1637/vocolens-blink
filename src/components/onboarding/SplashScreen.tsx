/**
 * Splash Screen
 *
 * First screen shown on every app launch (before Welcome to Vocolens).
 * - Midnight Glow dark gradient background (app default)
 * - Two soft radial glow orbs pulsing in background
 * - EmotionalCompanion at 30% of screen height, centered
 * - No text, no buttons, no progress bar
 * - Auto-dismisses after ~2.5s with a fade-out
 */

import React, { useEffect, useRef } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { EmotionalCompanion } from "@/components/EmotionalCompanion";

// Midnight Glow — app default dark theme
const BG_GRADIENT = ["#252333", "#181624", "#0F0E1A"] as const;
const GLOW_COLOR  = "rgba(147, 112, 219, 0.12)"; // primary purple, very low opacity

const SOFT = Easing.bezier(0.22, 1, 0.36, 1);

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const companionSize = Math.round(screenHeight * 0.30);

  // ── Animation values ──────────────────────────────────────────────────────

  // Companion entrance: fade + scale
  const companionOpacity = useSharedValue(0);
  const companionScale   = useSharedValue(0.72);

  // Background glow orbs
  const orb1Opacity = useSharedValue(0.3);
  const orb2Opacity = useSharedValue(0.15);

  // Full-screen fade-out before onDone
  const screenOpacity = useSharedValue(1);

  // ── Animated styles ───────────────────────────────────────────────────────

  const companionStyle = useAnimatedStyle(() => ({
    opacity: companionOpacity.value,
    transform: [{ scale: companionScale.value }],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    opacity: orb1Opacity.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    opacity: orb2Opacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  // ── Sequence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Background orbs start pulsing immediately
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
          withTiming(0.45, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.10, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    // Companion fades + springs in at 300ms
    companionOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 700, easing: SOFT }),
    );
    companionScale.value = withDelay(
      300,
      withTiming(1, { duration: 700, easing: SOFT }),
    );

    // Fade screen out at 2200ms, then call onDone
    screenOpacity.value = withDelay(
      2200,
      withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, screenStyle]}>
      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orb 1 — upper-left */}
      <Animated.View
        pointerEvents="none"
        style={[
          orb1Style,
          {
            position: "absolute",
            top: -screenHeight * 0.12,
            left: -screenWidth * 0.20,
            width: screenWidth * 0.85,
            height: screenWidth * 0.85,
            borderRadius: screenWidth * 0.425,
            backgroundColor: GLOW_COLOR,
          },
        ]}
      />

      {/* Glow orb 2 — lower-right */}
      <Animated.View
        pointerEvents="none"
        style={[
          orb2Style,
          {
            position: "absolute",
            bottom: -screenHeight * 0.10,
            right: -screenWidth * 0.25,
            width: screenWidth * 0.80,
            height: screenWidth * 0.80,
            borderRadius: screenWidth * 0.40,
            backgroundColor: GLOW_COLOR,
          },
        ]}
      />

      {/* Companion — centered, 30% screen height */}
      <View style={styles.center}>
        <Animated.View style={companionStyle}>
          <EmotionalCompanion
            state="idle"
            size={companionSize}
            themeColor="#9370DB"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
