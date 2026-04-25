import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { EmotionDefinition } from '@/lib/emotion-definitions';

export default function EmotionDefinitionCard({ definition, onClose }: { definition: EmotionDefinition; onClose: () => void }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, marginRight: 10 }}>{definition.emoji}</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', textTransform: 'capitalize' }}>
            {definition.emotion}
          </Text>
        </View>
        <Pressable onPress={onClose} style={{ padding: 4 }}>
          <X size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      <Text style={{ fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 16 }}>
        {definition.plainLanguage}
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
          You might feel this in your body:
        </Text>
        {definition.bodySignals.map((signal, i) => (
          <Text key={i} style={{ fontSize: 14, color: '#4B5563', marginBottom: 3 }}>• {signal}</Text>
        ))}
      </View>

      <View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
          This might show up when:
        </Text>
        {definition.likeThis.map((example, i) => (
          <Text key={i} style={{ fontSize: 14, color: '#4B5563', marginBottom: 3 }}>• {example}</Text>
        ))}
      </View>
    </View>
  );
}
