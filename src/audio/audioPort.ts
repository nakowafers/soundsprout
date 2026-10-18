export interface AudioPort {
  playPhoneme(phoneme: string): void;
  startContinuousPhoneme(phoneme: string): void;
  stopContinuousPhoneme(): void;
  playWord(word: string): void;
  playPop(): void;
  playWaterDrop(): void;
  playWobbleHint(): void;
  playBloomFanfare(): void;
  playChime(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  setSpeechRate?(rate: number): void;
  getSpeechRate?(): number;
}
