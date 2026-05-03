/**
 * Glass Surface Design System
 *
 * Provides the layered glass treatment used across all surfaces in the app.
 * v2: "True Glass" with backdrop blur, depth layers, and gradient borders.
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

// ─── Color Utility ────────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Component: GlassLayers ───────────────────────────────────────────────────

interface GlassLayersProps {
  primaryColor: string;
  tintColor?: string; // Darker side color
  borderRadius?: number;
  /** Add a BlurView base layer. v2: enabled by default for true glass. */
  blur?: boolean;
  blurIntensity?: number;
}

/**
 * Renders the full layered glass surface stack.
 * Place as the FIRST child inside a container with `overflow: 'hidden'`.
 */
export function GlassLayers({
  primaryColor,
  tintColor,
  borderRadius = 24,
  blur = true,
  blurIntensity = 80,
}: GlassLayersProps) {
  const finalTint = tintColor || primaryColor;

  return (
    <>
      {/* 1. Backdrop Blur - enables background to show through */}
      {blur && (
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* 2. Background Tint Wash - reduced opacity to match Weekly Reflection (0.1) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: hexToRgba(finalTint, 0.1) },
        ]}
      />

      {/* 3. Gradient Border - TL white to BR transparent */}
      {/* Simulation: absolute gradient with 1px inset body */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.45)",
          "rgba(255,255,255,0.05)",
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 4. Main Glass Inner Body (Inset by 1px for the border) */}
      <View
        style={{
          position: "absolute",
          top: 1,
          left: 1,
          right: 1,
          bottom: 1,
          borderRadius: borderRadius - 1,
          backgroundColor: hexToRgba(finalTint, 0.05), // extra subtle depth
          overflow: "hidden",
        }}
      >
        {/* 5. Inner Depth - Top Inset Highlight */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 10,
            right: 10,
            height: 1,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
          }}
        />

        {/* 6. Inner Depth - Bottom Inset Glow (darker side softened) */}
        <LinearGradient
          colors={["transparent", hexToRgba(finalTint, 0.12)]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 20,
          }}
        />
      </View>
    </>
  );
}

// ─── Component: GlassCard ─────────────────────────────────────────────────────

interface GlassCardProps {
  primaryColor: string;
  tintColor?: string;
  borderRadius?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Enhanced GlassCard with gradient borders and depth.
 */
export function GlassCard({
  primaryColor,
  tintColor,
  borderRadius = 24,
  children,
  style,
}: GlassCardProps) {
  return (
    <View style={[{ borderRadius, overflow: "hidden" }, style]}>
      <GlassLayers
        primaryColor={primaryColor}
        tintColor={tintColor}
        borderRadius={borderRadius}
      />
      {children}
    </View>
  );
}
