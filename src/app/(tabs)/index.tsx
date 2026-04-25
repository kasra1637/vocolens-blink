import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Comfortaa_400Regular,
  Comfortaa_500Medium,
  Comfortaa_600SemiBold,
  Comfortaa_700Bold,
} from '@expo-google-fonts/comfortaa';
import { Pause, Check, ChevronDown, RefreshCw, Sparkles, Settings, AlertCircle, Radio } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  FadeOut,
  interpolateColor,
} from 'react-native-reanimated';
import { heavyHaptic, tapHaptic, errorHaptic, successHaptic, warningHaptic } from '@/lib/haptics';
import { router } from 'expo-router';
import { getThemeColors, getThemeGradients, getThemeShadows, BorderRadius, Spacing } from '@/lib/theme';
import { useCreateEntry } from '@/lib/hooks';
import { useRealtimeVoiceRecording } from '@/lib/hooks/useRealtimeVoiceRecording';
import { MicTabIcon } from '@/components/TabIcons';
import { RecordFab } from '@/components/RecordFab';
import { TopicCategory, EmotionType } from '@/lib/types';
import EmotionReflectionScreen from '@/components/emotion-reflection';
import type { ReflectionResult } from '@/components/emotion-reflection';
import GroundingToolsModal from '@/components/GroundingToolsModal';
import { analyzeTranscript } from '@/lib/journal-service';
import useOnboardingStore from '@/lib/state/onboarding-store';
import useSettingsStore from '@/lib/state/settings-store';
import { useUsageMinutes, useRemainingMinutes, useIsAtLimit, USAGE_LIMIT_MINUTES } from '@/lib/state/user-stats-store';

// ...rest of imports, state, hooks, and inner functions remain the same ...

// Inside the main return, REPLACE THE "Idle — single mic button with pulse" part:
// (Search for the <Pressable> main button in idle state and delete it; put this instead)

// ...
981|             /* Idle — single mic button with pulse */
982|             <>
983|               <RecordFab
984|                 onPress={handleMicPress}
985|                 disabled={isProcessing || isAtLimit}
986|               />
987|               <Text
988|                 style={{ fontFamily: 'Comfortaa_400Regular', color: isAtLimit ? 'rgba(255,120,120,0.9)' : '#FFFFFF' }}
989|                 className="text-xs mt-2"
990|               >
991|                 {isProcessing ? 'Please wait...' : isAtLimit ? 'Monthly limit reached' : `Tap to start · ${Math.floor(remainingMinutes)} min left`}
992|               </Text>
993|             </>

// The rest of the file is unchanged.
