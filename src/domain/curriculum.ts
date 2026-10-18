import {
  ArticulatoryCue,
  BubblePopCardData,
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

export const LETTER_CARDS: Record<number, LetterCardData> = {
  1: {
    id: 'lesson-1-letter-a',
    lessonNumber: 1,
    type: 'letter',
    title: 'Letter a',
    grapheme: 'a',
    uppercase: 'A',
    phoneme: 'ă',
    phonemeClassification: 'continuous',
    articulatoryCue: getArticulatoryCue('ă'),
    holdDurationMs: 1200,
  },
  2: {
    id: 'lesson-2-letter-m',
    lessonNumber: 2,
    type: 'letter',
    title: 'Letter m',
    grapheme: 'm',
    uppercase: 'M',
    phoneme: 'm',
    phonemeClassification: 'continuous',
    articulatoryCue: getArticulatoryCue('m'),
    holdDurationMs: 1200,
  },
  3: {
    id: 'lesson-3-letter-s',
    lessonNumber: 3,
    type: 'letter',
    title: 'Letter s',
    grapheme: 's',
    uppercase: 'S',
    phoneme: 's',
    phonemeClassification: 'continuous',
    articulatoryCue: getArticulatoryCue('s'),
    holdDurationMs: 1200,
  },
  4: {
    id: 'lesson-4-letter-t',
    lessonNumber: 4,
    type: 'letter',
    title: 'Letter t',
    grapheme: 't',
    uppercase: 'T',
    phoneme: 't',
    phonemeClassification: 'stop',
    articulatoryCue: getArticulatoryCue('t'),
    seedPodTapsRequired: 3,
  },
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
  return cards;
}

export const INITIAL_CURRICULUM_CARDS: GardenCard[] = [
  ...generateLessonCycle(1),
  ...generateLessonCycle(2),
  ...generateLessonCycle(3),
  ...generateLessonCycle(4),
];
