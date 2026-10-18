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

    it('provides articulatory cues for UFLI Lessons 6–9 phonemes (/p/, /f/, /ĭ/, /n/)', () => {
      expect(getArticulatoryCue('p')).toEqual({
        mouthState: 'lip-pop',
        kidPrompt: 'Pop your lips together with a burst of air: /p/!',
      });
      expect(getArticulatoryCue('f')).toEqual({
        mouthState: 'lip-bite-air',
        kidPrompt: 'Rest your top teeth on your bottom lip and blow: /fff/!',
      });
      expect(getArticulatoryCue('ĭ')).toEqual({
        mouthState: 'smile-short-i',
        kidPrompt: 'Make a little smile with your mouth open: /ĭĭĭ/!',
      });
      expect(getArticulatoryCue('n')).toEqual({
        mouthState: 'tongue-hum',
        kidPrompt: 'Press your tongue to the roof of your mouth and hum: /nnn/!',
      });
    });
  });

  describe('UFLI Lessons 1–10 Cumulative Decodability & Card Generation Invariants (ADR-0003)', () => {
    it('covers all Lessons 1 through 10 in the initial curriculum', () => {
      const lessonNumbers = new Set(INITIAL_CURRICULUM_CARDS.map((c) => c.lessonNumber));
      for (let i = 1; i <= 10; i++) {
        expect(lessonNumbers.has(i)).toBe(true);
      }
    });

    it('ensures Lesson 1 omits Blending Word cards because zero consonants are taught yet', () => {
      const lesson1Cards = INITIAL_CURRICULUM_CARDS.filter((c) => c.lessonNumber === 1);
      const blendingCards = lesson1Cards.filter((c) => c.type === 'blending-word');
      expect(blendingCards).toHaveLength(0);

      const letterCards = lesson1Cards.filter((c) => c.type === 'letter');
      expect(letterCards).toHaveLength(1);
      expect((letterCards[0] as any).grapheme).toBe('a');
      expect((letterCards[0] as any).phonemeClassification).toBe('continuous');
      expect((letterCards[0] as any).holdDurationMs).toBe(1200);
    });

    it('ensures Consolidation Lessons 5 and 10 omit Letter Cards and generate multi-word Blending practice', () => {
      for (const lessonNum of [5, 10]) {
        const lessonCards = INITIAL_CURRICULUM_CARDS.filter((c) => c.lessonNumber === lessonNum);
        const letterCards = lessonCards.filter((c) => c.type === 'letter');
        const blendingCards = lessonCards.filter((c) => c.type === 'blending-word');

        // Consolidation lessons must omit new letter introductions
        expect(letterCards).toHaveLength(0);
        // Consolidation lessons must generate multi-word blending practice
        expect(blendingCards.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('ensures non-consolidation Lessons (1, 2, 3, 4, 6, 7, 8, 9) introduce exactly one Letter Card with valid physics', () => {
      const expectedLetters: Record<number, { letter: string; classification: string; taps?: number; hold?: number }> = {
        1: { letter: 'a', classification: 'continuous', hold: 1200 },
        2: { letter: 'm', classification: 'continuous', hold: 1200 },
        3: { letter: 's', classification: 'continuous', hold: 1200 },
        4: { letter: 't', classification: 'stop', taps: 3 },
        6: { letter: 'p', classification: 'stop', taps: 3 },
        7: { letter: 'f', classification: 'continuous', hold: 1200 },
        8: { letter: 'i', classification: 'continuous', hold: 1200 },
        9: { letter: 'n', classification: 'continuous', hold: 1200 },
      };

      for (const [lessonStr, expected] of Object.entries(expectedLetters)) {
        const lessonNum = Number(lessonStr);
        const lessonCards = INITIAL_CURRICULUM_CARDS.filter((c) => c.lessonNumber === lessonNum);
        const letterCards = lessonCards.filter((c) => c.type === 'letter');

        expect(letterCards).toHaveLength(1);
        const card = letterCards[0] as any;
        expect(card.grapheme).toBe(expected.letter);
        expect(card.phonemeClassification).toBe(expected.classification);
        if (expected.classification === 'continuous') {
          expect(card.holdDurationMs).toBe(expected.hold);
        } else {
          expect(card.seedPodTapsRequired).toBe(expected.taps);
        }
      }
    });

    it('strictly satisfies cumulative decodability across all Blending Words in Lessons 1–10', () => {
      const cumulativeGraphemes = new Set<string>();

      for (let lesson = 1; lesson <= 10; lesson++) {
        const lessonCards = INITIAL_CURRICULUM_CARDS.filter((c) => c.lessonNumber === lesson);
        const letterCards = lessonCards.filter((c) => c.type === 'letter');

        // Add newly introduced grapheme if not a consolidation lesson
        for (const lCard of letterCards) {
          cumulativeGraphemes.add((lCard as any).grapheme.toLowerCase());
        }

        const blendingCards = lessonCards.filter((c) => c.type === 'blending-word');
        for (const bCard of blendingCards) {
          const card = bCard as any;
          // Every grapheme in the word must exist in the cumulative set
          for (const g of card.graphemes) {
            expect(cumulativeGraphemes.has(g.toLowerCase())).toBe(true);
          }
        }
      }
    });

    it('includes required target blending words for Lessons 2–10', () => {
      const getWordsForLesson = (lesson: number) =>
        INITIAL_CURRICULUM_CARDS.filter(
          (c) => c.lessonNumber === lesson && c.type === 'blending-word'
        ).map((c: any) => c.word);

      expect(getWordsForLesson(2)).toEqual(expect.arrayContaining(['am']));
      expect(getWordsForLesson(3)).toEqual(expect.arrayContaining(['Sam', 'am']));
      expect(getWordsForLesson(4)).toEqual(expect.arrayContaining(['at', 'sat', 'mat']));
      expect(getWordsForLesson(6)).toEqual(expect.arrayContaining(['pat', 'tap', 'sap', 'map']));
      expect(getWordsForLesson(7)).toEqual(expect.arrayContaining(['fat']));
      expect(getWordsForLesson(8)).toEqual(
        expect.arrayContaining(['it', 'sit', 'pit', 'fit', 'sip', 'tip'])
      );
      expect(getWordsForLesson(9)).toEqual(
        expect.arrayContaining(['in', 'pin', 'tin', 'fin', 'nap', 'pan', 'tan', 'man', 'fan'])
      );
      expect(getWordsForLesson(10).length).toBeGreaterThanOrEqual(5);
    });

    it('introduces high-frequency Heart Words across Lessons 1–10 (the, I, a, is, said, to) with irregular heart parts', () => {
      const heartWordCards = INITIAL_CURRICULUM_CARDS.filter(
        (c) => c.type === 'heart-word'
      ) as any[];

      const words = heartWordCards.map((c) => c.word.toLowerCase());
      expect(words).toContain('the');
      expect(words).toContain('i');
      expect(words).toContain('a');
      expect(words).toContain('is');
      expect(words).toContain('said');
      expect(words).toContain('to');

      for (const card of heartWordCards) {
        // Every Heart Word must have at least one irregular heart part
        const hasHeartPart = card.parts.some((p: any) => p.isHeart === true);
        expect(hasHeartPart).toBe(true);

        // Every part must have a non-empty grapheme and phoneme
        for (const p of card.parts) {
          expect(p.grapheme.length).toBeGreaterThan(0);
          expect(p.phoneme.length).toBeGreaterThan(0);
        }
      }
    });

    it('ensures every word in every Decodable Story across Lessons 1–10 is strictly 100% decodable or a previously/currently introduced Heart Word', () => {
      const cumulativeGraphemes = new Set<string>();
      const cumulativeHeartWords = new Set<string>();

      const storyCards = INITIAL_CURRICULUM_CARDS.filter(
        (c) => c.type === 'decodable-story'
      ) as any[];
      expect(storyCards.length).toBeGreaterThanOrEqual(5);

      for (let lesson = 1; lesson <= 10; lesson++) {
        const lessonCards = INITIAL_CURRICULUM_CARDS.filter((c) => c.lessonNumber === lesson);

        // Accumulate newly introduced letters
        for (const card of lessonCards) {
          if (card.type === 'letter') {
            cumulativeGraphemes.add((card as any).grapheme.toLowerCase());
          }
          if (card.type === 'heart-word') {
            cumulativeHeartWords.add((card as any).word.toLowerCase());
          }
        }

        // Validate any Decodable Story in this lesson
        const lessonStoryCards = lessonCards.filter((c) => c.type === 'decodable-story');
        for (const sCard of lessonStoryCards) {
          const card = sCard as any;
          expect(card.words.length).toBeGreaterThan(0);

          for (const rawWord of card.words) {
            const cleanWord = rawWord.toLowerCase().replace(/[^a-z]/g, '');
            const isHeartWord = cumulativeHeartWords.has(cleanWord);

            if (!isHeartWord) {
              // Every character in the word must be a taught grapheme
              for (const ch of cleanWord) {
                expect(
                  cumulativeGraphemes.has(ch),
                  `Untaught letter '${ch}' found in story word '${rawWord}' (Lesson ${lesson}) with taught [${Array.from(cumulativeGraphemes).join(',')}]`
                ).toBe(true);
              }
            }
          }
        }
      }
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
