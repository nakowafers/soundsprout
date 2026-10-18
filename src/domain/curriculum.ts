import {
  ArticulatoryCue,
  LetterCardData,
  MilestoneBlossomCardData,
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

export interface MilestoneBlossomDef {
  lessonNumber: number;
  blossomName: string;
  critterName: string;
  blossomEmoji: string;
  critterEmoji: string;
  description: string;
}

export const MILESTONE_DEFINITIONS: MilestoneBlossomDef[] = [
  {
    lessonNumber: 4,
    blossomName: 'Sunburst Daisy',
    critterName: 'Ladybug Lou',
    blossomEmoji: '🌼',
    critterEmoji: '🐞',
    description: 'A radiant yellow daisy with Ladybug Lou!',
  },
  {
    lessonNumber: 5,
    blossomName: 'Dewdrop Tulip',
    critterName: 'Pip the Caterpillar',
    blossomEmoji: '🌷',
    critterEmoji: '🐛',
    description: 'A gentle pink tulip with Pip the Caterpillar!',
  },
  {
    lessonNumber: 8,
    blossomName: 'Berry Blossom',
    critterName: 'Sunny the Honeybee',
    blossomEmoji: '🌸',
    critterEmoji: '🐝',
    description: 'A sweet berry blossom with Sunny the Honeybee!',
  },
  {
    lessonNumber: 10,
    blossomName: 'Golden Sunflower',
    critterName: 'Flutter the Butterfly',
    blossomEmoji: '🌻',
    critterEmoji: '🦋',
    description: 'A majestic golden sunflower with Flutter the Butterfly!',
  },
];

export const INITIAL_CURRICULUM_CARDS = [
  {
    id: 'lesson-1-letter-a',
    lessonNumber: 1,
    type: 'letter' as const,
    title: 'Letter a',
    grapheme: 'a',
    uppercase: 'A',
    phoneme: 'ă',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('ă'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-2-letter-m',
    lessonNumber: 2,
    type: 'letter' as const,
    title: 'Letter m',
    grapheme: 'm',
    uppercase: 'M',
    phoneme: 'm',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('m'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-3-letter-s',
    lessonNumber: 3,
    type: 'letter' as const,
    title: 'Letter s',
    grapheme: 's',
    uppercase: 'S',
    phoneme: 's',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('s'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-4-letter-t',
    lessonNumber: 4,
    type: 'letter' as const,
    title: 'Letter t',
    grapheme: 't',
    uppercase: 'T',
    phoneme: 't',
    phonemeClassification: 'stop' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('t'),
    seedPodTapsRequired: 3,
  },
  {
    id: 'lesson-4-milestone',
    lessonNumber: 4,
    type: 'milestone-blossom' as const,
    title: 'Sunburst Daisy & Ladybug Lou',
    blossomName: 'Sunburst Daisy',
    critterName: 'Ladybug Lou',
  },
  {
    id: 'lesson-5-consolidation',
    lessonNumber: 5,
    type: 'letter' as const,
    title: 'Lesson 5 Review',
    grapheme: 'am',
    uppercase: 'AM',
    phoneme: 'ă',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('ă'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-5-milestone',
    lessonNumber: 5,
    type: 'milestone-blossom' as const,
    title: 'Dewdrop Tulip & Pip the Caterpillar',
    blossomName: 'Dewdrop Tulip',
    critterName: 'Pip the Caterpillar',
  },
  {
    id: 'lesson-6-letter-p',
    lessonNumber: 6,
    type: 'letter' as const,
    title: 'Letter p',
    grapheme: 'p',
    uppercase: 'P',
    phoneme: 'p',
    phonemeClassification: 'stop' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('p'),
    seedPodTapsRequired: 3,
  },
  {
    id: 'lesson-7-letter-f',
    lessonNumber: 7,
    type: 'letter' as const,
    title: 'Letter f',
    grapheme: 'f',
    uppercase: 'F',
    phoneme: 'f',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('f'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-8-letter-i',
    lessonNumber: 8,
    type: 'letter' as const,
    title: 'Letter i',
    grapheme: 'i',
    uppercase: 'I',
    phoneme: 'ĭ',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('ĭ'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-8-milestone',
    lessonNumber: 8,
    type: 'milestone-blossom' as const,
    title: 'Berry Blossom & Sunny the Honeybee',
    blossomName: 'Berry Blossom',
    critterName: 'Sunny the Honeybee',
  },
  {
    id: 'lesson-9-letter-n',
    lessonNumber: 9,
    type: 'letter' as const,
    title: 'Letter n',
    grapheme: 'n',
    uppercase: 'N',
    phoneme: 'n',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('n'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-10-consolidation',
    lessonNumber: 10,
    type: 'letter' as const,
    title: 'Lesson 10 Review',
    grapheme: 'in',
    uppercase: 'IN',
    phoneme: 'ĭ',
    phonemeClassification: 'continuous' as PhonemeClassification,
    articulatoryCue: getArticulatoryCue('ĭ'),
    holdDurationMs: 1200,
  },
  {
    id: 'lesson-10-milestone',
    lessonNumber: 10,
    type: 'milestone-blossom' as const,
    title: 'Golden Sunflower & Flutter the Butterfly',
    blossomName: 'Golden Sunflower',
    critterName: 'Flutter the Butterfly',
  },
] satisfies (LetterCardData | MilestoneBlossomCardData)[];

