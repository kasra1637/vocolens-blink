/**
 * PaywallScreen v2 — High-converting annual-first paywall
 *
 * Design principles:
 * - Warm, reflective, trustworthy, premium — not aggressive or salesy
 * - Annual plan selected by default with 7-day free trial
 * - Monthly plan visible for flexibility (no trial)
 * - Single-screen layout: headline → plans → CTA → reassurance
 * - Feature flag support for A/B testing
 * - Analytics events for full funnel visibility
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, Easing } from "react-native-reanimated";
const SOFT = Easing.bezier(0.16, 1, 0.3, 1);
import { tapHaptic, successHaptic, errorHaptic, selectHaptic } from "@/lib/haptics";
import { Check, ChevronRight, Shield } from "lucide-react-native";
import useOnboardingStore, { THEME_COLORS } from "@/lib/state/onboarding-store";
import useSubscriptionStore from "@/lib/state/subscription-store";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { BackButton } from "@/components/onboarding/BackButton";
import { useClickSound } from "@/lib/hooks/useClickSound";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatEnabled,
} from "@/lib/revenuecatClient";
import type { PurchasesPackage } from "@/lib/revenuecatClient";
import { NotificationService } from "@/lib/services/notification-service";

// ── Feature Flags ─────────────────────────────────────────────────────────────
// Toggle these for A/B testing via remote config or hard-code for now
const FEATURE_FLAGS = {
  paywall_v2: true,
  trial_on_annual: true, // 7-day free trial on annual plan
  savings_label: true, // Show "Save 33%" badge
  default_selected_plan: "yearly" as "yearly" | "monthly",
};

// ── Analytics ─────────────────────────────────────────────────────────────────
function trackEvent(event: string, properties?: Record<string, any>) {
  // Replace with your analytics provider (Mixpanel, Amplitude, PostHog, etc.)
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties ?? "");
  }
}

// ── Pricing ───────────────────────────────────────────────────────────────────
const MONTHLY_PRICE = "$9.99";
const YEARLY_PRICE = "$79.99";
const YEARLY_MONTHLY_EQUIVALENT = "$6.67";
const YEARLY_SAVINGS = "33%";
const TRIAL_DAYS = 7;

type PlanType = "yearly" | "monthly";

// ── Main Component ────────────────────────────────────────────────────────────
export function PaywallScreen() {
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const themeColors = THEME_COLORS[selectedTheme];
  const playClickSound = useClickSound();
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    FEATURE_FLAGS.default_selected_plan,
  );
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    trackEvent("paywall_shown", {
      version: "v2",
      default_plan: FEATURE_FLAGS.default_selected_plan,
      trial_enabled: FEATURE_FLAGS.trial_on_annual,
    });

    if (!isRevenueCatEnabled()) return;
    getOfferings().then((result) => {
      if (!result.ok || !result.data.current) return;
      const pkgs = result.data.current.availablePackages;
      setMonthlyPackage(pkgs.find((p) => p.identifier === "$rc_monthly") ?? null);
      setYearlyPackage(pkgs.find((p) => p.identifier === "$rc_annual") ?? null);
    });
  }, []);

  // ── Plan selection ────────────────────────────────────────────────────────
  const handleSelectPlan = (plan: PlanType) => {
    if (plan === selectedPlan) return;
    playClickSound();
    selectHaptic();
    setSelectedPlan(plan);
    trackEvent("plan_selected", { plan });
  };

  // ── Purchase ──────────────────────────────────────────────────────────────
  const handleCTA = async () => {
    playClickSound();
    tapHaptic();
    trackEvent("cta_tapped", { plan: selectedPlan });

    if (!isRevenueCatEnabled()) {
      grantAccess(selectedPlan);
      return;
    }

    const pkg = selectedPlan === "yearly" ? yearlyPackage : monthlyPackage;
    if (!pkg) {
      grantAccess(selectedPlan);
      return;
    }

    setIsPurchasing(true);
    const result = await purchasePackage(pkg);
    setIsPurchasing(false);

    if (result.ok) {
      const expDate = result.data.entitlements.active?.["premium"]?.expirationDate;
      grantAccess(selectedPlan, expDate);
    } else if (result.reason === "sdk_error") {
      const userCancelled = (result.error as any)?.userCancelled === true;
      if (userCancelled) {
        errorHaptic();
      } else {
        grantAccess(selectedPlan);
      }
    }
  };

  const grantAccess = (plan: PlanType, expirationDate?: string | null) => {
    successHaptic();
    setSubscription(true, plan);
    if (plan === "yearly" && FEATURE_FLAGS.trial_on_annual) {
      NotificationService.scheduleTrialEndReminder(expirationDate ?? null);
    }
    nextStep();
  };

  // ── Restore ───────────────────────────────────────────────────────────────
  const handleRestore = async () => {
    if (!isRevenueCatEnabled()) return;
    playClickSound();
    trackEvent("restore_tapped");
    setIsRestoring(true);
    const result = await restorePurchases();
    setIsRestoring(false);
    if (result.ok) {
      const isActive = Boolean(result.data.entitlements.active?.["premium"]);
      if (isActive) {
        successHaptic();
        setSubscription(true);
        nextStep();
      } else {
        errorHaptic();
        Alert.alert(
          "No Active Subscription",
          "We couldn't find an active subscription to restore.",
        );
      }
    } else {
      errorHaptic();
      Alert.alert(
        "Restore Failed",
        "We couldn't find any previous purchases to restore.",
      );
    }
  };

  // ── Back / Close ──────────────────────────────────────────────────────────
  const handleBack = () => {
    playClickSound();
    tapHaptic();
    trackEvent("paywall_closed");
    prevStep();
  };

  // ── CTA label ─────────────────────────────────────────────────────────────
  const ctaLabel =
    selectedPlan === "yearly" && FEATURE_FLAGS.trial_on_annual
      ? `Start Free ${TRIAL_DAYS}-Day Trial`
      : "Subscribe Now";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={themeColors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ProgressBar currentStep={currentStep} totalSteps={14} />

        <SafeAreaView style={{ flex: 1 }}>
          <BackButton onPress={handleBack} show={currentStep > 0} />

          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              justifyContent: "space-between",
              paddingTop: 16,
              paddingBottom: 24,
            }}
          >
            {/* ── Hero headline ── */}
            <Animated.View
              entering={FadeIn.delay(50).duration(700).easing(SOFT)}
              style={{ alignItems: "center", marginBottom: 8 }}
            >
              <Text
                style={{
                  fontFamily: "Fraunces_700Bold",
                  color: "#FFFFFF",
                  fontSize: 26,
                  textAlign: "center",
                  lineHeight: 34,
                  opacity: 0.92,
                  letterSpacing: 0.2,
                }}
              >
                Your journal is ready.{"\n"}Let's make it yours.
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 14,
                  textAlign: "center",
                  marginTop: 10,
                  lineHeight: 21,
                  maxWidth: 280,
                }}
              >
                Unlimited voice entries, AI insights, and emotional clarity — starting today.
              </Text>
            </Animated.View>

            {/* ── Plan cards ── */}
            <Animated.View
              entering={FadeIn.delay(180).duration(700).easing(SOFT)}
              style={{ gap: 12 }}
            >
              {/* Annual card */}
              <Pressable onPress={() => handleSelectPlan("yearly")}>
                <View
                  style={{
                    borderRadius: 20,
                    borderWidth: selectedPlan === "yearly" ? 2.5 : 1.5,
                    borderColor:
                      selectedPlan === "yearly"
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.20)",
                    backgroundColor:
                      selectedPlan === "yearly"
                        ? "rgba(255,255,255,0.18)"
                        : "rgba(255,255,255,0.06)",
                    padding: 18,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Best value badge */}
                  {FEATURE_FLAGS.savings_label && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: "#FFFFFF",
                        borderBottomLeftRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          fontSize: 10,
                          color: themeColors.primary,
                          letterSpacing: 0.5,
                        }}
                      >
                        BEST VALUE
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            color: "#FFFFFF",
                            fontSize: 16,
                          }}
                        >
                          Annual
                        </Text>
                        {FEATURE_FLAGS.trial_on_annual && (
                          <View
                            style={{
                              backgroundColor: "rgba(255,255,255,0.20)",
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "Inter_600SemiBold",
                                color: "#FFFFFF",
                                fontSize: 10,
                                letterSpacing: 0.3,
                              }}
                            >
                              {TRIAL_DAYS}-DAY FREE TRIAL
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                        <Text
                          style={{
                            fontFamily: "Fraunces_700Bold",
                            color: "#FFFFFF",
                            fontSize: 28,
                          }}
                        >
                          {YEARLY_PRICE}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Inter_400Regular",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 12,
                          }}
                        >
                          /year
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontFamily: "Inter_400Regular",
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Just {YEARLY_MONTHLY_EQUIVALENT}/month · Save {YEARLY_SAVINGS}
                      </Text>
                    </View>

                    {/* Radio indicator */}
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor:
                          selectedPlan === "yearly"
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.35)",
                        backgroundColor:
                          selectedPlan === "yearly"
                            ? "#FFFFFF"
                            : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedPlan === "yearly" && (
                        <Check size={14} color={themeColors.primary} strokeWidth={3} />
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>

              {/* Monthly card */}
              <Pressable onPress={() => handleSelectPlan("monthly")}>
                <View
                  style={{
                    borderRadius: 20,
                    borderWidth: selectedPlan === "monthly" ? 2.5 : 1.5,
                    borderColor:
                      selectedPlan === "monthly"
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.20)",
                    backgroundColor:
                      selectedPlan === "monthly"
                        ? "rgba(255,255,255,0.18)"
                        : "rgba(255,255,255,0.06)",
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          color: "#FFFFFF",
                          fontSize: 16,
                          marginBottom: 6,
                        }}
                      >
                        Monthly
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                        <Text
                          style={{
                            fontFamily: "Fraunces_700Bold",
                            color: "#FFFFFF",
                            fontSize: 28,
                          }}
                        >
                          {MONTHLY_PRICE}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Inter_400Regular",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 12,
                          }}
                        >
                          /month
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: "Inter_400Regular",
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        No commitment · Cancel anytime
                      </Text>
                    </View>

                    {/* Radio indicator */}
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor:
                          selectedPlan === "monthly"
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.35)",
                        backgroundColor:
                          selectedPlan === "monthly"
                            ? "#FFFFFF"
                            : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedPlan === "monthly" && (
                        <Check size={14} color={themeColors.primary} strokeWidth={3} />
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* ── CTA + reassurance ── */}
            <Animated.View
              entering={FadeIn.delay(320).duration(600).easing(SOFT)}
              style={{ alignItems: "center" }}
            >
              {/* Primary CTA */}
              <Pressable
                onPress={handleCTA}
                disabled={isPurchasing}
                style={{
                  width: "100%",
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: Platform.OS === "android" ? 0 : 8,
                  opacity: isPurchasing ? 0.7 : 1,
                }}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.28)", "rgba(255,255,255,0.10)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 17,
                    gap: 8,
                  }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontFamily: "Inter_700Bold",
                          fontSize: 17,
                        }}
                      >
                        {ctaLabel}
                      </Text>
                      <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Billing reassurance */}
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 12,
                  lineHeight: 18,
                }}
              >
                {selectedPlan === "yearly" && FEATURE_FLAGS.trial_on_annual
                  ? `No charge for ${TRIAL_DAYS} days · Then ${YEARLY_PRICE}/yr · Cancel anytime`
                  : `${MONTHLY_PRICE}/month · Cancel anytime`}
              </Text>

              {/* Trust cue */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 14,
                  opacity: 0.55,
                }}
              >
                <Shield size={12} color="#FFFFFF" strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: "#FFFFFF",
                    fontSize: 11,
                  }}
                >
                  Trusted by people building a daily reflection habit
                </Text>
              </View>

              {/* Restore */}
              <Pressable
                onPress={handleRestore}
                disabled={isRestoring}
                style={{ marginTop: 14 }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: "rgba(255,255,255,0.40)",
                    fontSize: 12,
                  }}
                >
                  {isRestoring ? "Restoring..." : "Restore purchases"}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
