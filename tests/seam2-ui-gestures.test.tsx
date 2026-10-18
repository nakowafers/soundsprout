import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LetterCard } from '../src/components/LetterCard';
import { BlendingWordCard } from '../src/components/BlendingWordCard';
import { PhonemeBubblePopCard } from '../src/components/PhonemeBubblePopCard';
import { GardenVineShell } from '../src/components/GardenVineShell';
import { createStubAudioPort, StubAudioPort } from '../src/audio';
import {
  INITIAL_CURRICULUM_CARDS,
  LetterCardData,
  BlendingWordCardData,
  BubblePopCardData,
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
    const cardDataA: LetterCardData = INITIAL_CURRICULUM_CARDS[0] as LetterCardData; // letter 'a', continuous

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

  describe('PhonemeBubblePopCard: Auditory Discrimination & No-Fail Scaffolding', () => {
    const cardDataBubblePopA: BubblePopCardData = INITIAL_CURRICULUM_CARDS.find(
      (c): c is BubblePopCardData => c.id === 'lesson-1-bubble-pop-a'
    )!;

    it('announces target phoneme when rendered and provides tap-to-repeat speaker prompt', () => {
      const onComplete = vi.fn();
      render(
        <PhonemeBubblePopCard
          card={cardDataBubblePopA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      // Announces target phoneme on mount
      expect(audioPort.playedPhonemes).toContain('ă');

      // Tap-to-repeat speaker prompt
      const repeatBtn = screen.getByTestId('repeat-speaker-button');
      expect(repeatBtn).toBeInTheDocument();
      expect(repeatBtn).toHaveAttribute('aria-label', expect.stringMatching(/repeat/i));

      fireEvent.click(repeatBtn);
      expect(audioPort.playedPhonemes.filter((p) => p === 'ă').length).toBe(2);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('renders 6 floating bubbles (3 target and 3 distractor) with touch targets >= 64px', () => {
      const onComplete = vi.fn();
      render(
        <PhonemeBubblePopCard
          card={cardDataBubblePopA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const allBubbles = screen.getAllByTestId(/^bubble-/);
      expect(allBubbles).toHaveLength(6);

      const targetBubbles = allBubbles.filter(
        (el) => el.getAttribute('data-target') === 'true'
      );
      const distractorBubbles = allBubbles.filter(
        (el) => el.getAttribute('data-target') === 'false'
      );

      expect(targetBubbles).toHaveLength(3);
      expect(distractorBubbles).toHaveLength(3);

      for (const bubble of allBubbles) {
        expect(bubble.classList.contains('touch-target-oversized')).toBe(true);
      }
    });

    it('tapping each target bubble plays water-drop and target phoneme audio, pops bubble, and increments water level until 3rd pop completes card', () => {
      const onComplete = vi.fn();
      render(
        <PhonemeBubblePopCard
          card={cardDataBubblePopA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const waterLevelMeter = screen.getByTestId('sprout-water-level');
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '0');

      const targetBubbles = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'true');

      // Tap 1st target
      fireEvent.click(targetBubbles[0]);
      expect(audioPort.waterDropCount).toBe(1);
      expect(audioPort.playedPhonemes).toContain('ă');
      expect(targetBubbles[0]).toHaveAttribute('data-popped', 'true');
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '1');
      expect(onComplete).not.toHaveBeenCalled();

      // Tap 2nd target
      fireEvent.click(targetBubbles[1]);
      expect(audioPort.waterDropCount).toBe(2);
      expect(targetBubbles[1]).toHaveAttribute('data-popped', 'true');
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '2');
      expect(onComplete).not.toHaveBeenCalled();

      // Tap 3rd target completes card
      fireEvent.click(targetBubbles[2]);
      expect(audioPort.waterDropCount).toBe(3);
      expect(targetBubbles[2]).toHaveAttribute('data-popped', 'true');
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '3');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('No-Fail Positive Scaffolding: tapping distractor invokes playWobbleHint, wobbles without popping, preserves progress, and highlights remaining target with golden hint glow', () => {
      const onComplete = vi.fn();
      render(
        <PhonemeBubblePopCard
          card={cardDataBubblePopA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const waterLevelMeter = screen.getByTestId('sprout-water-level');
      const targetBubbles = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'true');
      const distractorBubbles = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'false');

      // Pop 1 target first so progress is 1
      fireEvent.click(targetBubbles[0]);
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '1');

      // Tap distractor bubble
      const distractor = distractorBubbles[0];
      fireEvent.click(distractor);

      // 1. Invokes playWobbleHint (soft wooden thud)
      expect(audioPort.wobbleHintCount).toBe(1);

      // 2. Wobbles without popping
      expect(distractor).toHaveAttribute('data-popped', 'false');
      expect(distractor).toHaveAttribute('data-wobbling', 'true');

      // 3. No failure reset: progress is preserved!
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '1');
      expect(onComplete).not.toHaveBeenCalled();

      // 4. Highlights a remaining valid target bubble with a golden hint glow
      const hintedTargets = targetBubbles.filter(
        (el) => el.getAttribute('data-hinted') === 'true'
      );
      expect(hintedTargets).toHaveLength(1);
      expect(hintedTargets[0]).toHaveAttribute('data-popped', 'false');
    });

    it('renders bloomed completed card in full bloomed state with all targets popped and water level 3', () => {
      const onComplete = vi.fn();
      render(
        <PhonemeBubblePopCard
          card={cardDataBubblePopA}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={true}
        />
      );

      const waterLevelMeter = screen.getByTestId('sprout-water-level');
      expect(waterLevelMeter).toHaveAttribute('data-water-level', '3');

      const targetBubbles = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'true');

      for (const target of targetBubbles) {
        expect(target).toHaveAttribute('data-popped', 'true');
      }
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

      // Active card is now Lesson 1 Bubble Pop /ă/
      expect(screen.getByText(/Bubble Pop: \/ă\//i)).toBeInTheDocument();
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

    it('completing Phoneme Bubble Pop card at Vine Frontier triggers locked celebration for 2,000ms then auto-advances to next letter card', () => {
      // Start state machine directly at card 1 (Lesson 1 Bubble Pop /ă/) with card 0 already completed
      const stateMachineWithProgress = createGardenStateMachine();
      stateMachineWithProgress.completeActiveCard(); // completes card 0
      stateMachineWithProgress.finishCelebration(); // advances to card 1
      expect(stateMachineWithProgress.getState().activeIndex).toBe(1);

      render(<GardenVineShell stateMachine={stateMachineWithProgress} audioPort={audioPort} />);

      // Verify Bubble Pop card is active
      expect(screen.getByTestId('phoneme-bubble-pop-card-root')).toBeInTheDocument();
      expect(screen.getByText(/Bubble Pop: \/ă\//i)).toBeInTheDocument();

      // Tap 3 target bubbles
      const targetBubbles = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'true');

      fireEvent.click(targetBubbles[0]);
      fireEvent.click(targetBubbles[1]);
      fireEvent.click(targetBubbles[2]);

      // Fanfare played
      expect(audioPort.bloomFanfareCount).toBe(1);

      // Locked celebration
      expect(stateMachineWithProgress.getState().isCelebrationLocked).toBe(true);
      expect(screen.getByTestId('celebration-overlay')).toBeInTheDocument();

      // Advance timer by 2,000ms
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Unlocks and advances to card 2 (Lesson 2 Letter m)
      expect(stateMachineWithProgress.getState().isCelebrationLocked).toBe(false);
      expect(stateMachineWithProgress.getState().frontierIndex).toBe(2);
      expect(stateMachineWithProgress.getState().activeIndex).toBe(2);
      expect(screen.getByText('Letter m')).toBeInTheDocument();
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

      // Celebration auto-advances to Lesson 1 Bubble Pop /ă/
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText(/Bubble Pop: \/ă\//i)).toBeInTheDocument();

      // Complete Lesson 1 Bubble Pop /ă/
      const targetBubblesA = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'true');
      fireEvent.click(targetBubblesA[0]);
      fireEvent.click(targetBubblesA[1]);
      fireEvent.click(targetBubblesA[2]);

      // Celebration auto-advances to Lesson 2 Letter 'm'
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

      // Celebration auto-advances to Lesson 2 Bubble Pop /m/
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText(/Bubble Pop: \/m\//i)).toBeInTheDocument();

      // Complete Lesson 2 Bubble Pop /m/
      const targetBubblesM = screen
        .getAllByTestId(/^bubble-/)
        .filter((el) => el.getAttribute('data-target') === 'true');
      fireEvent.click(targetBubblesM[0]);
      fireEvent.click(targetBubblesM[1]);
      fireEvent.click(targetBubblesM[2]);

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
  });
});
