import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function valenceLabel(valence: number): string {
  if (valence >= 60) return 'Very pleasant';
  if (valence >= 20) return 'Pleasant';
  if (valence >= -20) return 'Neutral';
  if (valence >= -60) return 'Unpleasant';
  return 'Very unpleasant';
}

export default function ValenceSlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const trackWidth = SCREEN_WIDTH - 64;
  const position = useSharedValue(((value + 100) / 200) * trackWidth);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newPos = Math.max(0, Math.min(trackWidth, e.absoluteX - 32));
      position.value = newPos;
      const val = Math.round((newPos / trackWidth) * 200 - 100);
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
        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Unpleasant</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Pleasant</Text>
      </View>
      <GestureDetector gesture={panGesture}>
        <View style={{ height: 40, justifyContent: 'center' }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
            <Animated.View style={[{ height: '100%', backgroundColor: value >= 0 ? '#10B981' : '#EF4444', opacity: 0.7 }, fillStyle]} />
          </View>
          <Animated.View
            style={[
              {
                position: 'absolute', left: -12, width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: value >= 0 ? '#10B981' : '#EF4444',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
      <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 8 }}>
        {valenceLabel(value)}
      </Text>
    </View>
  );
}
