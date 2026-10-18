import { AudioPort } from './audioPort';

export interface AudioCallRecord {
  method: keyof AudioPort;
  args: any[];
  timestamp: number;
}

export class StubAudioPort implements AudioPort {
  private _muted = false;
  public calls: AudioCallRecord[] = [];

  public playedPhonemes: string[] = [];
  public continuousPhonemesStarted: string[] = [];
  public continuousPhonemesStoppedCount = 0;
  public playedWords: string[] = [];
  public popCount = 0;
  public waterDropCount = 0;
  public wobbleHintCount = 0;
  public bloomFanfareCount = 0;
  public chimeCount = 0;
  public speechRate = 0.85;

  private record(method: keyof AudioPort, ...args: any[]) {
    this.calls.push({ method, args, timestamp: Date.now() });
  }

  playPhoneme(phoneme: string): void {
    this.record('playPhoneme', phoneme);
    if (!this._muted) {
      this.playedPhonemes.push(phoneme);
    }
  }

  startContinuousPhoneme(phoneme: string): void {
    this.record('startContinuousPhoneme', phoneme);
    if (!this._muted) {
      this.continuousPhonemesStarted.push(phoneme);
    }
  }

  stopContinuousPhoneme(): void {
    this.record('stopContinuousPhoneme');
    if (!this._muted) {
      this.continuousPhonemesStoppedCount++;
    }
  }

  playWord(word: string): void {
    this.record('playWord', word);
    if (!this._muted) {
      this.playedWords.push(word);
    }
  }

  playPop(): void {
    this.record('playPop');
    if (!this._muted) {
      this.popCount++;
    }
  }

  playWaterDrop(): void {
    this.record('playWaterDrop');
    if (!this._muted) {
      this.waterDropCount++;
    }
  }

  playWobbleHint(): void {
    this.record('playWobbleHint');
    if (!this._muted) {
      this.wobbleHintCount++;
    }
  }

  playBloomFanfare(): void {
    this.record('playBloomFanfare');
    if (!this._muted) {
      this.bloomFanfareCount++;
    }
  }

  playChime(): void {
    this.record('playChime');
    if (!this._muted) {
      this.chimeCount++;
    }
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.record('setMuted', muted);
  }

  isMuted(): boolean {
    return this._muted;
  }

  setSpeechRate(rate: number): void {
    this.speechRate = rate;
    this.record('setSpeechRate' as any, rate);
  }

  getSpeechRate(): number {
    return this.speechRate;
  }

  reset(): void {
    this.calls = [];
    this.playedPhonemes = [];
    this.continuousPhonemesStarted = [];
    this.continuousPhonemesStoppedCount = 0;
    this.playedWords = [];
    this.popCount = 0;
    this.waterDropCount = 0;
    this.wobbleHintCount = 0;
    this.bloomFanfareCount = 0;
    this.chimeCount = 0;
    this.speechRate = 0.85;
    this._muted = false;
  }
}

export function createStubAudioPort(): StubAudioPort {
  return new StubAudioPort();
}
