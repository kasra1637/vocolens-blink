import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { JournalEntry, EmotionType } from '@/lib/types';
import { EMOTION_EMOJIS } from '@/lib/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_SIZE = SCREEN_W - 64;

interface Props {
  entries: JournalEntry[];
  days?: number;
}

// Approximate V-A coordinates for each Plutchik emotion (Circumplex Model)
const EMOTION_VA: Record<EmotionType, { v: number; a: number }> = {
  happiness:    { v:  75, a: 55 },
  trust:        { v:  60, a: 25 },
  fear:         { v: -65, a: 75 },
  surprise:     { v:  20, a: 80 },
  sadness:      { v: -70, a: 20 },
  disgust:      { v: -60, a: 40 },
  anger:        { v: -55, a: 85 },
  anticipation: { v:  50, a: 70 },
};

export default function ValenceArousalChart({ entries, days = 30 }: Props) {
  const recentEntries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter((e) => new Date(e.createdAt) >= cutoff && e.valence !== undefined && e.arousal !== undefined);
  }, [entries, days]);

  const points = useMemo(() => {
    return recentEntries.map((entry) => ({
      x: ((entry.valence + 100) / 200) * CHART_SIZE,
      y: CHART_SIZE - ((entry.arousal / 100) * CHART_SIZE),
      valence: entry.valence,
      arousal: entry.arousal,
      emotion: entry.primaryEmotion,
      emoji: EMOTION_EMOJIS[entry.primaryEmotion],
    }));
  }, [recentEntries]);

  const quadrantCounts = useMemo(() => {
    let pleasantActivated = 0;
    let pleasantCalm = 0;
    let unpleasantActivated = 0;
    let unpleasantCalm = 0;
    points.forEach((p) => {
      if (p.valence >= 0 && p.arousal >= 50) pleasantActivated++;
      else if (p.valence >= 0 && p.arousal < 50) pleasantCalm++;
      else if (p.valence < 0 && p.arousal >= 50) unpleasantActivated++;
      else unpleasantCalm++;
    });
    return { pleasantActivated, pleasantCalm, unpleasantActivated, unpleasantCalm };
  }, [points]);

  const dominantQuadrant = useMemo(() => {
    const max = Math.max(quadrantCounts.pleasantActivated, quadrantCounts.pleasantCalm, quadrantCounts.unpleasantActivated, quadrantCounts.unpleasantCalm);
    if (max === 0) return null;
    if (quadrantCounts.pleasantActivated === max) return { label: 'Activated & Pleasant', desc: 'High-energy positive states like joy and excitement', color: '#F59E0B' };
    if (quadrantCounts.pleasantCalm === max) return { label: 'Calm & Pleasant', desc: 'Peaceful contentment and relaxed happiness', color: '#10B981' };
    if (quadrantCounts.unpleasantActivated === max) return { label: 'Activated & Unpleasant', desc: 'High-energy stress, anger, or anxiety', color: '#EF4444' };
    return { label: 'Calm & Unpleasant', desc: 'Low-energy sadness, fatigue, or withdrawal', color: '#6B7280' };
  }, [quadrantCounts]);

  if (points.length === 0) {
    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
          Record a few entries to see your emotional landscape
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>Emotional Landscape</Text>
      <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
        Where your emotions fall on the pleasant/unpleasant × calm/activated grid
      </Text>

      {/* Chart */}
      <View style={{ width: CHART_SIZE, height: CHART_SIZE, alignSelf: 'center' }}>
        {/* Quadrant backgrounds */}
        <View style={{ position: 'absolute', top: 0, left: CHART_SIZE / 2, width: CHART_SIZE / 2, height: CHART_SIZE / 2, backgroundColor: '#FEF3C7', opacity: 0.4, borderTopRightRadius: 12 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, width: CHART_SIZE / 2, height: CHART_SIZE / 2, backgroundColor: '#FEE2E2', opacity: 0.4, borderTopLeftRadius: 12 }} />
        <View style={{ position: 'absolute', top: CHART_SIZE / 2, left: 0, width: CHART_SIZE / 2, height: CHART_SIZE / 2, backgroundColor: '#F3F4F6', opacity: 0.4, borderBottomLeftRadius: 12 }} />
        <View style={{ position: 'absolute', top: CHART_SIZE / 2, left: CHART_SIZE / 2, width: CHART_SIZE / 2, height: CHART_SIZE / 2, backgroundColor: '#D1FAE5', opacity: 0.4, borderBottomRightRadius: 12 }} />

        {/* Axes */}
        <View style={{ position: 'absolute', left: CHART_SIZE / 2, top: 0, bottom: 0, width: 1, backgroundColor: '#D1D5DB' }} />
        <View style={{ position: 'absolute', top: CHART_SIZE / 2, left: 0, right: 0, height: 1, backgroundColor: '#D1D5DB' }} />

        {/* Axis labels */}
        <Text style={{ position: 'absolute', top: 4, left: CHART_SIZE / 2 + 6, fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>Activated</Text>
        <Text style={{ position: 'absolute', bottom: 4, left: CHART_SIZE / 2 + 6, fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>Calm</Text>
        <Text style={{ position: 'absolute', top: CHART_SIZE / 2 + 6, right: 4, fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>Pleasant</Text>
        <Text style={{ position: 'absolute', top: CHART_SIZE / 2 + 6, left: 4, fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>Unpleasant</Text>

        {/* Data points */}
        {points.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 10,
              top: p.y - 10,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#7C3AED',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 10 }}>{p.emoji}</Text>
          </View>
        ))}
      </View>

      {/* Dominant quadrant summary */}
      {dominantQuadrant && (
        <View style={{ marginTop: 16, backgroundColor: dominantQuadrant.color + '15', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: dominantQuadrant.color }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: dominantQuadrant.color }}>{dominantQuadrant.label}</Text>
          <Text style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>{dominantQuadrant.desc}</Text>
        </View>
      )}
    </View>
  );
}
