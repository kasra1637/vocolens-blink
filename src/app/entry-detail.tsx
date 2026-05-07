import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Edit3,
  Save,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  MessageSquare,
  Lightbulb,
  Target,
  Play,
  Square,
  Volume2,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Heart,
  AlertTriangle,
  Wind,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import {
  tapHaptic,
  selectHaptic,
  successHaptic,
  confirmHaptic,
} from "@/lib/haptics";
import * as Speech from "expo-speech";
import {
  getThemeColors,
  getThemeGradients,
  getThemeShadows,
} from "@/lib/theme";
import useJournalStore from "@/lib/state/journal-store";
import useOnboardingStore from "@/lib/state/onboarding-store";
import useSettingsStore from "@/lib/state/settings-store";
import { useDeleteEntry } from "@/lib/hooks";
import { hexToRgba, GlassLayers } from "@/lib/glass";
import {
  formatShortDuration,
  EMOTION_COLORS,
  EmotionType,
  EmotionScores,
  getEmotionSubLabel,
  BODY_REGION_EMOJIS,
} from "@/lib/types";
import { AudioPlayer } from "@/components/AudioPlayer";
import EmotionCorrectionModal from "@/components/EmotionCorrectionModal";
import { useEmotionCorrectionStore } from "@/lib/state/emotion-correction-store";
import { queryKeys } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import EmotionBreakdownCard from "@/components/EmotionBreakdownCard";
import { RankedEmotion, BlendedEmotionType } from "@/lib/types";

const ALL_EMOTIONS: EmotionType[] = [
  "happiness",
  "trust",
  "anticipation",
  "surprise",
  "fear",
  "sadness",
  "disgust",
  "anger",
];