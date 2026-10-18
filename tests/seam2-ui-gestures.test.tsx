import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LetterCard } from '../src/components/LetterCard';
import { BlendingWordCard } from '../src/components/BlendingWordCard';
import { HeartWordCard } from '../src/components/HeartWordCard';
import { DecodableStoryCard } from '../src/components/DecodableStoryCard';
import { GardenVineShell } from '../src/components/GardenVineShell';
import { createStubAudioPort, StubAudioPort } from '../src/audio';
import {
  INITIAL_CURRICULUM_CARDS,
  LetterCardData,
  BlendingWordCardData,
  HeartWordCardData,
  DecodableStoryCardData,
} from '../src/domain';
import { createGardenStateMachine, GardenStateMachine } from '../src/state/gardenStateMachine';

describe('Seam 2 — UI Component & Gesture Integration Seam', () => {
  let audioPort: StubAudioPort;

  beforeEach(() => {
    vi.useFakeTimers();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    audioPort = createStubAudioPort();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('LetterCard: Continuous Phoneme (/ă/) Gesture Physics', () => {
    const cardDataA: LetterCardData = INITIAL_CURRICULUM_CARDS[0]; // letter 'a', continuous

    it('renders oversized touch target (64px+) and graphemes with articulatory mouth cue', () => {
      const onComplete = vi.fn();
      render(
        <LetterCard
          card={cardDataA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      // Displays lowercase and uppercase
      expect(screen.getByText('a')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();

      // Displays articulatory kid prompt
      expect(
        screen.getByText(/Open wide and let your voice flow/i)
      ).toBeInTheDocument();

      // Checks Sprout Mouth Avatar rendered with open-wide state
      const mouthAvatar = screen.getByTestId('sprout-mouth-avatar');
      expect(mouthAvatar).toHaveAttribute('data-mouth-state', 'open-wide');

      // Oversized touch target
      const touchTarget = screen.getByTestId('letter-touch-target');
      expect(touchTarget).toBeInTheDocument();
      expect(touchTarget.classList.contains('touch-target-oversized')).toBe(true);
    });

    it('requires 1,200ms cumulative press-and-hold, preserving progress across brief releases', () => {
      const onComplete = vi.fn();
      render(
        <LetterCard
          card={cardDataA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const touchTarget = screen.getByTestId('letter-touch-target');

      // 1. Initial pointer down starts continuous phoneme audio
      fireEvent.pointerDown(touchTarget);
      expect(audioPort.continuousPhonemesStarted).toContain('ă');
      expect(onComplete).not.toHaveBeenCalled();

      // Advance by 600ms (halfway to 1200ms)
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(onComplete).not.toHaveBeenCalled();

      // 2. Child releases finger briefly at 600ms
      fireEvent.pointerUp(touchTarget);
      expect(audioPort.continuousPhonemesStoppedCount).toBe(1);
      expect(onComplete).not.toHaveBeenCalled();

      // Ensure progress is preserved and does not decay immediately
      const progressBar = screen.getByTestId('hold-progress-bar');
      expect(Number(progressBar.getAttribute('data-progress-ms'))).toBeGreaterThanOrEqual(600);

      // 3. Child presses again to accumulate the remaining 600ms
      fireEvent.pointerDown(touchTarget);
      expect(audioPort.continuousPhonemesStarted.length).toBe(2);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Now reaches 1200ms -> card blooms and completes
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(audioPort.continuousPhonemesStoppedCount).toBe(2);
    });
  });

  describe('LetterCard: Stop Phoneme (/t/) Gesture Physics', () => {
    const cardDataT: LetterCardData = INITIAL_CURRICULUM_CARDS.find(
      (c): c is LetterCardData => c.id === 'lesson-4-letter-t'
    )!; // letter 't', stop

    it('renders 3 tactile seed pods and articulatory tongue-tap cue', () => {
      const onComplete = vi.fn();
      render(
        <LetterCard
          card={cardDataT}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      // Displays graphemes
      expect(screen.getByText('t')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument();

      // Mouth avatar tongue-tap
      const mouthAvatar = screen.getByTestId('sprout-mouth-avatar');
      expect(mouthAvatar).toHaveAttribute('data-mouth-state', 'tongue-tap');

      // 3 tactile seed pods
      const seedPods = screen.getAllByTestId(/seed-pod-\d/);
      expect(seedPods).toHaveLength(3);
    });

    it('requires 3 crisp seed-pod taps, voicing instantaneous /t/ burst on each pop', () => {
      const onComplete = vi.fn();
      render(
        <LetterCard
          card={cardDataT}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const seedPods = screen.getAllByTestId(/seed-pod-\d/);

      // Tap 1st pod
      fireEvent.click(seedPods[0]);
      expect(audioPort.playedPhonemes).toEqual(['t']);
      expect(audioPort.popCount).toBe(1);
      expect(onComplete).not.toHaveBeenCalled();

      // Tap 2nd pod
      fireEvent.click(seedPods[1]);
      expect(audioPort.playedPhonemes).toEqual(['t', 't']);
      expect(audioPort.popCount).toBe(2);
      expect(onComplete).not.toHaveBeenCalled();

      // Tap 3rd pod completes card
      fireEvent.click(seedPods[2]);
      expect(audioPort.playedPhonemes).toEqual(['t', 't', 't']);
      expect(audioPort.popCount).toBe(3);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('GardenVineShell: Viewport, Vine Frontier & Locked Celebration Auto-Advance', () => {
    let stateMachine: GardenStateMachine;

    beforeEach(() => {
      stateMachine = createGardenStateMachine();
    });

    it('opens immediately centered on active Vine Frontier card with zero menu friction', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      // Active card is Lesson 1 'a'
      expect(screen.getByTestId('active-card-container')).toBeInTheDocument();
      expect(screen.getByText('Letter a')).toBeInTheDocument();

      // Return to Frontier button should NOT be visible when at frontier
      expect(screen.queryByTestId('return-to-frontier-button')).not.toBeInTheDocument();
    });

    it('swiping downward past uncompleted Vine Frontier card clamps to frontierIndex and triggers elastic bounce', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      const vineViewport = screen.getByTestId('garden-vine-viewport');

      // Simulate swipe up/down scroll past frontier
      fireEvent.touchStart(vineViewport, { touches: [{ clientY: 300 }] });
      fireEvent.touchMove(vineViewport, { touches: [{ clientY: 100 }] }); // swipe up to go downward to next card
      fireEvent.touchEnd(vineViewport);

      // Still clamped at frontierIndex 0
      expect(stateMachine.getState().activeIndex).toBe(0);
      expect(vineViewport).toHaveAttribute('data-bouncing', 'true');

      // Bounce clears after animation timer
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(vineViewport).toHaveAttribute('data-bouncing', 'false');
    });

    it('completing card at Vine Frontier triggers locked celebration for 2,000ms then auto-advances', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      // Active card is continuous 'a'
      const touchTarget = screen.getByTestId('letter-touch-target');

      // Hold for 1200ms to complete
      fireEvent.pointerDown(touchTarget);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      fireEvent.pointerUp(touchTarget);

      // Celebration fanfare played
      expect(audioPort.bloomFanfareCount).toBe(1);

      // isCelebrationLocked is true, overlay is displayed
      expect(stateMachine.getState().isCelebrationLocked).toBe(true);
      const celebrationOverlay = screen.getByTestId('celebration-overlay');
      expect(celebrationOverlay).toBeInTheDocument();

      // Input touches during the 2,000ms window are intercepted/ignored
      fireEvent.click(celebrationOverlay);
      expect(stateMachine.getState().activeIndex).toBe(0);

      // Advance timer by 1999ms: still locked at 0
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(stateMachine.getState().isCelebrationLocked).toBe(true);
      expect(stateMachine.getState().activeIndex).toBe(0);

      // Advance by remaining 1ms (reaching 2,000ms): auto-advances to card 1 and unlocks
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(stateMachine.getState().isCelebrationLocked).toBe(false);
      expect(stateMachine.getState().frontierIndex).toBe(1);
      expect(stateMachine.getState().activeIndex).toBe(1);

      // Active card is now Lesson 2 'm'
      expect(screen.getByText('Letter m')).toBeInTheDocument();
    });

    it('scrolling upward to a completed card reveals "Return to Frontier" and replaying blooms in-place', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      // Complete card 0
      const touchTargetA = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchTargetA);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      fireEvent.pointerUp(touchTargetA);

      // Advance celebration 2000ms
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(stateMachine.getState().frontierIndex).toBe(1);
      expect(stateMachine.getState().activeIndex).toBe(1);

      // Scroll upward to card 0
      const vineViewport = screen.getByTestId('garden-vine-viewport');
      fireEvent.touchStart(vineViewport, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(vineViewport, { touches: [{ clientY: 300 }] }); // swipe down to go to previous card
      fireEvent.touchEnd(vineViewport);

      expect(stateMachine.getState().activeIndex).toBe(0);

      // "Return to Frontier" pill should now be visible!
      const returnBtn = screen.getByTestId('return-to-frontier-button');
      expect(returnBtn).toBeInTheDocument();

      // Replay card 0 in-place
      const touchTargetReplay = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchTargetReplay);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      fireEvent.pointerUp(touchTargetReplay);

      // Encore celebration does NOT lock celebration or auto-advance
      expect(stateMachine.getState().isCelebrationLocked).toBe(false);
      expect(stateMachine.getState().activeIndex).toBe(0);
      expect(stateMachine.getState().frontierIndex).toBe(1);

      // Tapping Return to Frontier brings user back to frontierIndex (1)
      fireEvent.click(returnBtn);
      expect(stateMachine.getState().activeIndex).toBe(1);
      expect(screen.queryByTestId('return-to-frontier-button')).not.toBeInTheDocument();
    });
  });

  describe('BlendingWordCard: Forgiving Hybrid Gesture & Progressive Blending', () => {
    const cardDataSat: BlendingWordCardData = {
      id: 'test-blend-sat',
      lessonNumber: 4,
      type: 'blending-word',
      title: 'Blend: sat',
      word: 'sat',
      graphemes: ['s', 'a', 't'],
      illustration: '🪑',
    };

    it('renders horizontal blending track, slider buddy, and individual grapheme tiles', () => {
      const onComplete = vi.fn();
      render(
        <BlendingWordCard
          card={cardDataSat}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      expect(screen.getByTestId('blending-word-card')).toBeInTheDocument();
      expect(screen.getByTestId('blending-track')).toBeInTheDocument();
      expect(screen.getByTestId('slider-buddy')).toBeInTheDocument();

      expect(screen.getByTestId('grapheme-tile-0')).toHaveTextContent('s');
      expect(screen.getByTestId('grapheme-tile-1')).toHaveTextContent('a');
      expect(screen.getByTestId('grapheme-tile-2')).toHaveTextContent('t');

      // Initially illustration is not visible
      expect(screen.queryByTestId('word-illustration')).not.toBeInTheDocument();
      // First tile pulses as next expected
      expect(screen.getByTestId('grapheme-tile-0')).toHaveAttribute('data-pulsing', 'true');
    });

    it('continuous drag across graphemes voices phonemes in order, voices blended word, reveals illustration, and completes card', () => {
      const onComplete = vi.fn();
      render(
        <BlendingWordCard
          card={cardDataSat}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const tile0 = screen.getByTestId('grapheme-tile-0');
      const tile1 = screen.getByTestId('grapheme-tile-1');
      const tile2 = screen.getByTestId('grapheme-tile-2');

      // 1. Drag starts on tile 0 ('s')
      fireEvent.pointerDown(tile0);
      expect(audioPort.playedPhonemes).toEqual(['s']);
      expect(tile0).toHaveAttribute('data-illuminated', 'true');
      expect(tile1).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // 2. Drag moves across tile 1 ('a')
      fireEvent.pointerEnter(tile1);
      expect(audioPort.playedPhonemes).toEqual(['s', 'ă']);
      expect(tile1).toHaveAttribute('data-illuminated', 'true');
      expect(tile2).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // 3. Drag reaches final tile 2 ('t')
      fireEvent.pointerEnter(tile2);
      expect(audioPort.playedPhonemes).toEqual(['s', 'ă', 't']);
      expect(tile2).toHaveAttribute('data-illuminated', 'true');

      // Full blended word voiced
      expect(audioPort.playedWords).toEqual(['sat']);

      // Illustration revealed and card completes
      expect(screen.getByTestId('word-illustration')).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('motor-forgiving latch & tap: lifting pointer mid-blend latches progress and pulses next grapheme for tap completion', () => {
      const onComplete = vi.fn();
      render(
        <BlendingWordCard
          card={cardDataSat}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const tile0 = screen.getByTestId('grapheme-tile-0');
      const tile1 = screen.getByTestId('grapheme-tile-1');
      const tile2 = screen.getByTestId('grapheme-tile-2');

      // 1. Toddler drags across 's' and 'a'
      fireEvent.pointerDown(tile0);
      fireEvent.pointerEnter(tile1);
      expect(audioPort.playedPhonemes).toEqual(['s', 'ă']);

      // 2. Toddler lifts pointer mid-blend!
      fireEvent.pointerUp(tile1);

      // Progress is latched: tiles 0 and 1 remain illuminated, not reset to zero!
      expect(tile0).toHaveAttribute('data-illuminated', 'true');
      expect(tile1).toHaveAttribute('data-illuminated', 'true');
      expect(tile2).toHaveAttribute('data-illuminated', 'false');

      // Next grapheme (tile 2) pulses to invite tap
      expect(tile2).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // 3. Toddler taps the remaining grapheme 't'
      fireEvent.click(tile2);

      expect(audioPort.playedPhonemes).toEqual(['s', 'ă', 't']);
      expect(audioPort.playedWords).toEqual(['sat']);
      expect(screen.getByTestId('word-illustration')).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('pure sequential tap completion: tapping graphemes in left-to-right order', () => {
      const onComplete = vi.fn();
      render(
        <BlendingWordCard
          card={cardDataSat}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const tile0 = screen.getByTestId('grapheme-tile-0');
      const tile1 = screen.getByTestId('grapheme-tile-1');
      const tile2 = screen.getByTestId('grapheme-tile-2');

      // Tap 1: 's'
      fireEvent.click(tile0);
      expect(audioPort.playedPhonemes).toEqual(['s']);
      expect(tile0).toHaveAttribute('data-illuminated', 'true');
      expect(tile1).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // Tap 2: 'a'
      fireEvent.click(tile1);
      expect(audioPort.playedPhonemes).toEqual(['s', 'ă']);
      expect(tile1).toHaveAttribute('data-illuminated', 'true');
      expect(tile2).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // Tap 3: 't'
      fireEvent.click(tile2);
      expect(audioPort.playedPhonemes).toEqual(['s', 'ă', 't']);
      expect(audioPort.playedWords).toEqual(['sat']);
      expect(screen.getByTestId('word-illustration')).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('out-of-order tap does not advance blend, calls playWobbleHint, and gently pulses next expected grapheme', () => {
      const onComplete = vi.fn();
      render(
        <BlendingWordCard
          card={cardDataSat}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const tile0 = screen.getByTestId('grapheme-tile-0');
      const tile1 = screen.getByTestId('grapheme-tile-1');
      const tile2 = screen.getByTestId('grapheme-tile-2');

      // Toddler taps 's' first
      fireEvent.click(tile0);
      expect(audioPort.playedPhonemes).toEqual(['s']);

      // Toddler mistakenly taps 't' (index 2) instead of expected 'a' (index 1)
      fireEvent.click(tile2);

      // Does NOT advance: playedPhonemes is still just ['s']
      expect(audioPort.playedPhonemes).toEqual(['s']);
      expect(audioPort.playedWords).toEqual([]);
      expect(onComplete).not.toHaveBeenCalled();

      // Calls wobble hint
      expect(audioPort.wobbleHintCount).toBe(1);

      // Next expected tile 1 remains pulsing
      expect(tile1).toHaveAttribute('data-pulsing', 'true');
      expect(tile2).toHaveAttribute('data-illuminated', 'false');
    });
  });

  describe('GardenVineShell: BlendingWordCard Integration & Auto-Advance', () => {
    it('seamlessly renders BlendingWordCard on vine and advances upon word blending completion', () => {
      const stateMachine = createGardenStateMachine();
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      // Complete Lesson 1: 'a'
      const touchTargetA = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchTargetA);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      fireEvent.pointerUp(touchTargetA);

      // Celebration auto-advances
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Now at Lesson 2 Letter 'm'
      expect(screen.getByText('Letter m')).toBeInTheDocument();
      const touchTargetM = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchTargetM);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      fireEvent.pointerUp(touchTargetM);

      // Celebration auto-advances to Lesson 2 Blending Word 'am'
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Active card is now Blending Word: am
      expect(screen.getByTestId('blending-word-card')).toBeInTheDocument();
      expect(screen.getByText('Blend: am')).toBeInTheDocument();

      // Blend 'am': click 'a' then 'm'
      const tileA = screen.getByTestId('grapheme-tile-0');
      const tileM = screen.getByTestId('grapheme-tile-1');

      fireEvent.click(tileA);
      expect(audioPort.playedPhonemes).toContain('ă');

      fireEvent.click(tileM);
      expect(audioPort.playedWords).toContain('am');
      expect(audioPort.bloomFanfareCount).toBeGreaterThanOrEqual(3);

      // Celebration lock active
      expect(stateMachine.getState().isCelebrationLocked).toBe(true);

      // Advance celebration 2000ms
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(stateMachine.getState().isCelebrationLocked).toBe(false);
      // Next card is Lesson 3 Letter 's'!
      expect(screen.getByText('Letter s')).toBeInTheDocument();
    });

    it('seamlessly renders HeartWordCard and DecodableStoryCard on the vine and auto-advances upon completion', () => {
      const heartCard: HeartWordCardData = {
        id: 'test-vine-heart-i',
        lessonNumber: 3,
        type: 'heart-word',
        title: 'Heart Word: I',
        word: 'I',
        parts: [{ grapheme: 'I', isHeart: true, phoneme: 'ī' }],
      };
      const storyCard: DecodableStoryCardData = {
        id: 'test-vine-story-sam',
        lessonNumber: 3,
        type: 'decodable-story',
        title: 'Story: I am Sam.',
        sentence: 'I am Sam.',
        words: ['I', 'am', 'Sam'],
      };

      const customStateMachine = createGardenStateMachine({
        initialCards: [heartCard, storyCard],
      });

      render(<GardenVineShell stateMachine={customStateMachine} audioPort={audioPort} />);

      // Active card 0 is HeartWordCard
      expect(screen.getByTestId('heart-word-card')).toBeInTheDocument();
      expect(screen.getByText('Heart Word: I')).toBeInTheDocument();

      // Tap the heart part 'I'
      fireEvent.click(screen.getByTestId('heart-part-0'));
      expect(audioPort.playedWords).toContain('I');
      expect(audioPort.bloomFanfareCount).toBe(1);
      expect(customStateMachine.getState().isCelebrationLocked).toBe(true);

      // Advance celebration 2000ms
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(customStateMachine.getState().isCelebrationLocked).toBe(false);
      expect(customStateMachine.getState().activeIndex).toBe(1);

      // Now at card 1: DecodableStoryCard
      expect(screen.getByTestId('decodable-story-card')).toBeInTheDocument();
      expect(screen.getByText('Story: I am Sam.')).toBeInTheDocument();

      // Read words sequentially: 'I', 'am', 'Sam'
      fireEvent.click(screen.getByTestId('story-word-0'));
      fireEvent.click(screen.getByTestId('story-word-1'));
      fireEvent.click(screen.getByTestId('story-word-2'));

      // Final word and full sentence voiced
      expect(audioPort.playedWords).toContain('I am Sam.');
      expect(audioPort.bloomFanfareCount).toBe(2);
      expect(customStateMachine.getState().isCelebrationLocked).toBe(true);
    });
  });

  describe('HeartWordCard: Orthographic Mapping & Irregular Heart Part', () => {
    const cardDataThe: HeartWordCardData = {
      id: 'test-heart-the',
      lessonNumber: 5,
      type: 'heart-word',
      title: 'Heart Word: the',
      word: 'the',
      parts: [
        { grapheme: 'th', isHeart: false, phoneme: 'th' },
        { grapheme: 'e', isHeart: true, phoneme: 'uh' },
      ],
    };

    it('renders oversized interactive parts (>= 64px) with regular styling and pulsing golden heart badge', () => {
      const onComplete = vi.fn();
      render(
        <HeartWordCard
          card={cardDataThe}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      expect(screen.getByTestId('heart-word-card')).toBeInTheDocument();
      expect(screen.getByText('Heart Word: the')).toBeInTheDocument();

      // Part 0 ('th'): regular
      const part0 = screen.getByTestId('heart-part-0');
      expect(part0).toBeInTheDocument();
      expect(part0).toHaveTextContent('th');
      expect(part0.classList.contains('touch-target-oversized')).toBe(true);
      expect(part0.querySelector('[data-testid="golden-heart-badge"]')).toBeNull();

      // Part 1 ('e'): irregular with golden heart badge
      const part1 = screen.getByTestId('heart-part-1');
      expect(part1).toBeInTheDocument();
      expect(part1).toHaveTextContent('e');
      expect(part1.classList.contains('touch-target-oversized')).toBe(true);
      expect(part1.querySelector('[data-testid="golden-heart-badge"]')).not.toBeNull();
    });

    it('tapping regular grapheme voices regular phoneme; tapping golden heart voices heart phoneme with sparkle', () => {
      const onComplete = vi.fn();
      render(
        <HeartWordCard
          card={cardDataThe}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const part0 = screen.getByTestId('heart-part-0');
      const part1 = screen.getByTestId('heart-part-1');

      // Tap regular part 0 ('th')
      fireEvent.click(part0);
      expect(audioPort.playedPhonemes).toEqual(['th']);
      expect(part0).toHaveAttribute('data-tapped', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // Tap irregular part 1 ('e' -> 'uh')
      fireEvent.click(part1);
      expect(audioPort.playedPhonemes).toEqual(['th', 'uh']);
      expect(part1).toHaveAttribute('data-tapped', 'true');
      expect(screen.getByTestId('heart-sparkle')).toBeInTheDocument();
    });

    it('once every part has been tapped, voices full word and completes card', () => {
      const onComplete = vi.fn();
      render(
        <HeartWordCard
          card={cardDataThe}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const part0 = screen.getByTestId('heart-part-0');
      const part1 = screen.getByTestId('heart-part-1');

      fireEvent.click(part0);
      expect(onComplete).not.toHaveBeenCalled();
      expect(audioPort.playedWords).toEqual([]);

      fireEvent.click(part1);

      // Both parts tapped! Speaks full word and completes
      expect(audioPort.playedWords).toEqual(['the']);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('completed-heart-word')).toBeInTheDocument();
    });

    it('supports single-part Heart Words (such as I) and re-tapping parts', () => {
      const cardDataI: HeartWordCardData = {
        id: 'test-heart-i',
        lessonNumber: 3,
        type: 'heart-word',
        title: 'Heart Word: I',
        word: 'I',
        parts: [{ grapheme: 'I', isHeart: true, phoneme: 'ī' }],
      };

      const onComplete = vi.fn();
      render(
        <HeartWordCard
          card={cardDataI}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const part0 = screen.getByTestId('heart-part-0');
      expect(part0.querySelector('[data-testid="golden-heart-badge"]')).not.toBeNull();

      fireEvent.click(part0);
      expect(audioPort.playedPhonemes).toEqual(['ī']);
      expect(audioPort.playedWords).toEqual(['I']);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('DecodableStoryCard: Progressive Scene Reveal & Left-to-Right Directionality', () => {
    const storyCardData: DecodableStoryCardData = {
      id: 'test-story-sam-sat',
      lessonNumber: 4,
      type: 'decodable-story',
      title: 'Story: Sam sat at a mat.',
      sentence: 'Sam sat at a mat.',
      words: ['Sam', 'sat', 'at', 'a', 'mat'],
    };

    it('renders interactive word pills and multi-element SVG garden illustration', () => {
      const onComplete = vi.fn();
      render(
        <DecodableStoryCard
          card={storyCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      expect(screen.getByTestId('decodable-story-card')).toBeInTheDocument();
      expect(screen.getByTestId('story-words-container')).toBeInTheDocument();
      expect(screen.getByTestId('story-scene-illustration')).toBeInTheDocument();

      // Renders all word pills
      storyCardData.words.forEach((w, index) => {
        const wordEl = screen.getByTestId(`story-word-${index}`);
        expect(wordEl).toBeInTheDocument();
        expect(wordEl).toHaveTextContent(w);
        expect(wordEl).toHaveAttribute('data-read', 'false');
      });

      // Word 0 is initially pulsing as next expected
      expect(screen.getByTestId('story-word-0')).toHaveAttribute('data-pulsing', 'true');

      // Scene elements matching each word
      storyCardData.words.forEach((_, index) => {
        const sceneEl = screen.getByTestId(`scene-element-${index}`);
        expect(sceneEl).toBeInTheDocument();
        expect(sceneEl).toHaveAttribute('data-revealed', 'false');
      });
    });

    it('enforces left-to-right reading: sequential taps voice words and progressively reveal scene elements', () => {
      const onComplete = vi.fn();
      render(
        <DecodableStoryCard
          card={storyCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const word0 = screen.getByTestId('story-word-0'); // "Sam"
      const word1 = screen.getByTestId('story-word-1'); // "sat"
      const word2 = screen.getByTestId('story-word-2'); // "at"
      const word3 = screen.getByTestId('story-word-3'); // "a"
      const word4 = screen.getByTestId('story-word-4'); // "mat"

      // 1. Tap word 0 ("Sam")
      fireEvent.click(word0);
      expect(audioPort.playedWords).toEqual(['Sam']);
      expect(word0).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('scene-element-0')).toHaveAttribute('data-revealed', 'true');
      expect(word1).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // 2. Tap word 1 ("sat")
      fireEvent.click(word1);
      expect(audioPort.playedWords).toEqual(['Sam', 'sat']);
      expect(word1).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('scene-element-1')).toHaveAttribute('data-revealed', 'true');
      expect(word2).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();

      // 3. Tap word 2 ("at")
      fireEvent.click(word2);
      expect(audioPort.playedWords).toEqual(['Sam', 'sat', 'at']);
      expect(word2).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('scene-element-2')).toHaveAttribute('data-revealed', 'true');
      expect(word3).toHaveAttribute('data-pulsing', 'true');

      // 4. Tap word 3 ("a")
      fireEvent.click(word3);
      expect(audioPort.playedWords).toEqual(['Sam', 'sat', 'at', 'a']);
      expect(word3).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('scene-element-3')).toHaveAttribute('data-revealed', 'true');
      expect(word4).toHaveAttribute('data-pulsing', 'true');

      // 5. Tap final word 4 ("mat")
      fireEvent.click(word4);
      // Voices final word AND complete fluent sentence
      expect(audioPort.playedWords).toEqual(['Sam', 'sat', 'at', 'a', 'mat', 'Sam sat at a mat.']);
      expect(word4).toHaveAttribute('data-read', 'true');
      expect(screen.getByTestId('scene-element-4')).toHaveAttribute('data-revealed', 'true');
      expect(screen.getByTestId('completed-story-sentence')).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('out-of-order tap does not mark word read, plays wobble hint, and pulses next unread word', () => {
      const onComplete = vi.fn();
      render(
        <DecodableStoryCard
          card={storyCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const word0 = screen.getByTestId('story-word-0'); // "Sam"
      const word1 = screen.getByTestId('story-word-1'); // "sat"
      const word3 = screen.getByTestId('story-word-3'); // "a"

      // Tap word 0
      fireEvent.click(word0);
      expect(audioPort.playedWords).toEqual(['Sam']);

      // Child taps word 3 ("a") skipping expected word 1 ("sat")
      fireEvent.click(word3);

      // Does NOT mark word 3 read
      expect(word3).toHaveAttribute('data-read', 'false');
      expect(screen.getByTestId('scene-element-3')).toHaveAttribute('data-revealed', 'false');

      // Played wobble hint
      expect(audioPort.wobbleHintCount).toBe(1);
      // Played words still only contains ['Sam']
      expect(audioPort.playedWords).toEqual(['Sam']);

      // Word 1 remains pulsing as next expected
      expect(word1).toHaveAttribute('data-pulsing', 'true');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('tapping an already-read word re-voices that word without changing reading progress', () => {
      const onComplete = vi.fn();
      render(
        <DecodableStoryCard
          card={storyCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const word0 = screen.getByTestId('story-word-0');
      fireEvent.click(word0);
      expect(audioPort.playedWords).toEqual(['Sam']);

      // Re-tap word 0
      fireEvent.click(word0);
      expect(audioPort.playedWords).toEqual(['Sam', 'Sam']);
      expect(audioPort.wobbleHintCount).toBe(0);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
