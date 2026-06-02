/**
 * tabAnimations.ts
 *
 * Shared entrance animation constants for all five main tab screens.
 * Uses the exact same easing curve as the onboarding WelcomeScreen so
 * the feel is consistent throughout the entire app experience.
 *
 * SOFT = Easing.bezier(0.22, 1, 0.36, 1)  — gentle deceleration, low overwhelm
 *
 * Usage:
 *   import { TAB_ENTER_1, TAB_ENTER_2, TAB_ENTER_3 } from "@/lib/tabAnimations";
 *   <Animated.View entering={TAB_ENTER_1}> ... </Animated.View>
 */
import { FadeIn, Easing } from "react-native-reanimated";

/** Identical easing to WelcomeScreen SOFT constant */
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);

export const TAB_ENTER_1 = FadeIn.duration(900).delay(100).easing(SOFT);
export const TAB_ENTER_2 = FadeIn.duration(900).delay(250).easing(SOFT);
export const TAB_ENTER_3 = FadeIn.duration(900).delay(400).easing(SOFT);
export const TAB_ENTER_4 = FadeIn.duration(900).delay(550).easing(SOFT);
export const TAB_ENTER_5 = FadeIn.duration(900).delay(700).easing(SOFT);
export const TAB_ENTER_6 = FadeIn.duration(800).delay(850).easing(SOFT);
