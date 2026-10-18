import {
  ArticulatoryCue,
  BlendingWordCardData,
  GardenCard,
  LetterCardData,
  MouthState,
  PhonemeClassification,
} from './types';

export const CONTINUOUS_PHONEMES = new Set(['ă', 'm', 's', 'f', 'ĭ', 'n']);
export const STOP_PHONEMES = new Set(['t', 'p']);

export function getPhonemeClassification(phoneme: string): PhonemeClassification {
  const normalized = phoneme.replace(/[/]/g, '');
  if (STOP_PHONEMES.has(normalized)) {
    return 'stop';
  }
  if (CONTINUOUS_PHONEMES.has(normalized)) {
    return 'continuous';
  }
  // Default to continuous if unlisted or return continuous
  return 'continuous';
}

export function getGraphemePhoneme(grapheme: string): string {
  const g = grapheme.toLowerCase();
  if (g === 'a') return 'ă';
  if (g === 'i') return 'ĭ';
  return g;
}

export const ARTICULATORY_CUES: Record<string, ArticulatoryCue> = {
  ă: {
    mouthState: 'open-wide',
    kidPrompt: 'Open wide and let your voice flow: /ăăă/!',
  },
  m: {
    mouthState: 'lips-pressed',
    kidPrompt: 'Press your lips together and hum: /mmm/!',
  },
  s: {
    mouthState: 'teeth-hiss',
    kidPrompt: 'Gently close your teeth and hiss like a snake: /sss/!',
  },
  t: {
    mouthState: 'tongue-tap',
    kidPrompt: 'Tap the tip of your tongue behind your top teeth: /t/!',
  },
  p: {
    mouthState: 'lip-pop',
    kidPrompt: 'Pop your lips together with a burst of air: /p/!',
  },
  f: {
    mouthState: 'lip-bite-air',
    kidPrompt: 'Rest your top teeth on your bottom lip and blow: /fff/!',
  },
  ĭ: {
    mouthState: 'smile-short-i',
    kidPrompt: 'Make a little smile with your mouth open: /ĭĭĭ/!',
  },
  n: {
    mouthState: 'tongue-hum',
    kidPrompt: 'Press your tongue to the roof of your mouth and hum: /nnn/!',
  },
};

export function getArticulatoryCue(phoneme: string): ArticulatoryCue {
  const normalized = phoneme.replace(/[/]/g, '');
  return (
    ARTICULATORY_CUES[normalized] ?? {
      mouthState: 'open-wide' as MouthState,
      kidPrompt: `Make the /${normalized}/ sound!`,
    }
  );
}

export function createLetterCard(
  lessonNumber: number,
  grapheme: string,
  phoneme: string,
  classification: PhonemeClassification,
  options: {
    holdDurationMs?: number;
    seedPodTapsRequired?: number;
    uppercase?: string;
  } = {}
): LetterCardData {
  return {
    id: `lesson-${lessonNumber}-letter-${grapheme.toLowerCase()}`,
    lessonNumber,
    type: 'letter',
    title: `Letter ${grapheme}`,
    grapheme,
    uppercase: options.uppercase ?? grapheme.toUpperCase(),
    phoneme,
    phonemeClassification: classification,
    articulatoryCue: getArticulatoryCue(phoneme),
    holdDurationMs:
      classification === 'continuous' ? (options.holdDurationMs ?? 1200) : undefined,
    seedPodTapsRequired:
      classification === 'stop' ? (options.seedPodTapsRequired ?? 3) : undefined,
  };
}

export function createBlendingWordCard(
  lessonNumber: number,
  word: string,
  graphemes: string[],
  illustration?: string
): BlendingWordCardData {
  return {
    id: `lesson-${lessonNumber}-blend-${word.toLowerCase()}`,
    lessonNumber,
    type: 'blending-word',
    title: `Blend: ${word}`,
    word,
    graphemes,
    illustration,
  };
}

