import React, { useState, useCallback, useMemo, useEffect } from "react";
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

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { getThemeColors } = require("@/lib/theme");
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const Colors = getThemeColors(isDarkMode ? "dark" : "light");

  const getEntry = useJournalStore((s) => s.getEntry);
  const updateEntryTitle = useJournalStore((s) => s.updateEntryTitle);
  const updateEntryTranscript = useJournalStore((s) => s.updateEntryTranscript);
  
  const setCorrectionData = useEmotionCorrectionStore((s) => s.setCorrectionData);
  const clearCorrectionData = useEmotionCorrectionStore((s) => s.clearCorrectionData);
  const queryClient = useQueryClient();

  const entry = getEntry(id ?? "");
  const { handleDelete, isDeleting } = useDeleteEntry(entry?.id ?? "");

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Collapsible sections
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isEmotionsOpen, setIsEmotionsOpen] = useState(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  useEffect(() => {
    if (entry) {
      setEditedTitle(entry.title || "");
      setEditedTranscript(entry.transcript || "");
    }
  }, [entry]);

  const [contentHeight, setContentHeight] = useState(0);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_400Regular", color: Colors.text, fontSize: 16 }}>Entry not found</Text>
        <Pressable style={{ marginTop: 16, padding: 12 }} onPress={() => router.back()}>
          <Text style={{ fontFamily: "Inter_600SemiBold", color: Colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSection = (section: "emotions" | "analysis" | "reflection" | "transcript") => {
    tapHaptic();
    if (section === "emotions") setIsEmotionsOpen(!isEmotionsOpen);
    if (section === "analysis") setIsAnalysisOpen(!isAnalysisOpen);
    if (section === "reflection") setIsReflectionOpen(!isReflectionOpen);
    if (section === "transcript") setIsTranscriptOpen(!isTranscriptOpen);
  };

  const handleSave = () => {
    if (entry) {
      updateEntryTitle(entry.id, editedTitle || "Untitled Entry");
      updateEntryTranscript(entry.id, editedTranscript);
      setIsEditing(false);
      successHaptic();
    }
  };

  const handleEditStart = () => {
    setEditedTitle(entry.title);
    setEditedTranscript(entry.transcript);
    setIsEditing(true);
    tapHaptic();
  };

  // ─── Handle Emotion Correction ──────────────────────────────────────
  const handleCorrectEmotions = () => {
    setCorrectionData(entry);
    setShowCorrectionModal(true);
    selectHaptic();
  };

  const handleCorrectionCancel = () => {
    clearCorrectionData();
    setShowCorrectionModal(false);
  };

  const handleCorrectionComplete = () => {
    setShowCorrectionModal(false);
    clearCorrectionData();
    // Refresh the entry from store
    queryClient.invalidateQueries({ queryKey: queryKeys.entry(id!) });
  };

  const handleShare = () => {
    tapHaptic();
    Alert.alert("Share", "Sharing functionality coming soon!");
  };

  const tintColor = Colors.primary;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#000" }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => {
          setContentHeight(h);
        }}
      >
        <View style={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "#000",
              paddingTop: insets.top + 8,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.05)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
              <Pressable
                style={{ padding: 8, marginRight: 8 }}
                onPress={() => {
                  tapHaptic();
                  router.back();
                }}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </Pressable>
              <View style={{ flex: 1, flexDirection: "row", justifyContent: "center" }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "Inter_700Bold",
                    color: "#FFFFFF",
                    fontSize: 17,
                    maxWidth: 200,
                    textAlign: "center",
                  }}
                >
                  Entry Detail
                </Text>
              </View>
              {isEditing ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    style={{ padding: 8 }}
                    onPress={() => {
                      tapHaptic();
                      setIsEditing(false);
                      setEditedTitle(entry.title);
                      setEditedTranscript(entry.transcript);
                    }}
                  >
                    <Text style={{ fontFamily: "Inter_600SemiBold", color: "#FFFFFF" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{ padding: 8 }}
                    onPress={handleSave}
                  >
                    <Text style={{ fontFamily: "Inter_700Bold", color: tintColor }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(entry?.audioUri?.length || 0) > 0 && (
                    <Pressable
                      style={{ padding: 8 }}
                      onPress={handleShare}
                    >
                      <Share2 size={22} color="#FFFFFF" />
                    </Pressable>
                  )}
                  <Pressable
                    style={{ padding: 8 }}
                    onPress={handleEditStart}
                  >
                    <Edit3 size={22} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={{ padding: 8 }} onPress={handleDelete} disabled={isDeleting}>
                    <Trash2 size={22} color="#FF6B6B" opacity={isDeleting ? 0.5 : 1} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Main content */}
          <View style={{ padding: 16, gap: 12 }}>
            {/* Title */}
            <View className="mb-4">
              {isEditing ? (
                <TextInput
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  style={{
                    fontFamily: "Inter_700Bold",
                    color: "#FFFFFF",
                    fontSize: 24,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 56,
                  }}
                  placeholder="Entry Title"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="sentences"
                  multiline
                  autoFocus
                />
              ) : (
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    color: "#FFFFFF",
                    fontSize: 24,
                  }}
                >
                  {entry.title}
                </Text>
              )}
            </View>

            {/* Date, Time, Duration */}
            <View className="flex-row items-center gap-6 mb-6">
              <View className="flex-row items-center">
                <Calendar size={16} color="rgba(255, 255, 255, 0.8)" strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                  className="text-sm ml-2"
                >
                  {formatDate(entry.createdAt)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock
                  size={16}
                  color="rgba(255, 255, 255, 0.8)"
                  strokeWidth={2}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                  className="text-sm ml-2"
                >
                  {formatTime(entry.createdAt)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock
                  size={16}
                  color="rgba(255, 255, 255, 0.8)"
                  strokeWidth={2}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                  className="text-sm ml-2"
                >
                  {formatShortDuration(entry.duration)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Activity
                  size={16}
                  color="rgba(255, 255, 255, 0.8)"
                  strokeWidth={2}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                  className="text-sm ml-2"
                >
                  {entry.emotionIntensity}%
                </Text>
              </View>
            </View>

            {/* Primary Emotion Badge */}
            {entry.emotions.length > 0 && (
              <View
                className="rounded-full px-4 py-2 mb-6"
                style={{ backgroundColor: hexToRgba(EMOTION_COLORS[entry.primaryEmotion] || Colors.primary, 0.15) }}
              >
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 16, marginRight: 8 }}>
                    {entry.primaryEmotion === "happiness" && "😊"}
                    {entry.primaryEmotion === "sadness" && "😢"}
                    {entry.primaryEmotion === "anger" && "😠"}
                    {entry.primaryEmotion === "disgust" && "🤢"}
                    {entry.primaryEmotion === "fear" && "😨"}
                    {entry.primaryEmotion === "surprise" && "😲"}
                    {entry.primaryEmotion === "trust" && "🤝"}
                    {entry.primaryEmotion === "anticipation" && "🔮"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      color: EMOTION_COLORS[entry.primaryEmotion] || Colors.primary,
                      fontSize: 16,
                      textTransform: "capitalize",
                    }}
                  >
                    {entry.primaryEmotion} · {entry.emotionIntensity}% intensity
                  </Text>
                </View>
              </View>
            )}

            {/* AI Reflection (TTS) - shown when available from OpenRouter */}
            {entry.aiReflection && entry.aiReflection.trim().length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(100).duration(450)}
                className="mb-6"
              >
                <View
                  className="rounded-3xl p-5"
                  style={{ backgroundColor: "rgba(124, 58, 237, 0.15)", borderWidth: 1.5, borderColor: "rgba(124, 58, 237, 0.25)" }}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center">
                      <Volume2 size={18} color="#A855F7" />
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          color: "#E9D5FF",
                          fontSize: 14,
                          marginLeft: 8,
                        }}
                      >
                        AI Reflection
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      color: "rgba(243, 232, 255, 0.95)",
                      fontSize: 15,
                      lineHeight: 22,
                    }}
                  >
                    {entry.aiReflection}
                  </Text>
                  <Pressable
                    className="mt-3 px-4 py-2.5 rounded-xl"
                    style={{ backgroundColor: "rgba(139, 92, 246, 0.25)" }}
                    onPress={() => Speech.speak(entry.aiReflection!, { language: "en", pitch: 1.0, rate: 0.95 })}
                  >
                    <Text style={{ fontFamily: "Inter_600SemiBold", color: "#D8B4E8", textAlign: "center" }}>
                      Listen
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* Conversation Prompt */}
            {entry.conversationPrompt && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(450)}
                className="mb-6"
              >
                <View
                  className="rounded-3xl p-5 overflow-hidden"
                  style={{
                    backgroundColor: hexToRgba(Colors.secondary, 0.15),
                    borderWidth: 1.5,
                    borderColor: hexToRgba(Colors.secondary, 0.25),
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Lightbulb size={18} color={Colors.secondary} />
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        color: Colors.text,
                        fontSize: 14,
                        marginLeft: 8,
                      }}
                    >
                      Conversation Starter
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      color: Colors.textSecondary,
                      fontSize: 15,
                      lineHeight: 22,
                    }}
                  >
                    {entry.conversationPrompt}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Transcript */}
            <Animated.View entering={FadeInDown.delay(300).duration(450)}>
              <Pressable
                onPress={() => toggleSection("transcript")}
                className="rounded-3xl overflow-hidden mb-6"
              >
                <View className="p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <MessageSquare size={18} color="#FFFFFF" />
                      <Text
                        style={{ fontFamily: "Inter_600SemiBold", color: "#FFFFFF", marginLeft: 8 }}
                      >
                        Transcript
                      </Text>
                    </View>
                    {isTranscriptOpen ? (
                      <ChevronUp size={20} color="#FFFFFF" />
                    ) : (
                      <ChevronDown size={20} color="#FFFFFF" />
                    )}
                  </View>
                  {isTranscriptOpen && (
                    <View className="mt-4">
                      {isEditing ? (
                        <TextInput
                          value={editedTranscript}
                          onChangeText={setEditedTranscript}
                          style={{
                            fontFamily: "Inter_400Regular",
                            color: "#FFFFFF",
                            fontSize: 15,
                            lineHeight: 22,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: 8,
                            padding: 10,
                            minHeight: 100,
                            maxHeight: 300,
                          }}
                          multiline
                          autoCapitalize="sentences"
                        />
                      ) : (
                        <Text
                          style={{
                            fontFamily: "Inter_400Regular",
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 15,
                            lineHeight: 22,
                          }}
                        >
                          {entry.transcript}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>

            {/* Audio Playback */}
            {entry.audioUri && entry.audioUri.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(450)}
                className="mb-6"
              >
                <AudioPlayer audioUri={entry.audioUri || ""} />
              </Animated.View>
            )}

            {/* AI Emotion Detection (Plutchik) */}
            {(entry.aiTopThreeEmotions && entry.aiTopThreeEmotions.length > 0) && (
              <Animated.View entering={FadeInDown.delay(450).duration(450)} className="mb-6">
                <View
                  className="rounded-3xl overflow-hidden"
                  style={{
                    shadowColor: tintColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 20,
                    elevation: 4,
                  }}
                >
                  <GlassLayers
                    primaryColor={Colors.primary}
                    tintColor={tintColor}
                    borderRadius={20}
                  />
                  <EmotionBreakdownCard
                    topThreeEmotions={entry.aiTopThreeEmotions ?? []}
                    blendedEmotions={(entry.aiBlendedEmotions ?? {}) as Partial<Record<BlendedEmotionType, number>>}
                    ambivalenceFlags={(entry.aiAmbivalenceFlags ?? [])}
                  />
                </View>
              </Animated.View>
            )}

            {/* Your Reflection Card — valence/arousal, body sensation, grounding */}
            {(entry.valence !== undefined ||
              entry.arousal !== undefined ||
              entry.bodySensation ||
              entry.groundingUsed) && (
              <Animated.View entering={FadeInDown.delay(600).duration(450)}>
                <View
                  className="rounded-3xl overflow-hidden mb-6"
                  style={{
                    overflow: "hidden",
                    shadowColor: tintColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 20,
                    elevation: 4,
                  }}
                >
                  <GlassLayers 
                    primaryColor={Colors.primary} 
                    tintColor={tintColor}
                    borderRadius={20} 
                  />
                  <View className="p-5">
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <Heart size={18} color="#FFFFFF" strokeWidth={2} />
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            color: "#FFFFFF",
                          }}
                          className="text-base ml-2"
                        >
                          Your Reflection
                        </Text>
                      </View>
                      {/* User validation chip */}
                      {entry.userValidated ? (
                        <View
                          className="flex-row items-center px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "rgba(34, 197, 94, 0.25)" }}
                        >
                          <CheckCircle2 size={12} color="#22C55E" strokeWidth={2} />
                          <Text
                            style={{
                              fontFamily: "Inter_600SemiBold",
                              color: "#22C55E",
                              fontSize: 10,
                              marginLeft: 4,
                            }}
                          >
                            Confirmed
                          </Text>
                        </View>
                      ) : entry.aiCorrected ? (
                        <View
                          className="flex-row items-center px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "rgba(234, 179, 8, 0.25)" }}
                        >
                          <RefreshCw size={12} color="#EAB308" strokeWidth={2} />
                          <Text
                            style={{
                              fontFamily: "Inter_600SemiBold",
                              color: "#EAB308",
                              fontSize: 10,
                              marginLeft: 4,
                            }}
                          >
                            Adjusted
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Valence & Arousal Bars */}
                    {(entry.valence !== undefined ||
                      entry.arousal !== undefined) && (
                      <View style={{ gap: 12, marginBottom: 16 }}>
                        {/* Valence */}
                        {entry.valence !== undefined && (
                          <View>
                            <View className="flex-row items-center justify-between mb-1.5">
                              <Text
                                style={{
                                  fontFamily: "Inter_500Medium",
                                  color: "rgba(255, 255, 255, 0.8)",
                                  fontSize: 12,
                                }}
                              >
                                Valence
                              </Text>
                              <Text
                                style={{
                                  fontFamily: "Inter_600SemiBold",
                                  color: "#FFFFFF",
                                  fontSize: 12,
                                }}
                              >
                                {(entry.valence + 100).toFixed(0)}%
                              </Text>
                            </View>
                            <View
                              className="w-full rounded-full overflow-hidden"
                              style={{ height: 6, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            >
                              <View
                                className="rounded-full"
                                style={{
                                  height: 6,
                                  width: `${(entry.valence + 100) / 2}%`,
                                  backgroundColor:
                                    Math.round(entry.valence) >= 0 ? "#22C55E" : "#EF4444",
                                }}
                              />
                            </View>
                          </View>
                        )}

                        {/* Arousal */}
                        {entry.arousal !== undefined && (
                          <View>
                            <View className="flex-row items-center justify-between mb-1.5">
                              <Text
                                style={{
                                  fontFamily: "Inter_500Medium",
                                  color: "rgba(255, 255, 255, 0.8)",
                                  fontSize: 12,
                                }}
                              >
                                Arousal
                              </Text>
                              <Text
                                style={{
                                  fontFamily: "Inter_600SemiBold",
                                  color: "#FFFFFF",
                                  fontSize: 12,
                                }}
                              >
                                {entry.arousal.toFixed(0)}%
                              </Text>
                            </View>
                            <View
                              className="w-full rounded-full overflow-hidden"
                              style={{ height: 6, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            >
                              <View
                                className="rounded-full"
                                style={{
                                  height: 6,
                                  width: `${entry.arousal}%`,
                                  backgroundColor: "#A855F7",
                                }}
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Body Sensation */}
                    {entry.bodySensation && (
                      <View className="mb-4">
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: 12,
                            marginBottom: 6,
                          }}
                        >
                          Body Sensation
                        </Text>
                        <View
                          className="px-3 py-2.5 rounded-xl"
                          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                        >
                          <Text
                            style={{
                              fontFamily: "Inter_400Regular",
                              color: "#FFFFFF",
                              fontSize: 14,
                            }}
                          >
                            {entry.bodySensation}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Body Region Map */}
                     {entry.bodyRegions && entry.bodyRegions.length > 0 && (
                      <View className="mb-4">
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: 12,
                            marginBottom: 8,
                          }}
                        >
                          Body Map
                        </Text>
                        <View className="flex-wrap flex-row gap-2">
                          {entry.bodyRegions
                            .sort((a, b) => b.intensity - a.intensity)
                            .map((region) => (
                              <View
                                key={region.region}
                                className="flex-row items-center px-3 py-1.5 rounded-lg"
                                style={{
                                  backgroundColor:
                                    region.intensity > 0.7
                                      ? "rgba(239, 68, 68, 0.25)"
                                      : region.intensity > 0.4
                                      ? "rgba(245, 158, 11, 0.2)"
                                      : "rgba(255, 255, 255, 0.05)",
                                }}
                              >
                                <Text style={{ marginRight: 4 }}>
                                  {BODY_REGION_EMOJIS[region.region] || "❓"}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: "Inter_400Regular",
                                    color:
                                      region.intensity > 0.7
                                        ? "#FCA5A5"
                                        : region.intensity > 0.4
                                        ? "#FCD34D"
                                        : "rgba(255, 255, 255, 0.8)",
                                    fontSize: 13,
                                  }}
                                >
                                  {region.region}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Grounding Used Badge */}
                    {entry.groundingUsed && (
                      <View className="flex-row items-center px-3 py-1.5 rounded-full bg-cyan-400/20">
                        <Wind size={14} color="#22D3EE" />
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            color: "#22D3EE",
                            fontSize: 12,
                            marginLeft: 4,
                          }}
                        >
                          Grounding exercise completed
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* AI Analysis */}
            {entry.aiAnalysis && (
              <Animated.View
                entering={FadeInDown.delay(500).duration(450)}
                className="mb-6"
              >
                <Pressable
                  onPress={() => toggleSection("analysis")}
                  className="rounded-3xl overflow-hidden"
                >
                  <GlassLayers 
                    primaryColor={Colors.primary} 
                    tintColor={tintColor} 
                    borderRadius={20} 
                  />
                  <View className="p-5">
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <Lightbulb size={18} color="#FBBF24" />
                        <Text
                          style={{ fontFamily: "Inter_600SemiBold", color: "#FBBF24", marginLeft: 8 }}
                        >
                          Insights
                        </Text>
                      </View>
                      {isAnalysisOpen ? (
                        <ChevronUp size={20} color="#8E8E93" />
                      ) : (
                        <ChevronDown size={20} color="#8E8E93" />
                      )}
                    </View>

                    {isAnalysisOpen && entry.aiAnalysis && (
                      <View>
                        {entry.insights && entry.insights.length > 0 && (
                          <View className="mb-4">
                            {entry.insights.map((insight, i) => (
                              <View
                                key={i}
                                className="flex-row items-start mb-3"
                              >
                                <Target size={16} color={Colors.accent} className="mr-2 mt-0.5" />
                                <Text
                                  style={{
                                    fontFamily: "Inter_400Regular",
                                    color: "#FFFFFF",
                                    fontSize: 14,
                                    lineHeight: 20,
                                    flex: 1,
                                    marginLeft: 8,
                                  }}
                                >
                                  {insight}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {/* Emotion Breakdown - Collapsible */}
            <Animated.View entering={FadeInDown.delay(700).duration(450)}>
              <Pressable
                onPress={() => toggleSection("emotions")}
                className="rounded-3xl overflow-hidden mb-6"
              >
                <GlassLayers 
                  primaryColor={Colors.primary} 
                  tintColor={tintColor}
                  borderRadius={20} 
                />
                <View className="p-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <BarChart2 size={18} color="#8B5CF6" />
                      <Text
                        style={{ fontFamily: "Inter_600SemiBold", color: "#8B5CF6", marginLeft: 8 }}
                      >
                        Emotion Breakdown
                      </Text>
                    </View>
                    {isEmotionsOpen ? (
                      <ChevronUp size={20} color="#8E8E93" />
                    ) : (
                      <ChevronDown size={20} color="#8E8E93" />
                    )}
                  </View>

                  {isEmotionsOpen && entry.emotionScores && (
                    <View style={{ marginTop: 8, gap: 8 }}>
                      {ALL_EMOTIONS.map((emotion) => {
                        const score = entry.emotionScores?.[emotion] || 0;
                        const color = EMOTION_COLORS[emotion] || Colors.primary;
                        const subLabel = getEmotionSubLabel(emotion, score);
                        const isPrimary = entry.primaryEmotion === emotion;
                        
                        return (
                          <View key={emotion}>
                            <View className="flex-row items-center mb-1">
                              <Text
                                className="text-sm capitalize mr-2"
                                style={{
                                  fontFamily: "Inter_500Medium",
                                  color: isPrimary ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                                  width: 90,
                                }}
                              >
                                {emotion}
                              </Text>
                              <View style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                                <View
                                  style={{
                                    height: 6,
                                    width: `${score}%`,
                                    backgroundColor: color,
                                    borderRadius: 3,
                                  }}
                                />
                              </View>
                              <Text
                                className="text-xs ml-2"
                                style={{
                                  fontFamily: "Inter_600SemiBold",
                                  color: "rgba(255,255,255,0.6)",
                                  width: 30,
                                  textAlign: "right",
                                }}
                              >
                                {score}%
                              </Text>
                            </View>
                            {isPrimary && (
                              <Text
                                className="text-xs ml-[90px]"
                                style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }}
                              >
                                {subLabel}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>

            {/* Correction Button */}
            <Animated.View
              entering={FadeInDown.delay(800).duration(450)}
              className="mb-6"
            >
              <Pressable
                className="flex-row items-center justify-center p-4 rounded-2xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
                onPress={handleCorrectEmotions}
              >
                <Lightbulb size={18} color={Colors.primary} />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    color: Colors.primary,
                    marginLeft: 8,
                  }}
                >
                  Correct this analysis
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      {/* Emotion Correction Modal */}
      <EmotionCorrectionModal
        visible={showCorrectionModal}
        entry={entry}
        onClose={handleCorrectionCancel}
        onComplete={handleCorrectionComplete}
      />
    </View>
  );
}