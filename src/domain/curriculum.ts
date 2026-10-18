import {
  ArticulatoryCue,
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

export const INITIAL_CURRICULUM_CARDS: LetterCardData[] = [
  {
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
  {
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
  {
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
  {
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
];
