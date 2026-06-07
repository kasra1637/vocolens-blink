// AI-Powered Emotional Intelligence Analysis
//
// This module powers the Insights tab's deep pattern analysis (recurring
// patterns, triggers, mood cycles, emotional shifts, priority insights).
//
// Originally this called a backend endpoint (/api/journal/ai-completion).
// To make Deep AI Insights work without deploying the backend, the call has
// been switched to a direct OpenRouter (Claude 3.7 Sonnet) request using
// the same EXPO_PUBLIC_OPENROUTER_API_KEY that powers per-entry analysis.
//
// All other behavior (caching, validation, default fallback, prompt) is
// unchanged. If the direct call fails for any reason (no key, network,
// invalid JSON, rate limit), the safe local default analysis is returned
// instead so the Insights tab never breaks.

import { JournalEntry } from './types';
import {
  DeepInsight,
  EmotionalPattern,
  EmotionalTrigger,
  MoodCycle,
  EmotionalShift,
} from './emotional-intelligence';

// AI Analysis Response Type
export interface AIAnalysisResponse {
  patterns: EmotionalPattern[];
  triggers: EmotionalTrigger[];
  cycles: MoodCycle[];
  shifts: EmotionalShift[];
  insights: DeepInsight[];
}

// ============================================================================
// CONFIG
// ============================================================================

function getBackendUrl(): string {
  return (
    (process.env.EXPO_PUBLIC_BACKEND_URL || "https://vocolens-api.kasrammarvel.workers.dev").trim()
  );
}

// ============================================================================
// CACHE
// ============================================================================

interface CachedAnalysis {
  data: AIAnalysisResponse;
  timestamp: number;
  entryCount: number;
}

let cachedAnalysis: CachedAnalysis | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function clearAICache(): void {
  cachedAnalysis = null;
}

// ============================================================================
// DEFAULT ANALYSIS (used when AI call fails for any reason)
// ============================================================================

function getDefaultAnalysis(): AIAnalysisResponse {
  return {
    patterns: [],
    triggers: [],
    cycles: [],
    shifts: [],
    insights: [
      {
        category: 'recommendation',
        title: 'Keep Journaling',
        message:
          'Continue recording your thoughts and emotions. The more entries you add, the more personalized insights we can provide.',
        evidence: [],
        priority: 'medium',
        emoji: '📝',
      },
    ],
  };
}

// ============================================================================
// ENTRY PREPARATION
// ============================================================================

function prepareEntriesForAI(entries: JournalEntry[]): string {
  // Get the most recent 20 entries for analysis (to stay within token limits)
  const recentEntries = entries.slice(0, 20);

  return recentEntries
    .map((entry, index) => {
      const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      const emotions = entry.emotions.join(', ');
      const intensity = entry.emotionIntensity;

      return `Entry ${index + 1} (${date}):
Emotions: ${emotions}
Intensity: ${intensity}/100
Content: ${entry.transcript.slice(0, 300)}${entry.transcript.length > 300 ? '...' : ''}`;
    })
    .join('\n\n');
}

// ============================================================================
// BACKEND PROXY CALL (routes through the Cloudflare Worker)
// ============================================================================

function getBackendUrl(): string {
  return (
    (process.env.EXPO_PUBLIC_BACKEND_URL || "https://vocolens-api.kasrammarvel.workers.dev").trim()
  );
}

