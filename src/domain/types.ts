export type PhonemeClassification = 'continuous' | 'stop';

export type MouthState =
  | 'open-wide'
  | 'lips-pressed'
  | 'teeth-hiss'
  | 'tongue-tap'
  | 'lip-pop'
  | 'lip-bite-air'
  | 'smile-short-i'
  | 'tongue-hum';

export interface ArticulatoryCue {
  mouthState: MouthState;
  kidPrompt: string;
}

export type CardType =
  | 'letter'
  | 'bubble-pop'
  | 'blending-word'
  | 'heart-word'
  | 'decodable-story'
  | 'milestone-blossom';

export interface BaseCardData {
  id: string;
  lessonNumber: number;
  type: CardType;
  title: string;
}

export interface LetterCardData extends BaseCardData {
  type: 'letter';
  grapheme: string; // e.g. "a", "m", "s", "t"
  uppercase: string; // e.g. "A"
  phoneme: string; // e.g. "ă", "m", "s", "t"
  phonemeClassification: PhonemeClassification;
  articulatoryCue: ArticulatoryCue;
  holdDurationMs?: number; // 1200ms default for continuous
  seedPodTapsRequired?: number; // 3 default for stop
}

export interface BubbleItem {
  id: string;
  label: string;
  phoneme: string;
  isTarget: boolean;
  type?: 'letter' | 'picture';
  accessibleDescription?: string;
}

export interface BubblePopCardData extends BaseCardData {
  type: 'bubble-pop';
  targetPhoneme: string;
  promptText?: string;
  bubbles: BubbleItem[];
  distractors: string[];
  targetCountRequired: number;
}

export interface BlendingWordCardData extends BaseCardData {
  type: 'blending-word';
  word: string;
  graphemes: string[];
  illustration?: string;
}

export interface HeartWordCardData extends BaseCardData {
  type: 'heart-word';
  word: string;
  parts: { grapheme: string; isHeart: boolean; phoneme: string }[];
}

export interface DecodableStoryCardData extends BaseCardData {
  type: 'decodable-story';
  sentence: string;
  words: string[];
}

export interface MilestoneBlossomCardData extends BaseCardData {
  type: 'milestone-blossom';
  critterName: string;
  blossomName: string;
}

export type GardenCard =
  | LetterCardData
  | BubblePopCardData
  | BlendingWordCardData
  | HeartWordCardData
  | DecodableStoryCardData
  | MilestoneBlossomCardData;

export interface GardenSessionState {
  cards: GardenCard[];
  frontierIndex: number;
  activeIndex: number;
  isCelebrationLocked: boolean;
  completedCardIds: string[];
  unlockedBlossoms: string[];
  unlockedCritters: string[];
}
