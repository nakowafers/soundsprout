import { AudioPort } from './audioPort';
import { normalizePhoneme } from '../domain/curriculum';

export class WebAudioPort implements AudioPort {
  private ctx: AudioContext | null = null;
  private _muted = false;
  private speechRate = 0.85;
  private continuousSource: {
    stop: () => void;
  } | null = null;

  private getContext(): AudioContext | null {
    if (this._muted) return null;
    if (typeof window === 'undefined') return null;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!this.ctx) {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (muted) {
      this.stopContinuousPhoneme();
    }
  }

  isMuted(): boolean {
    return this._muted;
  }

  setSpeechRate(rate: number): void {
    this.speechRate = rate;
  }

  getSpeechRate(): number {
    return this.speechRate;
  }

  playPop(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playWaterDrop(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playWobbleHint(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(210, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playBloomFanfare(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Pentatonic scale arpeggio: C5, E5, G5, A5, C6
    const freqs = [523.25, 659.25, 783.99, 880.0, 1046.5];
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  playChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Joyful sparkling bell chime: high pleasant notes E6, G6, B6, E7
    const freqs = [1318.51, 1567.98, 1975.53, 2637.02];
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  playPhoneme(phoneme: string): void {
    if (this._muted) return;
    const normalized = normalizePhoneme(phoneme);

    // Plosive Stop Consonants (/t/, /p/) synthesized crisply without schwa
    if (normalized === 't') {
      this.playCrispStopT();
      return;
    }
    if (normalized === 'p') {
      this.playCrispStopP();
      return;
    }

    // Default phoneme playback via Web Speech or Formant
    this.speakCalibratedPhoneme(normalized);
  }

  private playCrispStopT(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Unvoiced alveolar plosive: 35ms burst of filtered noise (>3.5kHz) + transient click
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.035);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3800, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.035);
  }

  private playCrispStopP(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.03);
  }

  startContinuousPhoneme(phoneme: string): void {
    if (this._muted) return;
    this.stopContinuousPhoneme();

    const ctx = this.getContext();
    if (!ctx) return;

    const normalized = normalizePhoneme(phoneme);
    const now = ctx.currentTime;

    if (normalized === 's') {
      // Sustained gentle high-pass noise for /sss/
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(5500, now);
      filter.Q.setValueAtTime(1.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      this.continuousSource = {
        stop: () => {
          try {
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            noise.stop(ctx.currentTime + 0.05);
          } catch {
            // Ignore
          }
        },
      };
    } else if (normalized === 'f') {
      // Sustained unvoiced labiodental fricative noise for /fff/ (soft bandpass-filtered noise around 1800–2500Hz)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2100, now);
      filter.Q.setValueAtTime(1.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      this.continuousSource = {
        stop: () => {
          try {
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            noise.stop(ctx.currentTime + 0.05);
          } catch {
            // Ignore
          }
        },
      };
    } else if (normalized === 'm' || normalized === 'n') {
      // Resonant hum for /mmm/ or /nnn/
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(normalized === 'm' ? 180 : 220, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      this.continuousSource = {
        stop: () => {
          try {
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.stop(ctx.currentTime + 0.05);
          } catch {
            // Ignore
          }
        },
      };
    } else {
      // Vowel /ă/, /ĭ/ formant synthesis
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(750, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      this.continuousSource = {
        stop: () => {
          try {
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc1.stop(ctx.currentTime + 0.05);
            osc2.stop(ctx.currentTime + 0.05);
          } catch {
            // Ignore
          }
        },
      };
    }
  }

  stopContinuousPhoneme(): void {
    if (this.continuousSource) {
      this.continuousSource.stop();
      this.continuousSource = null;
    }
  }

  playWord(word: string): void {
    if (this._muted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = this.speechRate;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }

  private speakCalibratedPhoneme(phoneme: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const spokenText = phoneme === 'ă' ? 'a' : phoneme;
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = this.speechRate;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  }
}