export const INITIAL_CURRICULUM_CARDS: GardenCard[] = [
  // Lesson 1: a /ă/ (Continuous — omits Blending Word cards)
  createLetterCard(1, 'a', 'ă', 'continuous'),

  // Lesson 2: m /m/ (Continuous — blends am)
  createLetterCard(2, 'm', 'm', 'continuous'),
  createBlendingWordCard(2, 'am', ['a', 'm'], '🌟'),

  // Lesson 3: s /s/ (Continuous — blends Sam, am)
  createLetterCard(3, 's', 's', 'continuous'),
  createBlendingWordCard(3, 'Sam', ['S', 'a', 'm'], '👦'),
  createBlendingWordCard(3, 'am', ['a', 'm'], '🌟'),

  // Lesson 4: t /t/ (Stop — blends at, sat, mat)
  createLetterCard(4, 't', 't', 'stop'),
  createBlendingWordCard(4, 'at', ['a', 't'], '📍'),
  createBlendingWordCard(4, 'sat', ['s', 'a', 't'], '🪑'),
  createBlendingWordCard(4, 'mat', ['m', 'a', 't'], '🧶'),

  // Lesson 5: VC/CVC Consolidation (a, m, s, t — omits Letter Card, multi-word blending)
  createBlendingWordCard(5, 'at', ['a', 't'], '📍'),
  createBlendingWordCard(5, 'am', ['a', 'm'], '🌟'),
  createBlendingWordCard(5, 'sat', ['s', 'a', 't'], '🪑'),
  createBlendingWordCard(5, 'mat', ['m', 'a', 't'], '🧶'),
  createBlendingWordCard(5, 'Sam', ['S', 'a', 'm'], '👦'),

  // Lesson 6: p /p/ (Stop — blends pat, tap, sap, map)
  createLetterCard(6, 'p', 'p', 'stop'),
  createBlendingWordCard(6, 'pat', ['p', 'a', 't'], '👋'),
  createBlendingWordCard(6, 'tap', ['t', 'a', 'p'], '🚰'),
  createBlendingWordCard(6, 'sap', ['s', 'a', 'p'], '🍁'),
  createBlendingWordCard(6, 'map', ['m', 'a', 'p'], '🗺️'),

  // Lesson 7: f /f/ (Continuous — blends fat)
  createLetterCard(7, 'f', 'f', 'continuous'),
  createBlendingWordCard(7, 'fat', ['f', 'a', 't'], '🐱'),

  // Lesson 8: i /ĭ/ (Continuous — blends it, sit, pit, fit, sip, tip)
  createLetterCard(8, 'i', 'ĭ', 'continuous'),
  createBlendingWordCard(8, 'it', ['i', 't'], '👉'),
  createBlendingWordCard(8, 'sit', ['s', 'i', 't'], '🪑'),
  createBlendingWordCard(8, 'pit', ['p', 'i', 't'], '🕳️'),
  createBlendingWordCard(8, 'fit', ['f', 'i', 't'], '🧩'),
  createBlendingWordCard(8, 'sip', ['s', 'i', 'p'], '🥤'),
  createBlendingWordCard(8, 'tip', ['t', 'i', 'p'], '💡'),

  // Lesson 9: n /n/ (Continuous — blends in, pin, tin, fin, nap, pan, tan, man, fan)
  createLetterCard(9, 'n', 'n', 'continuous'),
  createBlendingWordCard(9, 'in', ['i', 'n'], '📥'),
  createBlendingWordCard(9, 'pin', ['p', 'i', 'n'], '📌'),
  createBlendingWordCard(9, 'tin', ['t', 'i', 'n'], '🥫'),
  createBlendingWordCard(9, 'fin', ['f', 'i', 'n'], '🦈'),
  createBlendingWordCard(9, 'nap', ['n', 'a', 'p'], '😴'),
  createBlendingWordCard(9, 'pan', ['p', 'a', 'n'], '🍳'),
  createBlendingWordCard(9, 'tan', ['t', 'a', 'n'], '☀️'),
  createBlendingWordCard(9, 'man', ['m', 'a', 'n'], '👨'),
  createBlendingWordCard(9, 'fan', ['f', 'a', 'n'], '🪭'),

  // Lesson 10: CVC Consolidation (a, i with m, s, t, p, f, n — omits Letter Card, multi-word blending)
  createBlendingWordCard(10, 'fit', ['f', 'i', 't'], '🧩'),
  createBlendingWordCard(10, 'map', ['m', 'a', 'p'], '🗺️'),
  createBlendingWordCard(10, 'pin', ['p', 'i', 'n'], '📌'),
  createBlendingWordCard(10, 'tap', ['t', 'a', 'p'], '🚰'),
  createBlendingWordCard(10, 'sit', ['s', 'i', 't'], '🪑'),
  createBlendingWordCard(10, 'pan', ['p', 'a', 'n'], '🍳'),
  createBlendingWordCard(10, 'fan', ['f', 'a', 'n'], '🪭'),
  createBlendingWordCard(10, 'tin', ['t', 'i', 'n'], '🥫'),
  createBlendingWordCard(10, 'mat', ['m', 'a', 't'], '🧶'),
  createBlendingWordCard(10, 'pat', ['p', 'a', 't'], '👋'),
];