async function callOpenRouterDirect(entriesText: string): Promise<AIAnalysisResponse> {
  // Route through the backend Worker so all activity is billed to the
  // server-side API key and appears in the OpenRouter dashboard.
  // The /api/journal/ai-completion endpoint accepts { systemPrompt, userPrompt }.
  const backendUrl = getBackendUrl();

  const systemPrompt = `You are an expert emotional intelligence analyst and therapist. Analyze journal entries to provide deep psychological insights. Be empathetic, insightful, and provide actionable advice.

Return a JSON object with the following structure:
{
  "patterns": [
    {
      "id": "unique-id",
      "type": "recurring|trigger|cycle|shift|correlation",
      "title": "Short title",
      "description": "Detailed description",
      "confidence": 0-100,
      "frequency": number,
      "insight": "Key insight",
      "actionable": "Actionable advice",
      "relatedEmotions": ["happiness", "sadness", etc],
      "timeframe": "Past 7 days",
      "dataPoints": number
    }
  ],
  "triggers": [
    {
      "trigger": "topic/keyword",
      "emotions": ["emotion1", "emotion2"],
      "averageSentiment": 0-100,
      "occurrences": number,
      "context": "When this appears",
      "recommendation": "How to handle"
    }
  ],
  "cycles": [
    {
      "pattern": "morning_dip|evening_peak|weekly_cycle|stress_recovery",
      "description": "Description",
      "insight": "Insight",
      "strength": 0-100
    }
  ],
  "shifts": [
    {
      "from": "emotion",
      "to": "emotion",
      "frequency": number,
      "averageTimeBetween": "2 days",
      "context": "What triggers this",
      "insight": "Key insight"
    }
  ],
  "insights": [
    {
      "category": "self_awareness|growth|warning|strength|recommendation",
      "title": "Insight title",
      "message": "Detailed message",
      "evidence": ["evidence1", "evidence2"],
      "priority": "high|medium|low",
      "emoji": "relevant emoji"
    }
  ]
}

Be specific and reference actual content from entries. Limit to 2-3 items per category for clarity.

Respond with ONLY a valid JSON object — no markdown fences, no commentary.`;

  const userPrompt = `Analyze these journal entries and provide emotional intelligence insights:\n\n${entriesText}\n\nProvide your analysis as valid JSON only, no additional text.`;

  try {
    const response = await fetch(`${backendUrl}/api/journal/ai-completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt, temperature: 0.7, maxTokens: 2000 }),
    });

    if (!response.ok) {
      console.error('[AI Emotional Intelligence] Backend returned', response.status);
      return getDefaultAnalysis();
    }

    const json = await response.json() as { success?: boolean; data?: unknown; error?: string };
    if (!json.success || !json.data) {
      console.error('[AI Emotional Intelligence] Backend error:', json.error);
      return getDefaultAnalysis();
    }

    return validateAndCleanAnalysis(json.data as AIAnalysisResponse);
  } catch (err) {
    console.error('[AI Emotional Intelligence] Network error:', err);
    return getDefaultAnalysis();
  }
}

Respond with ONLY a valid JSON object — no markdown fences, no commentary.`;

  const userPrompt = `Analyze these journal entries and provide emotional intelligence insights:

${entriesText}

Provide your analysis as valid JSON only, no additional text.`;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://blink.new',
      'X-Title': 'Vocolens',
    },
    body: JSON.stringify({
      model: MODEL,
// ============================================================================
// VALIDATION & CLEANING
// ============================================================================

function validateAndCleanAnalysis(analysis: AIAnalysisResponse): AIAnalysisResponse {
  return {
    patterns: Array.isArray(analysis.patterns) ? analysis.patterns.slice(0, 3) : [],
    triggers: Array.isArray(analysis.triggers) ? analysis.triggers.slice(0, 3) : [],
    cycles: Array.isArray(analysis.cycles) ? analysis.cycles.slice(0, 2) : [],
    shifts: Array.isArray(analysis.shifts) ? analysis.shifts.slice(0, 3) : [],
    insights: Array.isArray(analysis.insights)
      ? analysis.insights.slice(0, 5).map((insight) => ({
          ...insight,
          category: validateCategory(insight.category),
          priority: validatePriority(insight.priority),
          emoji: insight.emoji || '💡',
          evidence: Array.isArray(insight.evidence) ? insight.evidence : [],
        }))
      : [],
  };
}

function validateCategory(
  category: string
): 'self_awareness' | 'growth' | 'warning' | 'strength' | 'recommendation' {
  const validCategories = ['self_awareness', 'growth', 'warning', 'strength', 'recommendation'];
  return validCategories.includes(category)
    ? (category as 'self_awareness' | 'growth' | 'warning' | 'strength' | 'recommendation')
    : 'recommendation';
}

function validatePriority(priority: string): 'high' | 'medium' | 'low' {
  const validPriorities = ['high', 'medium', 'low'];
  return validPriorities.includes(priority) ? (priority as 'high' | 'medium' | 'low') : 'medium';
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function analyzeWithAI(entries: JournalEntry[]): Promise<AIAnalysisResponse> {
  if (entries.length < 5) {
    return getDefaultAnalysis();
  }

  const entriesText = prepareEntriesForAI(entries);

  try {
    return await callOpenRouterDirect(entriesText);
  } catch (error) {
    console.warn('[AI Emotional Intelligence] Analysis failed, using default:', error);
    return getDefaultAnalysis();
  }
}

export async function getAIAnalysis(entries: JournalEntry[]): Promise<AIAnalysisResponse> {
  const now = Date.now();

  // Return cached data if valid
  if (
    cachedAnalysis &&
    now - cachedAnalysis.timestamp < CACHE_DURATION &&
    cachedAnalysis.entryCount === entries.length
  ) {
    return cachedAnalysis.data;
  }

  // Fetch new analysis
  const analysis = await analyzeWithAI(entries);

  // Cache the result
  cachedAnalysis = {
    data: analysis,
    timestamp: now,
    entryCount: entries.length,
  };

  return analysis;
}
