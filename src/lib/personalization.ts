/**
 * Emotion Personalization — Prompt Adaptation Layer
 *
 * Reads aggregated correction patterns from the EmotionCorrectionStore and injects
 * them into future analysis prompts so the model personalizes its interpretation
 * to each user's unique emotional vocabulary.
 *
 * Safety principles:
 * - Corrections inform personalization — they are not clinical diagnoses
 * - The system is supportive, never diagnostic
 * - Patterns are used to bias labels, not to infer mental health conditions
 */

import { EmotionType } from './types';
import { useEmotionCorrectionStore, UserEmotionBias } from './state/emotion-correction-store';

/**
 * Generates a personalization suffix to append to the AI system prompt.
 * Returns empty string if there are no corrections yet (new user = no bias).
 */
export function buildPersonalizationPrompt(): string {
  const { getUserBias, getConfirmationRate, getPersonalizationStrength } = useEmotionCorrectionStore.getState();
  const bias = getUserBias();
  const confirmationRate = getConfirmationRate();
  const strength = getPersonalizationStrength();

  // New user: no corrections yet — no personalization needed
  if (bias.totalCorrections === 0) {
    return '';
  }

  const parts: string[] = [];

  // 1. Confidence calibration
  if (confirmationRate >= 0.8) {
    parts.push(
      `User feedback calibration: this user's AI-assisted journal analysis has been confirmed correct ${Math.round(confirmationRate * 100)}% of the time. Trust the analysis as generally accurate, with minor adjustments only if the transcript clearly contradicts the detected emotion.`
    );
  } else if (confirmationRate >= 0.5) {
    parts.push(
      `User feedback calibration: this user has confirmed ~${Math.round(confirmationRate * 100)}% of AI emotion labels. Apply personalization adjustments (see below) but remain open to user corrections.`
    );
  } else {
    parts.push(
      `User feedback calibration: this user frequently corrects AI emotion labels. Apply personalization adjustments (see below) and be more conservative — lean toward neutral emotion labels unless the transcript is unambiguous.`
    );
  }

  // 2. Emotion label mappings (when user consistently re-labels something)
  const labelMappings = Object.entries(bias.emotionMappings) as [EmotionType, { valenceBias: number; arousalBias: number; labelBias: number }][];
  if (labelMappings.length > 0) {
    parts.push('Personalization adjustments based on this user\'s correction history:');
    labelMappings.forEach(([aiLabel, adjustment]) => {
      if (adjustment.labelBias < 0.3) {
        // Low confidence = user often corrects this label — reduce reliance on it
        parts.push(
          `- When detecting "${aiLabel}", be cautious — user frequently corrects this label. Verify with strong textual evidence before assigning.`
        );
      }
      if (adjustment.valenceBias > 15) {
        parts.push(`- User tends to rate "${aiLabel}" ~${Math.round(adjustment.valenceBias / 10)} points more pleasant than AI estimates.`);
      } else if (adjustment.valenceBias < -15) {
        parts.push(`- User tends to rate "${aiLabel}" ~${Math.round(Math.abs(adjustment.valenceBias) / 10)} points more unpleasant than AI estimates.`);
      }
      if (adjustment.arousalBias > 15) {
        parts.push(`- User tends to rate "${aiLabel}" ~${Math.round(adjustment.arousalBias / 10)} points more activated than AI estimates.`);
      } else if (adjustment.arousalBias < -15) {
        parts.push(`- User tends to rate "${aiLabel}" ~${Math.round(Math.abs(adjustment.arousalBias) / 10)} points more calm than AI estimates.`);
      }
    });
  }

  // 3. Strong patterns from repeated corrections
  const strongPatterns = bias.patterns.filter((p) => p.occurrences >= 5);
  if (strongPatterns.length > 0) {
    parts.push('Detected interpretation patterns:');
    strongPatterns.slice(0, 3).forEach((p) => {
      parts.push(
        `- User interprets "${p.aiLabel}" differently — treat as "${p.actualLabel}" for this user. Reason: user corrections show "${p.aiLabel}" maps to their lived experience of "${p.actualLabel}".`
      );
    });
  }

  // 4. ADHD/ADD considerations (if user has many short corrections with reason text mentioning "focus" or "distracted")
  const focusCorrections = bias.patterns.flatMap((p) =>
    p.userPhrases.filter((phrase) =>
      /focus|distract|hyper|impuls|attention|restless| fidget/i.test(phrase)
    )
  );
  if (focusCorrections.length >= 2) {
    parts.push(
      'ADHD/ADD note: User has mentioned focus or attention-related themes. When analyzing arousal and activation, be aware that elevated arousal in this user\'s journaling may reflect interest/excitement rather than anxiety — context matters more than intensity.'
    );
  }

  // 5. OCD considerations (if user corrections mention "not right" or "should be")
  const ocdCorrections = bias.patterns.flatMap((p) =>
    p.userPhrases.filter((phrase) =>
      /not right|should be|not quite|wrong label|off/i.test(phrase)
    )
  );
  if (ocdCorrections.length >= 2) {
    parts.push(
      'Note: User tends to be precise about emotion labels. When the transcript is nuanced or mixed, prefer simpler, more common emotion names over complex or borderline labels.'
    );
  }

  return `\n\n---\nPERSONALIZATION CONTEXT:\n${parts.join('\n')}\nNote: This context is based on user feedback and is not a clinical assessment. Always prioritize the user's direct input over inferred patterns.\n---`;
}

/**
 * Adjusts an AI emotion score using the user's personalized bias.
 * Returns the adjusted score (valence, arousal, or intensity).
 */
export function applyPersonalizationBias(
  rawScore: number,
  label: EmotionType
): number {
  const { getUserBias } = useEmotionCorrectionStore.getState();
  const bias = getUserBias();
  const mapping = bias.emotionMappings[label];

  if (!mapping) return rawScore;

  // If user has low confidence in this label, regress toward neutral
  const confidenceWeight = mapping.labelBias; // 0–1
  const neutral = 0; // neutral valence/arousal
  return Math.round(rawScore * confidenceWeight + neutral * (1 - confidenceWeight));
}

/**
 * Returns the most likely corrected emotion for a given AI label,
 * or the original if no strong pattern exists.
 */
export function getPersonalizedEmotionLabel(aiLabel: EmotionType): EmotionType {
  const { getCorrectionPatterns } = useEmotionCorrectionStore.getState();
  const patterns = getCorrectionPatterns();

  const strongMatch = patterns.find(
    (p) => p.aiLabel === aiLabel && p.occurrences >= 5
  );

  return strongMatch?.actualLabel ?? aiLabel;
}
