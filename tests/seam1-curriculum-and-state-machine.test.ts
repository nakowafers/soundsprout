import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPhonemeClassification,
  getArticulatoryCue,
  INITIAL_CURRICULUM_CARDS,
  createGardenStateMachine,
} from '../src/domain';

describe('Seam 1 — Pure UFLI Curriculum & Garden State Machine Seam', () => {
  describe('Phoneme Classification Invariants', () => {
    it('classifies /ă/, /m/, /s/, /f/, /ĭ/, /n/ as Continuous Phonemes', () => {
      const continuousPhonemes = ['ă', 'm', 's', 'f', 'ĭ', 'n'];
      for (const p of continuousPhonemes) {
        expect(getPhonemeClassification(p)).toBe('continuous');
      }
    });

    it('classifies /t/, /p/ as Stop Phonemes', () => {
      const stopPhonemes = ['t', 'p'];
      for (const p of stopPhonemes) {
        expect(getPhonemeClassification(p)).toBe('stop');
      }
    });

    it('provides articulatory cues for UFLI Lessons 1–4 phonemes', () => {
      expect(getArticulatoryCue('ă')).toEqual({
        mouthState: 'open-wide',
        kidPrompt: 'Open wide and let your voice flow: /ăăă/!',
      });
      expect(getArticulatoryCue('m')).toEqual({
        mouthState: 'lips-pressed',
        kidPrompt: 'Press your lips together and hum: /mmm/!',
      });
      expect(getArticulatoryCue('s')).toEqual({
        mouthState: 'teeth-hiss',
        kidPrompt: 'Gently close your teeth and hiss like a snake: /sss/!',
      });
      expect(getArticulatoryCue('t')).toEqual({
        mouthState: 'tongue-tap',
        kidPrompt: 'Tap the tip of your tongue behind your top teeth: /t/!',
      });
    });
  });

  describe('Garden Vine & Vine Frontier State Machine Invariants', () => {
    it('initializes with activeIndex and frontierIndex at 0', () => {
      const machine = createGardenStateMachine();
      const state = machine.getState();

      expect(state.frontierIndex).toBe(0);
      expect(state.activeIndex).toBe(0);
      expect(state.isCelebrationLocked).toBe(false);
      expect(state.cards.length).toBeGreaterThanOrEqual(4);
      expect(state.cards[0].id).toBe('lesson-1-letter-a');
    });

    it('clamps downward navigation beyond frontierIndex and signals clamped bounce', () => {
      const machine = createGardenStateMachine();
      // Try to scroll to card 1 while frontier is 0
      const result = machine.scrollTo(1);

      expect(result.clamped).toBe(true);
      expect(result.index).toBe(0);
      expect(machine.getState().activeIndex).toBe(0);
    });

    it('completing card at frontierIndex triggers celebration lock, then advances after completion', () => {
      const machine = createGardenStateMachine();
      const firstCardId = machine.getState().cards[0].id;

      const completeResult = machine.completeActiveCard();
      expect(completeResult.isAutoAdvancing).toBe(true);
      expect(completeResult.isEncore).toBe(false);

      let state = machine.getState();
      expect(state.isCelebrationLocked).toBe(true);
      expect(state.completedCardIds).toContain(firstCardId);
      // During celebration window, frontier and active indices have not advanced yet
      expect(state.frontierIndex).toBe(0);
      expect(state.activeIndex).toBe(0);

      // Subsequent actions while celebration is locked are ignored
      const secondAttempt = machine.completeActiveCard();
      expect(secondAttempt.isAutoAdvancing).toBe(false);
      const scrollAttempt = machine.scrollTo(1);
      expect(scrollAttempt.clamped).toBe(true);

      // Finish celebration (which happens after 2000ms timer in the app)
      machine.finishCelebration();
      state = machine.getState();

      expect(state.isCelebrationLocked).toBe(false);
      expect(state.frontierIndex).toBe(1);
      expect(state.activeIndex).toBe(1);
    });

    it('allows upward scrolling and replaying completed cards in-place without locking or advancing', () => {
      const machine = createGardenStateMachine();
      // Complete card 0
      machine.completeActiveCard();
      machine.finishCelebration();

      expect(machine.getState().frontierIndex).toBe(1);
      expect(machine.getState().activeIndex).toBe(1);

      // Scroll upward to card 0
      const scrollResult = machine.scrollTo(0);
      expect(scrollResult.clamped).toBe(false);
      expect(scrollResult.index).toBe(0);
      expect(machine.getState().activeIndex).toBe(0);

      // Replay completed card 0
      const replayResult = machine.completeActiveCard();
      expect(replayResult.isAutoAdvancing).toBe(false);
      expect(replayResult.isEncore).toBe(true);

      const state = machine.getState();
      expect(state.isCelebrationLocked).toBe(false);
      expect(state.frontierIndex).toBe(1);
      expect(state.activeIndex).toBe(0);
    });

    it('returns to frontier from earlier completed cards', () => {
      const machine = createGardenStateMachine();
      // Complete card 0
      machine.completeActiveCard();
      machine.finishCelebration();
      expect(machine.getState().frontierIndex).toBe(1);

      // Scroll back to card 0
      machine.scrollTo(0);
      expect(machine.getState().activeIndex).toBe(0);

      // Return to frontier
      machine.returnToFrontier();
      expect(machine.getState().activeIndex).toBe(1);
    });

    it('persists progress to localStorage and hydrates successfully', () => {
      const mockStorage: Record<string, string> = {};
      const storageAdapter = {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        clear: () => {
          for (const key of Object.keys(mockStorage)) delete mockStorage[key];
        },
        length: 0,
        key: () => null,
      };

      const machine1 = createGardenStateMachine({ storage: storageAdapter });
      machine1.completeActiveCard();
      machine1.finishCelebration();

      expect(machine1.getState().frontierIndex).toBe(1);

      // Initialize a new state machine with the same storage
      const machine2 = createGardenStateMachine({ storage: storageAdapter });
      expect(machine2.getState().frontierIndex).toBe(1);
      expect(machine2.getState().activeIndex).toBe(1);
      expect(machine2.getState().completedCardIds).toContain('lesson-1-letter-a');
    });

    it('notifies subscribers on state transitions', () => {
      const machine = createGardenStateMachine();
      const listener = vi.fn();
      const unsubscribe = machine.subscribe(listener);

      machine.completeActiveCard();
      expect(listener).toHaveBeenCalled();

      const callCount = listener.mock.calls.length;
      unsubscribe();
      machine.finishCelebration();
      expect(listener.mock.calls.length).toBe(callCount);
    });
  });
});
