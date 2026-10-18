import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LetterCard } from '../src/components/LetterCard';
import { GardenVineShell } from '../src/components/GardenVineShell';
import { createStubAudioPort, StubAudioPort } from '../src/audio';
import {
  INITIAL_CURRICULUM_CARDS,
  LetterCardData,
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
    const cardDataT: LetterCardData = INITIAL_CURRICULUM_CARDS[3]; // letter 't', stop

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
});
