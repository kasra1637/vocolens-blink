/**
 * TestPurchaseDialog
 *
 * Simulates RevenueCat's Test Store purchase dialog for environments where
 * the native SDK is unavailable (Expo Go / web). In a real development build,
 * RevenueCat's Test Store (test_ API key) shows a native dialog automatically.
 *
 * This component provides the same three outcomes:
 *   1. Successful Purchase — grants entitlement, updates subscription store
 *   2. Failed Purchase — shows error, does not grant
 *   3. Cancel — dismisses without action
 *
 * Usage:
 *   <TestPurchaseDialog
 *     visible={showDialog}
 *     plan="yearly"
 *     price="$79.99"
 *     onSuccess={() => { grant(); close(); }}
 *     onCancel={() => close()}
 *   />
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, X, AlertTriangle, ShieldCheck } from "lucide-react-native";
import { tapHaptic, successHaptic, errorHaptic } from "@/lib/haptics";

export type TestPurchaseOutcome = "success" | "fail" | "cancel";

interface TestPurchaseDialogProps {
  visible: boolean;
  plan: string;
  price: string;
  onSuccess: () => void;
  onFail?: () => void;
  onCancel: () => void;
}

export function TestPurchaseDialog({
  visible,
  plan,
  price,
  onSuccess,
  onFail,
  onCancel,
}: TestPurchaseDialogProps) {
  const handleSuccess = () => {
    successHaptic();
    onSuccess();
  };

  const handleFail = () => {
    errorHaptic();
    onFail?.();
    onCancel();
  };

  const handleCancel = () => {
    tapHaptic();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.7)",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <LinearGradient
            colors={["#1a1a2e", "#16213e"]}
            style={{ padding: 24, paddingBottom: 20 }}
          >
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <ShieldCheck size={28} color="#4ade80" strokeWidth={1.8} />
              </View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 17,
                  color: "#FFFFFF",
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                Test Purchase
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                This is a sandbox test purchase only.{"\n"}No real payment will be processed.
              </Text>
            </View>

            {/* Plan info */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" }}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1).replace("_", " ")} Plan
                </Text>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" }}>
                  {price}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 4,
                }}
              >
                RevenueCat Test Store — {Platform.OS === "ios" ? "iOS" : "Android"} Sandbox
              </Text>
            </View>

            {/* Action buttons */}
            <View style={{ gap: 10 }}>
              {/* Success */}
              <Pressable
                onPress={handleSuccess}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "rgba(74, 222, 128, 0.15)",
                  borderWidth: 1.5,
                  borderColor: "rgba(74, 222, 128, 0.5)",
                  borderRadius: 14,
                  paddingVertical: 14,
                }}
              >
                <Check size={18} color="#4ade80" strokeWidth={2.5} />
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#4ade80" }}>
                  Successful Purchase
                </Text>
              </Pressable>

              {/* Fail */}
              <Pressable
                onPress={handleFail}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "rgba(248, 113, 113, 0.1)",
                  borderWidth: 1.5,
                  borderColor: "rgba(248, 113, 113, 0.4)",
                  borderRadius: 14,
                  paddingVertical: 14,
                }}
              >
                <AlertTriangle size={18} color="#f87171" strokeWidth={2.5} />
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#f87171" }}>
                  Failed Purchase
                </Text>
              </Pressable>

              {/* Cancel */}
              <Pressable
                onPress={handleCancel}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.2)",
                  borderRadius: 14,
                  paddingVertical: 14,
                }}
              >
                <X size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Environment: Test Store (test_ API key) — No charges applied
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}
