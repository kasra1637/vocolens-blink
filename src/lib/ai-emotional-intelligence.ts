// AI-Powered Emotional Intelligence Analysis via backend proxy
import { JournalEntry } from './types';
import { resolveBackendUrl } from './api/openrouter-service';
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
// DEFAULT ANALYSIS
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
// AI CALL (via backend proxy)
// ============================================================================

async function callBackendAI(entriesText: string): Promise<AIAnalysisResponse> {
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
      "title": "Short title",
      "message": "Detailed message (2-3 sentences)",
      "evidence": ["Evidence 1", "Evidence 2"],
      "priority": "high|medium|low",
      "emoji": "relevant emoji"
    }
  ]
}

Focus on:
1. Emotional patterns (recurring themes, correlations)
2. Triggers (what causes certain emotions)
3. Mood cycles (time-based patterns)
4. Emotional shifts (transitions between states)
5. Deep insights (self-awareness, growth opportunities, warnings, strengths)

Be specific and reference actual content from entries. Limit to 2-3 items per category for clarity.`;

  const userPrompt = `Analyze these journal entries and provide emotional intelligence insights:

${entriesText}

Provide your analysis as valid JSON only, no additional text.`;

  const response = await fetch(`${resolveBackendUrl()}/api/journal/ai-completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[AI Emotional Intelligence] Backend returned non-OK status:', response.status, errText);
    return getDefaultAnalysis();
  }

  const json = (await response.json()) as { success: boolean; data?: unknown; error?: string };

  if (!json.success || json.data === undefined) {
    console.error('[AI Emotional Intelligence] Backend error:', json.error || 'Missing data field');
    return getDefaultAnalysis();
  }

  const analysis = json.data as AIAnalysisResponse;
  return validateAndCleanAnalysis(analysis);
}

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
    return await callBackendAI(entriesText);
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
