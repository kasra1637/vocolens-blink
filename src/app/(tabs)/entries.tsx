import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Filter, Search, Clock, ChevronDown, ChevronUp, Trash2, X, Activity, Mic, CreditCard as Edit3, Save, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import Animated, {
  FadeOut,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { tapHaptic, selectHaptic, confirmHaptic, warningHaptic } from '@/lib/haptics';
import { getThemeColors, getThemeGradients, getThemeShadows } from '@/lib/theme';
import useJournalStore from '@/lib/state/journal-store';
import useOnboardingStore, { THEME_COLORS } from '@/lib/state/onboarding-store';
import useSettingsStore from '@/lib/state/settings-store';
import { useDeleteEntry } from '@/lib/hooks';
import { useClickSound } from '@/lib/hooks/useClickSound';
import { JournalEntry, EmotionType, formatShortDuration, getEmotionSubLabel } from '@/lib/types';
import { AudioPlayer } from '@/components/AudioPlayer';

type DisplayEmotion = 'Happiness' | 'Sadness' | 'Anger' | 'Disgust';

const EMOTION_FILTERS: DisplayEmotion[] = ['Happiness', 'Sadness', 'Anger', 'Disgust'];
const SORT_OPTIONS = ['Newest First', 'Oldest First'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const toDisplayEmotion = (emotion: EmotionType): DisplayEmotion =>
  (emotion.charAt(0).toUpperCase() + emotion.slice(1)) as DisplayEmotion;

const fromDisplayEmotion = (emotion: DisplayEmotion): EmotionType =>
  emotion.toLowerCase() as EmotionType;

export default function EntriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const playClickSound = useClickSound();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('Newest First');
  const [selectedEmotions, setSelectedEmotions] = useState<DisplayEmotion[]>([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showEmotionDropdown, setShowEmotionDropdown] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const Colors = getThemeColors(selectedTheme, isDarkMode);
  const Gradients = getThemeGradients(selectedTheme, isDarkMode);
  const Shadows = getThemeShadows(selectedTheme);
  const themeColors = THEME_COLORS[selectedTheme];

  const entries = useJournalStore((s) => s.entries);
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const deleteEntryMutation = useDeleteEntry();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.transcript.toLowerCase().includes(query) ||
          entry.title.toLowerCase().includes(query)
      );
    }

    if (selectedEmotions.length > 0) {
      const emotionFilters = selectedEmotions.map(fromDisplayEmotion);
      filtered = filtered.filter((entry) =>
        emotionFilters.some((emotion) => entry.emotions.includes(emotion))
      );
    }

    filtered.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return selectedSort === 'Newest First' ? diff : -diff;
    });

    return filtered;
  }, [entries, searchQuery, selectedSort, selectedEmotions]);

  const toggleEmotion = useCallback((emotion: DisplayEmotion) => {
    tapHaptic();
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  }, []);

  const handleEntryPress = useCallback(
    (entry: JournalEntry) => {
      playClickSound();
      tapHaptic();
      router.push({ pathname: '/entry-detail', params: { id: entry.id } });
    },
    [router, playClickSound]
  );

  const handleDeleteRequest = useCallback(
    (entryId: string) => {
      warningHaptic();
      setPendingDeleteId(entryId);
    },
    []
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!pendingDeleteId) return;
    confirmHaptic();
    deleteEntryMutation.mutate(pendingDeleteId);
    setPendingDeleteId(null);
  }, [pendingDeleteId, deleteEntryMutation]);

  const handleDeleteCancel = useCallback(() => {
    tapHaptic();
    setPendingDeleteId(null);
  }, []);

  const handleSaveTitle = useCallback(
    (entryId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (trimmed.length > 0) {
        updateEntry(entryId, { title: trimmed });
      }
    },
    [updateEntry]
  );

  if (!fontsLoaded) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background }}>
        <LinearGradient
          colors={Gradients.background}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background }}>
      <LinearGradient
        colors={Gradients.background}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View>
          <Text
            style={{ fontFamily: 'Inter_700Bold', color: '#FFFFFF', fontSize: 22 }}
            className="text-center mb-2"
          >
            Your Journal Entries
          </Text>
          <Text
            style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.8)' }}
            className="text-sm text-center mb-4"
          >
            Browse, search, and revisit all your{'\n'}journal entries in one place.
          </Text>

          <View className="items-center mb-6">
            <Text style={{ fontFamily: 'Inter_700Bold', color: '#FFFFFF' }} className="text-4xl">
              {filteredEntries.length}
            </Text>
            <Text
              style={{ fontFamily: 'Inter_500Medium', color: 'rgba(255, 255, 255, 0.8)' }}
              className="text-xs uppercase tracking-wider"
            >
              Total Entries
            </Text>
          </View>
        </Animated.View>

        {/* Filter & Search */}
        <Animated.View>
          <View
            className="rounded-3xl overflow-hidden mb-6"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <View className="p-4">
              <View className="flex-row items-center mb-3">
                <Filter size={16} color="#FFFFFF" strokeWidth={2} />
                <Text
                  style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' }}
                  className="text-sm ml-2"
                >
                  FILTER & SEARCH
                </Text>
              </View>

              <View
                className="flex-row items-center rounded-xl px-4 py-3 mb-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Search size={18} color="#FFFFFF" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3"
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#FFFFFF' }}
                  placeholder="Search your thoughts..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={18} color="#FFFFFF" strokeWidth={2} />
                  </Pressable>
                )}
              </View>

              <View className="flex-row" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => {
                    tapHaptic();
                    setShowSortDropdown(!showSortDropdown);
                    setShowEmotionDropdown(false);
                  }}
                  className="flex-1 flex-row items-center justify-between rounded-xl px-3 py-3"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', color: '#FFFFFF' }} className="text-xs">
                    {selectedSort}
                  </Text>
                  <ChevronDown size={14} color="#FFFFFF" strokeWidth={2} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    tapHaptic();
                    setShowEmotionDropdown(!showEmotionDropdown);
                    setShowSortDropdown(false);
                  }}
                  className="flex-1 flex-row items-center justify-between rounded-xl px-3 py-3"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', color: '#FFFFFF' }} className="text-xs">
                    {selectedEmotions.length > 0 ? `${selectedEmotions.length} Selected` : 'Emotions'}
                  </Text>
                  <ChevronDown size={14} color="#FFFFFF" strokeWidth={2} />
                </Pressable>
              </View>

              {showSortDropdown && (
                <Animated.View
                  exiting={FadeOut.duration(200)}
                  className="mt-2 rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {SORT_OPTIONS.map((sort) => (
                    <Pressable
                      key={sort}
                      onPress={() => {
                        tapHaptic();
                        setSelectedSort(sort);
                        setShowSortDropdown(false);
                      }}
                      className="px-3 py-3"
                      style={{
                        backgroundColor: selectedSort === sort ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#FFFFFF' }}>
                        {sort}
                      </Text>
                    </Pressable>
                  ))}
                </Animated.View>
              )}

              {showEmotionDropdown && (
                <Animated.View
                  exiting={FadeOut.duration(200)}
                  className="mt-2 rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 }}>
                    {EMOTION_FILTERS.map((emotion) => (
                      <Pressable
                        key={emotion}
                        onPress={() => toggleEmotion(emotion)}
                        className="px-3 py-3 rounded-full"
                        style={{
                          backgroundColor: selectedEmotions.includes(emotion)
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'transparent',
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#FFFFFF' }}>
                          {emotion}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Entry Cards */}
        {filteredEntries.map((entry) => (
          <Animated.View key={entry.id}>
            <EntryCard
              entry={entry}
              onPress={() => handleEntryPress(entry)}
              onDeleteRequest={() => handleDeleteRequest(entry.id)}
              onSaveTitle={(title) => handleSaveTitle(entry.id, title)}
              surfaceElevatedColor={Colors.surfaceElevated}
              primaryColor={Colors.primary}
              isDarkMode={isDarkMode}
            />
          </Animated.View>
        ))}

        {filteredEntries.length === 0 && (
          <Animated.View className="items-center py-8">
            <Text
              style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' }}
              className="text-center text-lg mb-2"
            >
              {entries.length === 0 ? 'No Entries Yet' : 'No Matches Found'}
            </Text>
            <Text
              style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.8)' }}
              className="text-center"
            >
              {entries.length === 0
                ? 'Start recording your thoughts\nto see them here.'
                : "Try adjusting your filters\nto find what you're looking for."}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Themed Delete Confirmation Modal */}
      <Modal
        visible={pendingDeleteId !== null}
        animationType="fade"
        transparent
        onRequestClose={handleDeleteCancel}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <LinearGradient
            colors={themeColors.backgroundGradient}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 28,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <Animated.View entering={FadeIn.duration(200)}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <AlertTriangle size={30} color="#EF4444" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    color: '#FFFFFF',
                    fontSize: 20,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Delete Entry?
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 14,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}
                >
                  This will permanently delete this journal entry. This action cannot be undone.
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                <Pressable
                  onPress={handleDeleteConfirm}
                  style={({ pressed }) => ({
                    borderRadius: 16,
                    overflow: 'hidden',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ padding: 16, alignItems: 'center', borderRadius: 16 }}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', color: '#FFFFFF', fontSize: 15 }}>
                      Delete Entry
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleDeleteCancel}
                  style={({ pressed }) => ({
                    borderRadius: 16,
                    padding: 16,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: themeColors.primary,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                  })}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', color: themeColors.primary, fontSize: 15 }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

// ── Entry Card ────────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
  onDeleteRequest: () => void;
  onSaveTitle: (title: string) => void;
  surfaceElevatedColor: string;
  primaryColor: string;
  isDarkMode?: boolean;
}

function EntryCard({
  entry,
  onPress,
  onDeleteRequest,
  onSaveTitle,
  primaryColor,
  isDarkMode = false,
}: EntryCardProps) {
  const scale = useSharedValue(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.98); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  const handleEditPress = () => {
    selectHaptic();
    setIsEditing(true);
    setEditTitle(entry.title);
  };

  const handleSavePress = () => {
    confirmHaptic();
    onSaveTitle(editTitle);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    tapHaptic();
    setEditTitle(entry.title);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 24,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: Platform.OS === 'android' ? 0 : 6,
          },
          animatedStyle,
        ]}
      >
        <View style={{ padding: 20 }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              {isEditing ? (
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  maxLength={50}
                  autoFocus
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 17,
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: primaryColor,
                  }}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  placeholder="Entry title..."
                />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 17, flex: 1 }}
                    numberOfLines={1}
                  >
                    {entry.title}
                  </Text>
                  {entry.audioUri && (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 20,
                        backgroundColor: `${primaryColor}30`,
                      }}
                    >
                      <Mic size={12} color={primaryColor} strokeWidth={2.5} />
                    </View>
                  )}
                </View>
              )}
              <Text
                style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginTop: 2 }}
              >
                {formatDate(entry.createdAt)}, {formatTime(entry.createdAt)}
              </Text>
            </View>

            {/* Edit / Save / Cancel buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isEditing ? (
                <>
                  <Pressable
                    onPress={handleCancelEdit}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(239,68,68,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} color="#EF4444" strokeWidth={2.5} />
                  </Pressable>
                  <Pressable
                    onPress={handleSavePress}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(34,197,94,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Save size={16} color="#22C55E" strokeWidth={2.5} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={handleEditPress}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit3 size={15} color="#FFFFFF" strokeWidth={2.5} />
                  </Pressable>
                  <Pressable
                    onPress={onDeleteRequest}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={15} color="#FFFFFF" strokeWidth={2.5} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Duration + Intensity */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={14} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
              <Text
                style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginLeft: 4 }}
              >
                {formatShortDuration(entry.duration)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Activity size={14} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
              <Text
                style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, marginLeft: 4 }}
              >
                {entry.emotionIntensity}% intensity
              </Text>
            </View>
          </View>

          {/* Primary Emotion */}
          {entry.primaryEmotion && (
            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  gap: 6,
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 12 }}>
                  {entry.emotionIntensityLabels?.[entry.primaryEmotion] ??
                    getEmotionSubLabel(entry.primaryEmotion, entry.emotionIntensity)}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    textTransform: 'capitalize',
                  }}
                >
                  {entry.primaryEmotion}
                </Text>
              </View>
            </View>
          )}

          {/* Conversation Prompt */}
          {entry.conversationPrompt && (
            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Text
                  style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}
                  numberOfLines={2}
                >
                  "{entry.conversationPrompt}"
                </Text>
              </View>
            </View>
          )}

          {/* Collapsible Transcript */}
          <CollapsibleTranscript transcript={entry.transcript} primaryColor={primaryColor} />

          {/* Topics */}
          {entry.topics && entry.topics.length > 0 && entry.topics.some((t) => t && t.trim().length > 0) && (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                Topics
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {entry.topics
                  .slice(0, 3)
                  .filter((t) => t && t.trim().length > 0)
                  .map((topic, index) => (
                    <View
                      key={index}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inter_400Regular',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: 11,
                          textTransform: 'capitalize',
                        }}
                      >
                        {topic}
                      </Text>
                    </View>
                  ))}
                {entry.topics.filter((t) => t && t.trim().length > 0).length > 3 && (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Text
                      style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.9)', fontSize: 11 }}
                    >
                      +{entry.topics.filter((t) => t && t.trim().length > 0).length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* AI Analysis Snippet */}
          {entry.aiAnalysis && entry.aiAnalysis.trim().length > 1 && (
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 20,
                    fontSize: 12,
                  }}
                  numberOfLines={2}
                >
                  {entry.aiAnalysis}
                </Text>
              </View>
            </View>
          )}

          {/* Audio Player */}
          {entry.audioUri && (
            <View style={{ marginBottom: 16 }}>
              <AudioPlayer audioUri={entry.audioUri} primaryColor={primaryColor} isDarkMode={isDarkMode} />
            </View>
          )}

          {/* View Full Analysis button */}
          <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
              borderRadius: 20,
              paddingVertical: 12,
              alignItems: 'center',
              backgroundColor: primaryColor,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>
              View Full Analysis
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Collapsible Transcript ────────────────────────────────────────────────────

function CollapsibleTranscript({
  transcript,
  primaryColor,
}: {
  transcript: string;
  primaryColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);

  const toggle = () => {
    tapHaptic();
    setExpanded((v) => !v);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          color: '#FFFFFF',
          lineHeight: 22,
          fontSize: 14,
        }}
        numberOfLines={expanded ? undefined : 2}
        onTextLayout={(e) => {
          // If text is truncated (more than 2 lines worth), show the toggle
          if (!needsCollapse && e.nativeEvent.lines.length > 2) {
            setNeedsCollapse(true);
          }
        }}
      >
        {transcript}
      </Text>

      {(needsCollapse || expanded) && (
        <Pressable
          onPress={toggle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 6,
            alignSelf: 'flex-start',
            gap: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              color: primaryColor,
              fontSize: 12,
            }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Text>
          {expanded ? (
            <ChevronUp size={14} color={primaryColor} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} color={primaryColor} strokeWidth={2.5} />
          )}
        </Pressable>
      )}
    </View>
  );
}
