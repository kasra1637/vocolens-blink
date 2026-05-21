// Badges & Achievements Store with Persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Badge, BadgeCategory, BadgeRarity } from '../types';

// Badge definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'progress' | 'unlocked' | 'unlockDate'>[] = [
  // ── Streak badges ─────────────────────────────────────────────────────────
  {
    id: 'streak-3',
    title: '3-Day Streak',
    description: 'Journal for 3 consecutive days',
    category: 'streak',
    rarity: 'common',
    icon: 'flame',
    requirement: 'Journal 3 days in a row',
    tip: 'Set a daily reminder to build your habit!',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Journal for 7 consecutive days',
    category: 'streak',
    rarity: 'rare',
    icon: 'zap',
    requirement: 'Journal 7 days in a row',
    tip: 'Try journaling at the same time each day.',
  },
  {
    id: 'streak-14',
    title: 'Two Week Champion',
    description: 'Journal for 14 consecutive days',
    category: 'streak',
    rarity: 'rare',
    icon: 'target',
    requirement: 'Journal 14 days in a row',
    tip: 'Two weeks is where habits really start to stick!',
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Journal for 30 consecutive days',
    category: 'streak',
    rarity: 'epic',
    icon: 'trophy',
    requirement: 'Journal 30 days in a row',
    tip: "You're building a powerful habit!",
  },
  {
    id: 'streak-100',
    title: 'Centurion',
    description: 'Journal for 100 consecutive days',
    category: 'streak',
    rarity: 'legendary',
    icon: 'crown',
    requirement: 'Journal 100 days in a row',
    tip: "You've achieved something truly remarkable!",
  },

  // ── Entry count badges ─────────────────────────────────────────────────────
  {
    id: 'entries-10',
    title: 'Getting Started',
    description: 'Create your first 10 journal entries',
    category: 'entries',
    rarity: 'common',
    icon: 'book-open',
    requirement: 'Create 10 entries',
    tip: 'Every entry is a step toward self-discovery.',
  },
  {
    id: 'entries-50',
    title: 'Prolific Writer',
    description: 'Create 50 journal entries',
    category: 'entries',
    rarity: 'rare',
    icon: 'pen-tool',
    requirement: 'Create 50 entries',
    tip: "You're becoming a true journaling enthusiast!",
  },
  {
    id: 'entries-100',
    title: 'Century Club',
    description: 'Create 100 journal entries',
    category: 'entries',
    rarity: 'epic',
    icon: 'award',
    requirement: 'Create 100 entries',
    tip: 'Your dedication is inspiring!',
  },
  {
    id: 'entries-250',
    title: 'Dedicated Chronicler',
    description: 'Create 250 journal entries',
    category: 'entries',
    rarity: 'epic',
    icon: 'library',
    requirement: 'Create 250 entries',
    tip: "You're building an incredible personal archive!",
  },
  {
    id: 'entries-500',
    title: 'Storyteller',
    description: 'Create 500 journal entries',
    category: 'entries',
    rarity: 'legendary',
    icon: 'book',
    requirement: 'Create 500 entries',
    tip: "You've created a library of self-reflection!",
  },

  // ── Time-based badges ──────────────────────────────────────────────────────
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Record 10 entries before 8 AM',
    category: 'time',
    rarity: 'common',
    icon: 'sunrise',
    requirement: 'Record 10 morning entries (before 8 AM)',
    tip: 'Morning journaling sets a positive tone for the day.',
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Record 10 entries after 10 PM',
    category: 'time',
    rarity: 'rare',
    icon: 'moon-star',
    requirement: 'Record 10 evening entries (after 10 PM)',
    tip: 'Evening reflection helps process the day.',
  },
  {
    id: 'marathon-voice',
    title: 'Marathon Voice',
    description: 'Accumulate 60 minutes of total recording time',
    category: 'time',
    rarity: 'rare',
    icon: 'mic',
    requirement: 'Record a cumulative 60 minutes across all entries',
    tip: 'Every second of reflection counts.',
  },

  // ── Mood badges ────────────────────────────────────────────────────────────
  {
    id: 'emotional-explorer',
    title: 'Emotional Explorer',
    description: 'Experience and log all 8 core emotions',
    category: 'mood',
    rarity: 'common',
    icon: 'heart',
    requirement: 'Log all 8 core emotions',
    tip: 'Embrace the full spectrum of your feelings.',
  },
  {
    id: 'optimist',
    title: 'Optimist',
    description: 'Record 20 positive-valence entries',
    category: 'mood',
    rarity: 'rare',
    icon: 'sun',
    requirement: 'Record 20 entries with positive emotional valence',
    tip: 'Focus on gratitude and positive moments.',
  },
  {
    id: 'mindful',
    title: 'Balanced Soul',
    description: 'Record 15 neutral-valence entries',
    category: 'mood',
    rarity: 'rare',
    icon: 'scale',
    requirement: 'Record 15 entries with neutral emotional valence',
    tip: 'Finding balance is a sign of emotional maturity.',
  },
  {
    id: 'peak-intensity',
    title: 'Full Spectrum',
    description: 'Record an entry with 90%+ emotion intensity',
    category: 'mood',
    rarity: 'epic',
    icon: 'activity',
    requirement: 'Record an entry scoring 90 or higher in emotion intensity',
    tip: 'Deep feeling is the gateway to deep understanding.',
  },

  // ── Consistency badges ─────────────────────────────────────────────────────
  {
    id: 'weekly-ritual',
    title: 'Weekly Ritual',
    description: 'Journal on every day of a calendar week (Mon–Sun)',
    category: 'consistency',
    rarity: 'common',
    icon: 'calendar-check',
    requirement: 'Complete at least one entry on each of the 7 days in a Mon–Sun week',
    tip: 'Consistency is the key to lasting change.',
  },
  {
    id: 'topic-explorer',
    title: 'Topic Explorer',
    description: 'Journal across 10 unique topics',
    category: 'consistency',
    rarity: 'rare',
    icon: 'compass',
    requirement: 'Record entries covering 10 different topics',
    tip: 'The more you explore, the more you discover about yourself.',
  },

  // ── Special badges ─────────────────────────────────────────────────────────
  {
    id: 'first-entry',
    title: 'First Entry',
    description: 'Create your very first journal entry',
    category: 'special',
    rarity: 'common',
    icon: 'sparkles',
    requirement: 'Create your first entry',
    tip: 'Welcome to your journaling journey!',
  },
  {
    id: 'long-session',
    title: 'Deep Dive',
    description: 'Record a single entry longer than 10 minutes',
    category: 'special',
    rarity: 'rare',
    icon: 'clock',
    requirement: 'Record a 10+ minute entry',
    tip: 'Sometimes we need more time to process.',
  },
];

