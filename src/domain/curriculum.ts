import {
  ArticulatoryCue,
  BlendingWordCardData,
  GardenCard,
  HeartWordCardData,
  DecodableStoryCardData,
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

export function createHeartWordCard(
  lessonNumber: number,
  word: string,
  parts: { grapheme: string; isHeart: boolean; phoneme: string }[]
): HeartWordCardData {
  return {
    id: `lesson-${lessonNumber}-heart-${word.toLowerCase().replace(/[^a-z]/g, '')}`,
    lessonNumber,
    type: 'heart-word',
    title: `Heart Word: ${word}`,
    word,
    parts,
  };
}

export function createDecodableStoryCard(
  lessonNumber: number,
  sentence: string,
  words: string[]
): DecodableStoryCardData {
  const slug = sentence
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return {
    id: `lesson-${lessonNumber}-story-${slug}`,
    lessonNumber,
    type: 'decodable-story',
    title: `Story: ${sentence}`,
    sentence,
    words,
  };
}

export const INITIAL_CURRICULUM_CARDS: GardenCard[] = [
  // Lesson 1: a /ă/ (Continuous — omits Blending Word cards)
  createLetterCard(1, 'a', 'ă', 'continuous'),

  // Lesson 2: m /m/ (Continuous — blends am)
  createLetterCard(2, 'm', 'm', 'continuous'),
  createBlendingWordCard(2, 'am', ['a', 'm'], '🌟'),

  // Lesson 3: s /s/ (Continuous — blends Sam, am; Heart Word: I; Story: I am Sam.)
  createLetterCard(3, 's', 's', 'continuous'),
  createBlendingWordCard(3, 'Sam', ['S', 'a', 'm'], '👦'),
  createBlendingWordCard(3, 'am', ['a', 'm'], '🌟'),
  createHeartWordCard(3, 'I', [{ grapheme: 'I', isHeart: true, phoneme: 'ī' }]),
  createDecodableStoryCard(3, 'I am Sam.', ['I', 'am', 'Sam']),

  // Lesson 4: t /t/ (Stop — blends at, sat, mat; Heart Word: a; Story: Sam sat at a mat.)
  createLetterCard(4, 't', 't', 'stop'),
  createBlendingWordCard(4, 'at', ['a', 't'], '📍'),
  createBlendingWordCard(4, 'sat', ['s', 'a', 't'], '🪑'),
  createBlendingWordCard(4, 'mat', ['m', 'a', 't'], '🧶'),
  createHeartWordCard(4, 'a', [{ grapheme: 'a', isHeart: true, phoneme: 'uh' }]),
  createDecodableStoryCard(4, 'Sam sat at a mat.', ['Sam', 'sat', 'at', 'a', 'mat']),

  // Lesson 5: VC/CVC Consolidation (a, m, s, t — Heart Word: the; Story: Sam sat at the mat.)
  createHeartWordCard(5, 'the', [
    { grapheme: 'th', isHeart: false, phoneme: 'th' },
    { grapheme: 'e', isHeart: true, phoneme: 'uh' },
  ]),
  createBlendingWordCard(5, 'at', ['a', 't'], '📍'),
  createBlendingWordCard(5, 'am', ['a', 'm'], '🌟'),
  createBlendingWordCard(5, 'sat', ['s', 'a', 't'], '🪑'),
  createBlendingWordCard(5, 'mat', ['m', 'a', 't'], '🧶'),
  createBlendingWordCard(5, 'Sam', ['S', 'a', 'm'], '👦'),
  createDecodableStoryCard(5, 'Sam sat at the mat.', ['Sam', 'sat', 'at', 'the', 'mat']),

  // Lesson 6: p /p/ (Stop — blends pat, tap, sap, map; Story: Pat sat at a map.)
  createLetterCard(6, 'p', 'p', 'stop'),
  createBlendingWordCard(6, 'pat', ['p', 'a', 't'], '👋'),
  createBlendingWordCard(6, 'tap', ['t', 'a', 'p'], '🚰'),
  createBlendingWordCard(6, 'sap', ['s', 'a', 'p'], '🍁'),
  createBlendingWordCard(6, 'map', ['m', 'a', 'p'], '🗺️'),
  createDecodableStoryCard(6, 'Pat sat at a map.', ['Pat', 'sat', 'at', 'a', 'map']),

  // Lesson 7: f /f/ (Continuous — blends fat; Heart Word: to; Story: Sam sat at a fat mat.)
  createLetterCard(7, 'f', 'f', 'continuous'),
  createBlendingWordCard(7, 'fat', ['f', 'a', 't'], '🐱'),
  createHeartWordCard(7, 'to', [
    { grapheme: 't', isHeart: false, phoneme: 't' },
    { grapheme: 'o', isHeart: true, phoneme: 'oo' },
  ]),
  createDecodableStoryCard(7, 'Sam sat at a fat mat.', ['Sam', 'sat', 'at', 'a', 'fat', 'mat']),

  // Lesson 8: i /ĭ/ (Continuous — blends it, sit, pit, fit, sip, tip; Heart Word: is; Story: Sam is at the pit.)
  createLetterCard(8, 'i', 'ĭ', 'continuous'),
  createBlendingWordCard(8, 'it', ['i', 't'], '👉'),
  createBlendingWordCard(8, 'sit', ['s', 'i', 't'], '🪑'),
  createBlendingWordCard(8, 'pit', ['p', 'i', 't'], '🕳️'),
  createBlendingWordCard(8, 'fit', ['f', 'i', 't'], '🧩'),
  createBlendingWordCard(8, 'sip', ['s', 'i', 'p'], '🥤'),
  createBlendingWordCard(8, 'tip', ['t', 'i', 'p'], '💡'),
  createHeartWordCard(8, 'is', [
    { grapheme: 'i', isHeart: false, phoneme: 'ĭ' },
    { grapheme: 's', isHeart: true, phoneme: 'z' },
  ]),
  createDecodableStoryCard(8, 'Sam is at the pit.', ['Sam', 'is', 'at', 'the', 'pit']),

  // Lesson 9: n /n/ (Continuous — blends in, pin, tin, fin, nap, pan, tan, man, fan; Heart Word: said; Story: Pam sat in a tin pan.)
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
  createHeartWordCard(9, 'said', [
    { grapheme: 's', isHeart: false, phoneme: 's' },
    { grapheme: 'ai', isHeart: true, phoneme: 'ĕ' },
    { grapheme: 'd', isHeart: false, phoneme: 'd' },
  ]),
  createDecodableStoryCard(9, 'Pam sat in a tin pan.', ['Pam', 'sat', 'in', 'a', 'tin', 'pan']),

  // Lesson 10: CVC Consolidation (a, i with m, s, t, p, f, n — omits Letter Card; Story: I said it is a fan.)
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
  createDecodableStoryCard(10, 'I said it is a fan.', ['I', 'said', 'it', 'is', 'a', 'fan']),
];
