export interface AudioPort {
  playPhoneme(phoneme: string): void;
  startContinuousPhoneme(phoneme: string): void;
  stopContinuousPhoneme(): void;
  playWord(word: string): void;
  playPop(): void;
  playWaterDrop(): void;
  playWobbleHint(): void;
  playBloomFanfare(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}