interface BadgeState {
  id: string;
  progress: number;
  unlocked: boolean;
  unlockDate?: string;
}

interface BadgesStore {
  // State
  badgeStates: Record<string, BadgeState>;
  unlockedCount: number;
  /** Badge IDs waiting to be shown as a celebration modal */
  pendingCelebrations: string[];
  /** Persistent referral code generated once per install */
  referralCode: string;
  /** True once the persisted state has been rehydrated — used to prevent stale celebration replays */
  _hasHydrated: boolean;

  // Actions
  initializeBadges: () => void;
  updateBadgeProgress: (badgeId: string, progress: number) => void;
  unlockBadge: (badgeId: string) => void;
  checkAndUpdateBadges: (stats: {
    streak: number;
    totalEntries: number;
    positiveEntries: number;
    neutralEntries: number;
    morningEntries: number;
    eveningEntries: number;
    uniqueEmotions: string[];
    longestSessionSeconds: number;
    totalDurationSeconds: number;
    uniqueTopicCount: number;
    maxEmotionIntensity: number;
    weeksWithFullCoverage: number;
  }) => string[]; // Returns newly unlocked badge IDs
  getBadgeWithState: (badgeId: string) => Badge | null;
  getAllBadges: () => Badge[];
  getBadgesByCategory: (category: BadgeCategory) => Badge[];
  resetBadges: () => void;
  /** Push a badge ID onto the celebration queue (only after hydration) */
  queueCelebration: (badgeId: string) => void;
  /** Pop and return the next badge ID to celebrate, or null if queue is empty */
  dequeueCelebration: () => string | null;
  setHasHydrated: () => void;
}

