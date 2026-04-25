/**
 * Plain-language emotion definitions for alexithymia support.
 * Each definition helps users who struggle to identify or name their emotions.
 */

import { EmotionType } from './types';

export interface EmotionDefinition {
  emotion: EmotionType;
  emoji: string;
  plainLanguage: string; // What it feels like in everyday words
  bodySignals: string[]; // Common physical sensations
  likeThis: string[]; // "You might feel this when..."
  opposite: EmotionType;
}

export const EMOTION_DEFINITIONS: Record<EmotionType, EmotionDefinition> = {
  happiness: {
    emotion: 'happiness',
    emoji: '😊',
    plainLanguage: 'A sense that things are good. Your body feels light, your breath comes easy. You might want to smile or move.',
    bodySignals: ['warmth in chest', 'lightness', 'energy in limbs', 'relaxed shoulders'],
    likeThis: ['something went better than expected', 'you feel connected to someone', 'you accomplished something'],
    opposite: 'sadness',
  },
  sadness: {
    emotion: 'sadness',
    emoji: '😢',
    plainLanguage: 'A heaviness when something matters. Your body slows down. You might want to withdraw or rest. This is your heart processing something important.',
    bodySignals: ['heavy limbs', 'tiredness', 'tight chest', 'tears'],
    likeThis: ['you lost something or someone', 'things did not go as hoped', 'you feel alone'],
    opposite: 'happiness',
  },
  anger: {
    emotion: 'anger',
    emoji: '😤',
    plainLanguage: 'A surge of energy when a boundary is crossed or something feels unfair. Your body prepares to act. Heat rises. This signal is trying to protect you.',
    bodySignals: ['heat in face', 'tense jaw', 'racing heart', 'tight fists'],
    likeThis: ['something feels unfair', 'a boundary was crossed', 'you were blocked from something important'],
    opposite: 'fear',
  },
  disgust: {
    emotion: 'disgust',
    emoji: '🤢',
    plainLanguage: 'A recoiling from something that does not sit right. Your body wants to push away. This often reveals what you truly value.',
    bodySignals: ['stomach discomfort', 'nausea', 'tension in throat', 'coldness'],
    likeThis: ['something violates your values', 'you encounter something you find wrong', 'a situation feels "off"'],
    opposite: 'trust',
  },
  fear: {
    emotion: 'fear',
    emoji: '😰',
    plainLanguage: 'A sense that something might go wrong. Your body goes on alert. Breath quickens. This is protection, not weakness — it is trying to keep you safe.',
    bodySignals: ['racing heart', 'shallow breathing', 'tight stomach', 'cold hands'],
    likeThis: ['facing the unknown', 'something important feels at risk', 'you sense danger'],
    opposite: 'anger',
  },
  surprise: {
    emotion: 'surprise',
    emoji: '😮',
    plainLanguage: 'A sudden jolt when something unexpected happens. Your body freezes for a moment, then reorients. It can become positive or negative after the first shock.',
    bodySignals: ['widened eyes', 'sharp inhale', 'tingling', 'frozen posture'],
    likeThis: ['something happened suddenly', 'your expectations were broken', 'new information arrived'],
    opposite: 'anticipation',
  },
  trust: {
    emotion: 'trust',
    emoji: '🤝',
    plainLanguage: 'A sense of safety and connection. Your body relaxes. You feel you can let your guard down. This is the feeling of being with someone who has your back.',
    bodySignals: ['relaxed shoulders', 'slow steady breath', 'warmth', 'open posture'],
    likeThis: ['someone showed up for you', 'you feel safe', 'you can rely on something or someone'],
    opposite: 'disgust',
  },
  anticipation: {
    emotion: 'anticipation',
    emoji: '🤩',
    plainLanguage: 'A forward-leaning energy when something good might be coming. Your body readies itself. It is excitement mixed with uncertainty.',
    bodySignals: ['restlessness', 'butterflies in stomach', 'alertness', 'energy'],
    likeThis: ['something good might happen', 'you are waiting for news', 'a goal is within reach'],
    opposite: 'surprise',
  },
};

export function getEmotionDefinition(emotion: EmotionType): EmotionDefinition {
  return EMOTION_DEFINITIONS[emotion];
}
