import {
  ArticulatoryCue,
  BlendingWordCardData,
  BubblePopCardData,
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

export const LETTER_CARDS: Record<number, LetterCardData> = {
  1: createLetterCard(1, 'a', 'ă', 'continuous'),
  2: createLetterCard(2, 'm', 'm', 'continuous'),
  3: createLetterCard(3, 's', 's', 'continuous'),
  4: createLetterCard(4, 't', 't', 'stop'),
  6: createLetterCard(6, 'p', 'p', 'stop'),
  7: createLetterCard(7, 'f', 'f', 'continuous'),
  8: createLetterCard(8, 'i', 'ĭ', 'continuous'),
  9: createLetterCard(9, 'n', 'n', 'continuous'),
};

export const BUBBLE_POP_CARDS: Record<number, BubblePopCardData> = {
  1: {
    id: 'lesson-1-bubble-pop-a',
    lessonNumber: 1,
    type: 'bubble-pop',
    title: 'Bubble Pop: /ă/',
    targetPhoneme: 'ă',
    promptText: 'Pop 3 bubbles that make the /ă/ sound!',
    targetCountRequired: 3,
    distractors: ['s', 'm', 's'],
    bubbles: [
      { id: 'l1-b-a-letter', label: 'a', phoneme: 'ă', isTarget: true, type: 'letter' },
      { id: 'l1-b-apple', label: '🍎', phoneme: 'ă', isTarget: true, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l1-b-ant', label: '🐜', phoneme: 'ă', isTarget: true, type: 'picture', accessibleDescription: 'ant' },
      { id: 'l1-b-sun', label: '☀️', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'sun' },
      { id: 'l1-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l1-b-star', label: '⭐', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'star' },
    ],
  },
  2: {
    id: 'lesson-2-bubble-pop-m',
    lessonNumber: 2,
    type: 'bubble-pop',
    title: 'Bubble Pop: /m/',
    targetPhoneme: 'm',
    promptText: 'Pop 3 bubbles that make the /m/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 's', 't'],
    bubbles: [
      { id: 'l2-b-m-letter', label: 'm', phoneme: 'm', isTarget: true, type: 'letter' },
      { id: 'l2-b-moon', label: '🌙', phoneme: 'm', isTarget: true, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l2-b-monkey', label: '🐵', phoneme: 'm', isTarget: true, type: 'picture', accessibleDescription: 'monkey' },
      { id: 'l2-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l2-b-sun', label: '☀️', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'sun' },
      { id: 'l2-b-turtle', label: '🐢', phoneme: 't', isTarget: false, type: 'picture', accessibleDescription: 'turtle' },
    ],
  },
  3: {
    id: 'lesson-3-bubble-pop-s',
    lessonNumber: 3,
    type: 'bubble-pop',
    title: 'Bubble Pop: /s/',
    targetPhoneme: 's',
    promptText: 'Pop 3 bubbles that make the /s/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 'm', 't'],
    bubbles: [
      { id: 'l3-b-s-letter', label: 's', phoneme: 's', isTarget: true, type: 'letter' },
      { id: 'l3-b-sun', label: '☀️', phoneme: 's', isTarget: true, type: 'picture', accessibleDescription: 'sun' },
      { id: 'l3-b-snake', label: '🐍', phoneme: 's', isTarget: true, type: 'picture', accessibleDescription: 'snake' },
      { id: 'l3-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l3-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l3-b-tiger', label: '🐯', phoneme: 't', isTarget: false, type: 'picture', accessibleDescription: 'tiger' },
    ],
  },
  4: {
    id: 'lesson-4-bubble-pop-t',
    lessonNumber: 4,
    type: 'bubble-pop',
    title: 'Bubble Pop: /t/',
    targetPhoneme: 't',
    promptText: 'Pop 3 bubbles that make the /t/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 'm', 's'],
    bubbles: [
      { id: 'l4-b-t-letter', label: 't', phoneme: 't', isTarget: true, type: 'letter' },
      { id: 'l4-b-tiger', label: '🐯', phoneme: 't', isTarget: true, type: 'picture', accessibleDescription: 'tiger' },
      { id: 'l4-b-turtle', label: '🐢', phoneme: 't', isTarget: true, type: 'picture', accessibleDescription: 'turtle' },
      { id: 'l4-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l4-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l4-b-sun', label: '☀️', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'sun' },
    ],
  },
  5: {
    id: 'lesson-5-bubble-pop-review',
    lessonNumber: 5,
    type: 'bubble-pop',
    title: 'Bubble Pop: Review /ă/',
    targetPhoneme: 'ă',
    promptText: 'Pop 3 bubbles that make the /ă/ sound!',
    targetCountRequired: 3,
    distractors: ['m', 's', 't'],
    bubbles: [
      { id: 'l5-b-a-letter', label: 'a', phoneme: 'ă', isTarget: true, type: 'letter' },
      { id: 'l5-b-apple', label: '🍎', phoneme: 'ă', isTarget: true, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l5-b-ant', label: '🐜', phoneme: 'ă', isTarget: true, type: 'picture', accessibleDescription: 'ant' },
      { id: 'l5-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l5-b-sun', label: '☀️', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'sun' },
      { id: 'l5-b-turtle', label: '🐢', phoneme: 't', isTarget: false, type: 'picture', accessibleDescription: 'turtle' },
    ],
  },
  6: {
    id: 'lesson-6-bubble-pop-p',
    lessonNumber: 6,
    type: 'bubble-pop',
    title: 'Bubble Pop: /p/',
    targetPhoneme: 'p',
    promptText: 'Pop 3 bubbles that make the /p/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 'm', 's'],
    bubbles: [
      { id: 'l6-b-p-letter', label: 'p', phoneme: 'p', isTarget: true, type: 'letter' },
      { id: 'l6-b-pig', label: '🐷', phoneme: 'p', isTarget: true, type: 'picture', accessibleDescription: 'pig' },
      { id: 'l6-b-pan', label: '🍳', phoneme: 'p', isTarget: true, type: 'picture', accessibleDescription: 'pan' },
      { id: 'l6-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l6-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l6-b-sun', label: '☀️', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'sun' },
    ],
  },
  7: {
    id: 'lesson-7-bubble-pop-f',
    lessonNumber: 7,
    type: 'bubble-pop',
    title: 'Bubble Pop: /f/',
    targetPhoneme: 'f',
    promptText: 'Pop 3 bubbles that make the /f/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 't', 'p'],
    bubbles: [
      { id: 'l7-b-f-letter', label: 'f', phoneme: 'f', isTarget: true, type: 'letter' },
      { id: 'l7-b-fish', label: '🐟', phoneme: 'f', isTarget: true, type: 'picture', accessibleDescription: 'fish' },
      { id: 'l7-b-frog', label: '🐸', phoneme: 'f', isTarget: true, type: 'picture', accessibleDescription: 'frog' },
      { id: 'l7-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l7-b-turtle', label: '🐢', phoneme: 't', isTarget: false, type: 'picture', accessibleDescription: 'turtle' },
      { id: 'l7-b-pig', label: '🐷', phoneme: 'p', isTarget: false, type: 'picture', accessibleDescription: 'pig' },
    ],
  },
  8: {
    id: 'lesson-8-bubble-pop-i',
    lessonNumber: 8,
    type: 'bubble-pop',
    title: 'Bubble Pop: /ĭ/',
    targetPhoneme: 'ĭ',
    promptText: 'Pop 3 bubbles that make the /ĭ/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 'm', 's'],
    bubbles: [
      { id: 'l8-b-i-letter', label: 'i', phoneme: 'ĭ', isTarget: true, type: 'letter' },
      { id: 'l8-b-igloo', label: '🏔️', phoneme: 'ĭ', isTarget: true, type: 'picture', accessibleDescription: 'igloo' },
      { id: 'l8-b-iguana', label: '🦎', phoneme: 'ĭ', isTarget: true, type: 'picture', accessibleDescription: 'iguana' },
      { id: 'l8-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l8-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l8-b-sun', label: '☀️', phoneme: 's', isTarget: false, type: 'picture', accessibleDescription: 'sun' },
    ],
  },
  9: {
    id: 'lesson-9-bubble-pop-n',
    lessonNumber: 9,
    type: 'bubble-pop',
    title: 'Bubble Pop: /n/',
    targetPhoneme: 'n',
    promptText: 'Pop 3 bubbles that make the /n/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 't', 'p'],
    bubbles: [
      { id: 'l9-b-n-letter', label: 'n', phoneme: 'n', isTarget: true, type: 'letter' },
      { id: 'l9-b-nest', label: '🪺', phoneme: 'n', isTarget: true, type: 'picture', accessibleDescription: 'nest' },
      { id: 'l9-b-nut', label: '🥜', phoneme: 'n', isTarget: true, type: 'picture', accessibleDescription: 'nut' },
      { id: 'l9-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l9-b-turtle', label: '🐢', phoneme: 't', isTarget: false, type: 'picture', accessibleDescription: 'turtle' },
      { id: 'l9-b-pig', label: '🐷', phoneme: 'p', isTarget: false, type: 'picture', accessibleDescription: 'pig' },
    ],
  },
  10: {
    id: 'lesson-10-bubble-pop-review',
    lessonNumber: 10,
    type: 'bubble-pop',
    title: 'Bubble Pop: Review /ĭ/',
    targetPhoneme: 'ĭ',
    promptText: 'Pop 3 bubbles that make the /ĭ/ sound!',
    targetCountRequired: 3,
    distractors: ['ă', 'm', 'n'],
    bubbles: [
      { id: 'l10-b-i-letter', label: 'i', phoneme: 'ĭ', isTarget: true, type: 'letter' },
      { id: 'l10-b-igloo', label: '🏔️', phoneme: 'ĭ', isTarget: true, type: 'picture', accessibleDescription: 'igloo' },
      { id: 'l10-b-iguana', label: '🦎', phoneme: 'ĭ', isTarget: true, type: 'picture', accessibleDescription: 'iguana' },
      { id: 'l10-b-apple', label: '🍎', phoneme: 'ă', isTarget: false, type: 'picture', accessibleDescription: 'apple' },
      { id: 'l10-b-moon', label: '🌙', phoneme: 'm', isTarget: false, type: 'picture', accessibleDescription: 'moon' },
      { id: 'l10-b-nest', label: '🪺', phoneme: 'n', isTarget: false, type: 'picture', accessibleDescription: 'nest' },
    ],
  },
};

export const BLENDING_WORD_CARDS: Record<number, BlendingWordCardData[]> = {
  1: [],
  2: [
    createBlendingWordCard(2, 'am', ['a', 'm'], '🌟'),
  ],
  3: [
    createBlendingWordCard(3, 'Sam', ['S', 'a', 'm'], '👦'),
    createBlendingWordCard(3, 'am', ['a', 'm'], '🌟'),
  ],
  4: [
    createBlendingWordCard(4, 'at', ['a', 't'], '📍'),
    createBlendingWordCard(4, 'sat', ['s', 'a', 't'], '🪑'),
    createBlendingWordCard(4, 'mat', ['m', 'a', 't'], '🧶'),
  ],
  5: [
    createBlendingWordCard(5, 'at', ['a', 't'], '📍'),
    createBlendingWordCard(5, 'am', ['a', 'm'], '🌟'),
    createBlendingWordCard(5, 'sat', ['s', 'a', 't'], '🪑'),
    createBlendingWordCard(5, 'mat', ['m', 'a', 't'], '🧶'),
    createBlendingWordCard(5, 'Sam', ['S', 'a', 'm'], '👦'),
  ],
  6: [
    createBlendingWordCard(6, 'pat', ['p', 'a', 't'], '👋'),
    createBlendingWordCard(6, 'tap', ['t', 'a', 'p'], '🚰'),
    createBlendingWordCard(6, 'sap', ['s', 'a', 'p'], '🍁'),
    createBlendingWordCard(6, 'map', ['m', 'a', 'p'], '🗺️'),
  ],
  7: [
    createBlendingWordCard(7, 'fat', ['f', 'a', 't'], '🐱'),
  ],
  8: [
    createBlendingWordCard(8, 'it', ['i', 't'], '👉'),
    createBlendingWordCard(8, 'sit', ['s', 'i', 't'], '🪑'),
    createBlendingWordCard(8, 'pit', ['p', 'i', 't'], '🕳️'),
    createBlendingWordCard(8, 'fit', ['f', 'i', 't'], '🧩'),
    createBlendingWordCard(8, 'sip', ['s', 'i', 'p'], '🥤'),
    createBlendingWordCard(8, 'tip', ['t', 'i', 'p'], '💡'),
  ],
  9: [
    createBlendingWordCard(9, 'in', ['i', 'n'], '📥'),
    createBlendingWordCard(9, 'pin', ['p', 'i', 'n'], '📌'),
    createBlendingWordCard(9, 'tin', ['t', 'i', 'n'], '🥫'),
    createBlendingWordCard(9, 'fin', ['f', 'i', 'n'], '🦈'),
    createBlendingWordCard(9, 'nap', ['n', 'a', 'p'], '😴'),
    createBlendingWordCard(9, 'pan', ['p', 'a', 'n'], '🍳'),
    createBlendingWordCard(9, 'tan', ['t', 'a', 'n'], '☀️'),
    createBlendingWordCard(9, 'man', ['m', 'a', 'n'], '👨'),
    createBlendingWordCard(9, 'fan', ['f', 'a', 'n'], '🪭'),
  ],
  10: [
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
  ],
};

export const HEART_WORD_CARDS: Record<number, HeartWordCardData> = {
  3: createHeartWordCard(3, 'I', [{ grapheme: 'I', isHeart: true, phoneme: 'ī' }]),
  4: createHeartWordCard(4, 'a', [{ grapheme: 'a', isHeart: true, phoneme: 'uh' }]),
  5: createHeartWordCard(5, 'the', [
    { grapheme: 'th', isHeart: false, phoneme: 'th' },
    { grapheme: 'e', isHeart: true, phoneme: 'uh' },
  ]),
  7: createHeartWordCard(7, 'to', [
    { grapheme: 't', isHeart: false, phoneme: 't' },
    { grapheme: 'o', isHeart: true, phoneme: 'oo' },
  ]),
  8: createHeartWordCard(8, 'is', [
    { grapheme: 'i', isHeart: false, phoneme: 'ĭ' },
    { grapheme: 's', isHeart: true, phoneme: 'z' },
  ]),
  9: createHeartWordCard(9, 'said', [
    { grapheme: 's', isHeart: false, phoneme: 's' },
    { grapheme: 'ai', isHeart: true, phoneme: 'ĕ' },
    { grapheme: 'd', isHeart: false, phoneme: 'd' },
  ]),
};

export const DECODABLE_STORY_CARDS: Record<number, DecodableStoryCardData> = {
  3: createDecodableStoryCard(3, 'I am Sam.', ['I', 'am', 'Sam']),
  4: createDecodableStoryCard(4, 'Sam sat at a mat.', ['Sam', 'sat', 'at', 'a', 'mat']),
  5: createDecodableStoryCard(5, 'Sam sat at the mat.', ['Sam', 'sat', 'at', 'the', 'mat']),
  6: createDecodableStoryCard(6, 'Pat sat at a map.', ['Pat', 'sat', 'at', 'a', 'map']),
  7: createDecodableStoryCard(7, 'Sam sat at a fat mat.', ['Sam', 'sat', 'at', 'a', 'fat', 'mat']),
  8: createDecodableStoryCard(8, 'Sam is at the pit.', ['Sam', 'is', 'at', 'the', 'pit']),
  9: createDecodableStoryCard(9, 'Pam sat in a tin pan.', ['Pam', 'sat', 'in', 'a', 'tin', 'pan']),
  10: createDecodableStoryCard(10, 'I said it is a fan.', ['I', 'said', 'it', 'is', 'a', 'fan']),
};

export function generateLessonCycle(lessonNumber: number): GardenCard[] {
  const cards: GardenCard[] = [];
  const letterCard = LETTER_CARDS[lessonNumber];
  if (letterCard) {
    cards.push(letterCard);
  }
  const bubbleCard = BUBBLE_POP_CARDS[lessonNumber];
  if (bubbleCard) {
    cards.push(bubbleCard);
  }
  const blendingCards = BLENDING_WORD_CARDS[lessonNumber];
  if (blendingCards) {
    cards.push(...blendingCards);
  }
  const heartCard = HEART_WORD_CARDS[lessonNumber];
  if (heartCard) {
    cards.push(heartCard);
  }
  const storyCard = DECODABLE_STORY_CARDS[lessonNumber];
  if (storyCard) {
    cards.push(storyCard);
  }
  return cards;
}

export const INITIAL_CURRICULUM_CARDS: GardenCard[] = [
  ...generateLessonCycle(1),
  ...generateLessonCycle(2),
  ...generateLessonCycle(3),
  ...generateLessonCycle(4),
  ...generateLessonCycle(5),
  ...generateLessonCycle(6),
  ...generateLessonCycle(7),
  ...generateLessonCycle(8),
  ...generateLessonCycle(9),
  ...generateLessonCycle(10),
];
