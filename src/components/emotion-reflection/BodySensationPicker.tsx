import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BodySensation } from '@/lib/types';
import { tapHaptic } from '@/lib/haptics';

const OPTIONS: { value: BodySensation; label: string; emoji: string }[] = [
  { value: 'chest tightness', label: 'Chest tightness', emoji: '💓' },
  { value: 'knot in stomach', label: 'Knot in stomach', emoji: '🪢' },
  { value: 'racing heart', label: 'Racing heart', emoji: '💗' },
  { value: 'heavy limbs', label: 'Heavy limbs', emoji: '🪨' },
  { value: 'tension in shoulders', label: 'Tense shoulders', emoji: '🙍' },
  { value: 'lightness', label: 'Lightness', emoji: '☁️' },
  { value: 'warmth', label: 'Warmth', emoji: '🔥' },
  { value: 'coldness', label: 'Coldness', emoji: '🧊' },
  { value: 'tingling', label: 'Tingling', emoji: '⚡' },
  { value: 'numbness', label: 'Numbness', emoji: '😶' },
  { value: 'restlessness', label: 'Restlessness', emoji: '🐜' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'head pressure', label: 'Head pressure', emoji: '🤯' },
  { value: 'throat constriction', label: 'Tight throat', emoji: '😖' },
  { value: 'breathlessness', label: 'Breathlessness', emoji: '😮‍💨' },
  { value: 'none', label: 'None of these', emoji: '✋' },
];

export default function BodySensationPicker({
  selected,
  onChange,
  suggestedSensations,
}: {
  selected?: BodySensation;
  onChange: (value: BodySensation | undefined) => void;
  suggestedSensations: string[];
}) {
  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 }}>
        Where do you feel this in your body?
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              tapHaptic();
              onChange(selected === option.value ? undefined : option.value);
            }}
            style={{
              backgroundColor: selected === option.value ? '#EDE9FE' : '#FFFFFF',
              borderWidth: 1,
              borderColor: selected === option.value ? '#7C3AED' : '#E5E7EB',
              borderRadius: 24,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 6 }}>{option.emoji}</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: selected === option.value ? '#7C3AED' : '#374151' }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {suggestedSensations.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Suggested based on your entry</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {suggestedSensations.map((sensation, i) => (
              <View key={i} style={{ backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{sensation}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
