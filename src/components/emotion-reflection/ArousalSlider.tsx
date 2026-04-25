import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function arousalLabel(arousal: number): string {
  if (arousal >= 80) return 'Very activated';
  if (arousal >= 55) return 'Activated';
  if (arousal >= 35) return 'Neutral';
  if (arousal >= 15) return 'Calm';
  return 'Very calm';
}

export default function ArousalSlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const trackWidth = SCREEN_WIDTH - 64;
  const position = useSharedValue((value / 100) * trackWidth);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newPos = Math.max(0, Math.min(trackWidth, e.absoluteX - 32));
      position.value = newPos;
      const val = Math.round((newPos / trackWidth) * 100);
      onChange(val);
    })
    .onEnd(() => {
      position.value = withSpring(position.value);
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: position.value }));

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Calm</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Activated</Text>
      </View>
      <GestureDetector gesture={panGesture}>
        <View style={{ height: 40, justifyContent: 'center' }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
            <Animated.View style={[{ height: '100%', backgroundColor: '#F59E0B', opacity: 0.7 }, fillStyle]} />
          </View>
          <Animated.View
            style={[
              {
                position: 'absolute', left: -12, width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#F59E0B',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
      <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 8 }}>
        {arousalLabel(value)}
      </Text>
    </View>
  );
}