const useBadgesStore = create<BadgesStore>()(
  persist(
    (set, get) => ({
      badgeStates: {},
      unlockedCount: 0,
      pendingCelebrations: [],
      // Generate a unique referral code once per install (8 alphanumeric chars)
      referralCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      _hasHydrated: false,

      setHasHydrated: () => set({ _hasHydrated: true }),

      initializeBadges: () => {
        const currentStates = get().badgeStates;
        const newStates: Record<string, BadgeState> = {};

        BADGE_DEFINITIONS.forEach((badge) => {
          if (!currentStates[badge.id]) {
            newStates[badge.id] = {
              id: badge.id,
              progress: 0,
              unlocked: false,
            };
          } else {
            newStates[badge.id] = currentStates[badge.id];
          }
        });

        set({ badgeStates: newStates });
      },

      updateBadgeProgress: (badgeId, progress) => {
        set((state) => ({
          badgeStates: {
            ...state.badgeStates,
            [badgeId]: {
              ...state.badgeStates[badgeId],
              progress: Math.min(100, progress),
            },
          },
        }));
      },

      unlockBadge: (badgeId) => {
        const state = get().badgeStates[badgeId];
        if (state && !state.unlocked) {
          set((s) => ({
            badgeStates: {
              ...s.badgeStates,
              [badgeId]: {
                ...s.badgeStates[badgeId],
                progress: 100,
                unlocked: true,
                unlockDate: new Date().toISOString(),
              },
            },
            unlockedCount: s.unlockedCount + 1,
          }));
        }
      },

      checkAndUpdateBadges: (stats) => {
        const { updateBadgeProgress, unlockBadge, badgeStates } = get();
        const newlyUnlocked: string[] = [];

        const check = (id: string, progress: number, unlockCondition: boolean) => {
          updateBadgeProgress(id, progress);
          if (unlockCondition && !badgeStates[id]?.unlocked) {
            unlockBadge(id);
            newlyUnlocked.push(id);
          }
        };

        // ── Streak badges ────────────────────────────────────────────────────
        const streakChecks = [
          { id: 'streak-3', target: 3 },
          { id: 'streak-7', target: 7 },
          { id: 'streak-14', target: 14 },
          { id: 'streak-30', target: 30 },
          { id: 'streak-100', target: 100 },
        ];
        streakChecks.forEach(({ id, target }) =>
          check(id, Math.min(100, (stats.streak / target) * 100), stats.streak >= target)
        );

        // ── Entry count badges ───────────────────────────────────────────────
        const entryChecks = [
          { id: 'entries-10', target: 10 },
          { id: 'entries-50', target: 50 },
          { id: 'entries-100', target: 100 },
          { id: 'entries-250', target: 250 },
          { id: 'entries-500', target: 500 },
        ];
        entryChecks.forEach(({ id, target }) =>
          check(id, Math.min(100, (stats.totalEntries / target) * 100), stats.totalEntries >= target)
        );

        // ── First entry (special) ────────────────────────────────────────────
        check('first-entry', stats.totalEntries >= 1 ? 100 : 0, stats.totalEntries >= 1);

        // ── Time-of-day badges ───────────────────────────────────────────────
        check('early-bird', Math.min(100, (stats.morningEntries / 10) * 100), stats.morningEntries >= 10);
        check('night-owl', Math.min(100, (stats.eveningEntries / 10) * 100), stats.eveningEntries >= 10);

        // Marathon Voice: 3600 s = 60 min
        check(
          'marathon-voice',
          Math.min(100, (stats.totalDurationSeconds / 3600) * 100),
          stats.totalDurationSeconds >= 3600
        );

        // ── Mood / valence badges ────────────────────────────────────────────
        check('optimist', Math.min(100, (stats.positiveEntries / 20) * 100), stats.positiveEntries >= 20);
        check('mindful', Math.min(100, (stats.neutralEntries / 15) * 100), stats.neutralEntries >= 15);

        // Emotional explorer: all 8 emotions seen
        check(
          'emotional-explorer',
          Math.min(100, (stats.uniqueEmotions.length / 8) * 100),
          stats.uniqueEmotions.length >= 8
        );

        // Peak intensity: any single entry ≥ 90%
        check(
          'peak-intensity',
          stats.maxEmotionIntensity >= 90 ? 100 : Math.min(99, (stats.maxEmotionIntensity / 90) * 100),
          stats.maxEmotionIntensity >= 90
        );

        // ── Consistency badges ───────────────────────────────────────────────
        // Weekly ritual: at least one full calendar week (Mon–Sun) covered
        check(
          'weekly-ritual',
          stats.weeksWithFullCoverage >= 1 ? 100 : 0,
          stats.weeksWithFullCoverage >= 1
        );

        // Topic explorer: 10 unique topics
        check(
          'topic-explorer',
          Math.min(100, (stats.uniqueTopicCount / 10) * 100),
          stats.uniqueTopicCount >= 10
        );

        // ── Special badges ───────────────────────────────────────────────────
        // Deep Dive: single entry ≥ 600 s (10 min)
        check(
          'long-session',
          stats.longestSessionSeconds >= 600 ? 100 : Math.min(99, (stats.longestSessionSeconds / 600) * 100),
          stats.longestSessionSeconds >= 600
        );

        return newlyUnlocked;
      },

      getBadgeWithState: (badgeId) => {
        const definition = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
        const state = get().badgeStates[badgeId];

        if (!definition) return null;

        return {
          ...definition,
          progress: state?.progress || 0,
          unlocked: state?.unlocked || false,
          unlockDate: state?.unlockDate,
        };
      },

      getAllBadges: () => {
        const { badgeStates } = get();
        return BADGE_DEFINITIONS.map((definition) => ({
          ...definition,
          progress: badgeStates[definition.id]?.progress || 0,
          unlocked: badgeStates[definition.id]?.unlocked || false,
          unlockDate: badgeStates[definition.id]?.unlockDate,
        }));
      },

      getBadgesByCategory: (category) => {
        return get()
          .getAllBadges()
          .filter((badge) => badge.category === category);
      },

      resetBadges: () => {
        const freshStates: Record<string, BadgeState> = {};
        BADGE_DEFINITIONS.forEach((badge) => {
          freshStates[badge.id] = {
            id: badge.id,
            progress: 0,
            unlocked: false,
          };
        });
        set({ badgeStates: freshStates, unlockedCount: 0, pendingCelebrations: [] });
      },

      queueCelebration: (badgeId) => {
        // Guard: only queue after hydration to avoid replaying stale unlocks on app restart
        if (!get()._hasHydrated) return;
        set((s) => ({
          pendingCelebrations: [...s.pendingCelebrations, badgeId],
        }));
      },

      dequeueCelebration: () => {
        const queue = get().pendingCelebrations;
        if (queue.length === 0) return null;
        set({ pendingCelebrations: queue.slice(1) });
        return queue[0];
      },
    }),
    {
      name: 'badges-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted: any, version: number) => {
        // v0 → v1: clear stale pendingCelebrations so old queued popups don't replay
        if (version < 1) {
          return { ...(persisted as object), pendingCelebrations: [] };
        }
        return persisted as any;
      },
      // Intentionally exclude pendingCelebrations from persistence so celebrations
      // queued in a previous session do not replay when the app restarts.
      partialize: (state) => ({
        badgeStates: state.badgeStates,
        unlockedCount: state.unlockedCount,
        referralCode: state.referralCode,
        // pendingCelebrations is intentionally NOT persisted
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete so future queueCelebration calls are allowed
        state?.setHasHydrated();
      },
    }
  )
);

export default useBadgesStore;

// Selector hooks
export const useUnlockedBadgesCount = () => useBadgesStore((s) => s.unlockedCount);
export const useBadgeProgress = (badgeId: string) =>
  useBadgesStore((s) => s.badgeStates[badgeId]?.progress || 0);
