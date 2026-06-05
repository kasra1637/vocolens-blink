/**
 * BodyHeatmapCard
 *
 * Displays an interactive SVG body map showing which regions the user
 * has felt emotional sensations in, with heat coloring based on
 * accumulated frequency and intensity from all journal entries.
 *
 * Placed on the Insights screen below the Valence-Arousal chart.
 */

import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Svg, { Ellipse, Rect, G, Path, Circle } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { JournalEntry, BodyRegion, BODY_REGION_LABELS, BODY_REGION_EMOJIS } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegionStat {
  count: number;
  totalIntensity: number;
  avgIntensity: number;
  heat: number; // 0–1 normalised
}

type RegionStats = Partial<Record<BodyRegion, RegionStat>>;

// ── Heat colour interpolation ─────────────────────────────────────────────────
// Low  → cool transparent white
// High → bright theme primary (passed as prop)

function heatColor(heat: number, primary: string, alpha: number): string {
  // heat 0→1: interpolate alpha from 0.15 to 0.90
  const a = (0.15 + heat * 0.75) * alpha;
  return primary.startsWith("#")
    ? hexToRgbaLocal(primary, a)
    : primary;
}

function hexToRgbaLocal(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

// ── SVG layout constants ───────────────────────────────────────────────────────
// All coords in a 180×340 viewport; scaled to fill the card width.

const VP_W = 180;
const VP_H = 340;

// Each region: { cx, cy, rx, ry } for Ellipse, or { x, y, w, h, r } for Rect
const REGION_SHAPES: Record<BodyRegion, { cx: number; cy: number; rx: number; ry: number }> = {
  head:    { cx: 90, cy: 28,  rx: 22, ry: 26 },
  face:    { cx: 90, cy: 58,  rx: 16, ry: 14 },
  neck:    { cx: 90, cy: 83,  rx: 10, ry: 10 },
  chest:   { cx: 90, cy: 120, rx: 32, ry: 26 },
  stomach: { cx: 90, cy: 168, rx: 26, ry: 22 },
  arms:    { cx: 90, cy: 145, rx: 55, ry: 14 },
  hands:   { cx: 90, cy: 200, rx: 52, ry: 10 },
  legs:    { cx: 90, cy: 262, rx: 28, ry: 50 },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  entries: JournalEntry[];
  primaryColor: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BodyHeatmapCard({ entries, primaryColor }: Props) {
  const [selected, setSelected] = useState<BodyRegion | null>(null);

  // Aggregate body region data across all entries
  const stats: RegionStats = useMemo(() => {
    const raw: Record<string, { count: number; total: number }> = {};
    entries.forEach((e) => {
      (e.bodyRegions ?? []).forEach((br) => {
        if (!raw[br.region]) raw[br.region] = { count: 0, total: 0 };
        raw[br.region].count++;
        raw[br.region].total += br.intensity;
      });
    });

    // Find max count for normalisation
    const maxCount = Math.max(1, ...Object.values(raw).map((v) => v.count));

    const result: RegionStats = {};
    (Object.keys(raw) as BodyRegion[]).forEach((region) => {
      const { count, total } = raw[region];
      result[region] = {
        count,
        totalIntensity: total,
        avgIntensity: parseFloat((total / count).toFixed(1)),
        heat: count / maxCount,
      };
    });
    return result;
  }, [entries]);

  const hasAnyData = Object.keys(stats).length > 0;
  const totalScans = entries.filter((e) => (e.bodyRegions ?? []).length > 0).length;
  const selectedStat = selected ? stats[selected] : null;

  // Scale SVG to card width
  const cardWidth = Dimensions.get("window").width - 48 - 40; // screen - horizontal padding - card padding
  const scale = cardWidth / VP_W;
  const svgHeight = VP_H * scale;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🫀</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Body Sensation Map</Text>
          <Text style={styles.subtitle}>
            {hasAnyData
              ? `Based on ${totalScans} body scan${totalScans !== 1 ? "s" : ""}`
              : "Complete body scans to see patterns"}
          </Text>
        </View>
      </View>

      {!hasAnyData ? (
        // Empty state
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧘</Text>
          <Text style={styles.emptyText}>
            When you tap body regions during journaling, your patterns will appear here.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>

          {/* SVG Body */}
          <View style={{ width: cardWidth * 0.52 }}>
            <Svg
              width={cardWidth * 0.52}
              height={svgHeight}
              viewBox={`0 0 ${VP_W} ${VP_H}`}
            >
              {/* Body silhouette outline */}
              <G opacity={0.18}>
                {/* Head */}
                <Ellipse cx={90} cy={28} rx={22} ry={26} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Torso */}
                <Rect x={60} y={90} width={60} height={120} rx={14} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Left arm */}
                <Rect x={18} y={95} width={42} height={22} rx={11} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Right arm */}
                <Rect x={120} y={95} width={42} height={22} rx={11} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Left hand */}
                <Ellipse cx={26} cy={200} rx={16} ry={10} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Right hand */}
                <Ellipse cx={154} cy={200} rx={16} ry={10} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Left leg */}
                <Rect x={58} y={212} width={28} height={100} rx={14} fill="none" stroke="white" strokeWidth={1.5} />
                {/* Right leg */}
                <Rect x={94} y={212} width={28} height={100} rx={14} fill="none" stroke="white" strokeWidth={1.5} />
              </G>

              {/* Heat zones — tappable */}
              {(Object.keys(REGION_SHAPES) as BodyRegion[]).map((region) => {
                const shape = REGION_SHAPES[region];
                const stat = stats[region];
                const isActive = selected === region;
                const fill = stat
                  ? heatColor(stat.heat, primaryColor, 1)
                  : "rgba(255,255,255,0.04)";
                const stroke = isActive
                  ? "#FFFFFF"
                  : stat
                  ? heatColor(stat.heat, primaryColor, 0.7)
                  : "rgba(255,255,255,0.12)";

                return (
                  <Pressable
                    key={region}
                    onPress={() => setSelected(selected === region ? null : region)}
                  >
                    <Ellipse
                      cx={shape.cx}
                      cy={shape.cy}
                      rx={shape.rx}
                      ry={shape.ry}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isActive ? 2 : 1}
                      opacity={isActive ? 1 : 0.85}
                    />
                  </Pressable>
                );
              })}

              {/* Region emoji labels */}
              {(Object.keys(REGION_SHAPES) as BodyRegion[]).map((region) => {
                const shape = REGION_SHAPES[region];
                const stat = stats[region];
                if (!stat) return null;
                return (
                  <Circle
                    key={`dot-${region}`}
                    cx={shape.cx + shape.rx - 6}
                    cy={shape.cy - shape.ry + 6}
                    r={5}
                    fill={heatColor(stat.heat, primaryColor, 1)}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={1}
                  />
                );
              })}
            </Svg>
          </View>

          {/* Legend + tooltip panel */}
          <View style={{ flex: 1, paddingTop: 8 }}>

            {/* Tap hint */}
            {!selected && (
              <Animated.View entering={FadeIn.duration(400)}>
                <Text style={styles.tapHint}>Tap a zone to see details</Text>
              </Animated.View>
            )}

            {/* Selected region detail */}
            {selected && selectedStat && (
              <Animated.View entering={FadeIn.duration(300)} style={[styles.tooltip, { borderColor: heatColor(selectedStat.heat, primaryColor, 0.6) }]}>
                <Text style={styles.tooltipEmoji}>{BODY_REGION_EMOJIS[selected]}</Text>
                <Text style={styles.tooltipRegion}>{BODY_REGION_LABELS[selected]}</Text>
                <View style={styles.tooltipRow}>
                  <Text style={styles.tooltipLabel}>Sessions</Text>
                  <Text style={styles.tooltipValue}>{selectedStat.count}</Text>
                </View>
                <View style={styles.tooltipRow}>
                  <Text style={styles.tooltipLabel}>Avg intensity</Text>
                  <Text style={styles.tooltipValue}>{selectedStat.avgIntensity} / 5</Text>
                </View>
                {/* Intensity bar */}
                <View style={styles.intBarBg}>
                  <View style={[styles.intBarFill, {
                    width: `${(selectedStat.avgIntensity / 5) * 100}%` as any,
                    backgroundColor: heatColor(selectedStat.heat, primaryColor, 1),
                  }]} />
                </View>
                <Pressable onPress={() => setSelected(null)}>
                  <Text style={styles.clearBtn}>✕ Clear</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Region list — all active regions */}
            <View style={{ marginTop: selected ? 10 : 16 }}>
              {(Object.entries(stats) as [BodyRegion, RegionStat][])
                .sort((a, b) => b[1].count - a[1].count)
                .map(([region, stat]) => (
                  <Pressable
                    key={region}
                    onPress={() => setSelected(selected === region ? null : region)}
                    style={[styles.listRow, selected === region && { backgroundColor: "rgba(255,255,255,0.08)" }]}
                  >
                    <Text style={styles.listEmoji}>{BODY_REGION_EMOJIS[region]}</Text>
                    <Text style={styles.listLabel}>{BODY_REGION_LABELS[region]}</Text>
                    <View style={styles.listHeatDot}>
                      <View style={[styles.heatDot, { backgroundColor: heatColor(stat.heat, primaryColor, 1), transform: [{ scale: 0.6 + stat.heat * 0.6 }] }]} />
                    </View>
                    <Text style={styles.listCount}>{stat.count}×</Text>
                  </Pressable>
                ))}
            </View>

            {/* Heat scale legend */}
            <View style={styles.legend}>
              <Text style={styles.legendLabel}>Low</Text>
              <View style={styles.legendBar}>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((h, i) => (
                  <View key={i} style={[styles.legendSegment, { backgroundColor: heatColor(h, primaryColor, 1) }]} />
                ))}
              </View>
              <Text style={styles.legendLabel}>High</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.20)",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 24,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  emoji: { fontSize: 22 },
  title: { fontFamily: "Inter_700Bold", color: "#FFFFFF", fontSize: 15 },
  subtitle: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 10 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", fontSize: 13, textAlign: "center", lineHeight: 20 },
  tapHint: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.40)", fontSize: 11, textAlign: "center", marginBottom: 8, fontStyle: "italic" },
  tooltip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  tooltipEmoji: { fontSize: 22, textAlign: "center", marginBottom: 4 },
  tooltipRegion: { fontFamily: "Inter_700Bold", color: "#FFFFFF", fontSize: 14, textAlign: "center", marginBottom: 8 },
  tooltipRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tooltipLabel: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", fontSize: 11 },
  tooltipValue: { fontFamily: "Inter_600SemiBold", color: "#FFFFFF", fontSize: 11 },
  intBarBg: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 8, overflow: "hidden" },
  intBarFill: { height: "100%", borderRadius: 3 },
  clearBtn: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.40)", fontSize: 10, textAlign: "center", marginTop: 4 },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8, gap: 6, marginBottom: 2 },
  listEmoji: { fontSize: 13, width: 18, textAlign: "center" },
  listLabel: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.75)", fontSize: 11, flex: 1 },
  listHeatDot: { width: 16, alignItems: "center" },
  heatDot: { width: 10, height: 10, borderRadius: 5 },
  listCount: { fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.55)", fontSize: 10, width: 22, textAlign: "right" },
  legend: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 6 },
  legendLabel: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)", fontSize: 9 },
  legendBar: { flex: 1, flexDirection: "row", height: 5, borderRadius: 3, overflow: "hidden", gap: 1 },
  legendSegment: { flex: 1, height: "100%" },
});
