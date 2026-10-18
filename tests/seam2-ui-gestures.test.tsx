import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LetterCard } from '../src/components/LetterCard';
import { MilestoneBlossomCard } from '../src/components/MilestoneBlossomCard';
import { GreenhouseDrawer } from '../src/components/GreenhouseDrawer';
import { GardenVineShell } from '../src/components/GardenVineShell';
import { createStubAudioPort, StubAudioPort } from '../src/audio';
import {
  INITIAL_CURRICULUM_CARDS,
  LetterCardData,
  MilestoneBlossomCardData,
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

  describe('MilestoneBlossomCard: Bloom & Garden Critter Introduction Gesture', () => {
    const blossomCardData: MilestoneBlossomCardData = {
      id: 'lesson-4-milestone',
      lessonNumber: 4,
      type: 'milestone-blossom',
      title: 'Sunburst Daisy & Ladybug Lou',
      blossomName: 'Sunburst Daisy',
      critterName: 'Ladybug Lou',
    };

    it('renders bud state initially with oversized touch target and prompts child to tap', () => {
      const onComplete = vi.fn();
      render(
        <MilestoneBlossomCard
          card={blossomCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      expect(screen.getByTestId('milestone-blossom-card')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-touch-target')).toBeInTheDocument();
      expect(screen.getAllByText(/Sunburst Daisy/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Ladybug Lou/i).length).toBeGreaterThanOrEqual(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('tapping milestone card blooms flower, introduces animated critter, plays fanfare and completes', () => {
      const onComplete = vi.fn();
      render(
        <MilestoneBlossomCard
          card={blossomCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={false}
        />
      );

      const target = screen.getByTestId('milestone-touch-target');
      fireEvent.click(target);

      expect(audioPort.bloomFanfareCount).toBe(1);
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Flower and critter elements are rendered
      expect(screen.getByTestId('milestone-flower')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-critter')).toBeInTheDocument();
    });

    it('renders bloomed state if already completed and triggers replay bloom on tap', () => {
      const onComplete = vi.fn();
      render(
        <MilestoneBlossomCard
          card={blossomCardData}
          audioPort={audioPort}
          onComplete={onComplete}
          isCompleted={true}
        />
      );

      expect(screen.getByTestId('milestone-flower')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-critter')).toBeInTheDocument();

      const target = screen.getByTestId('milestone-touch-target');
      fireEvent.click(target);

      expect(audioPort.bloomFanfareCount).toBe(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('GreenhouseDrawer: Lush Terrarium, Silhouettes & Tap Physics', () => {
    it('renders terrarium slots with silhouettes for locked blossoms and critters', () => {
      const onClose = vi.fn();
      render(
        <GreenhouseDrawer
          isOpen={true}
          onClose={onClose}
          unlockedBlossoms={[]}
          unlockedCritters={[]}
          audioPort={audioPort}
        />
      );

      expect(screen.getByTestId('greenhouse-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('terrarium-container')).toBeInTheDocument();

      // All 4 slots rendered as locked silhouettes
      const ladybug = screen.getByTestId('critter-slot-Ladybug Lou');
      expect(ladybug).toHaveAttribute('data-unlocked', 'false');
      expect(ladybug).toHaveAttribute('data-silhouette', 'true');

      // Tapping locked slot does not play sound
      fireEvent.click(ladybug);
      expect(audioPort.chimeCount).toBe(0);
    });

    it('renders unlocked blossoms and critters, and tapping plays joyful chime with animation', () => {
      const onClose = vi.fn();
      render(
        <GreenhouseDrawer
          isOpen={true}
          onClose={onClose}
          unlockedBlossoms={['Sunburst Daisy']}
          unlockedCritters={['Ladybug Lou']}
          audioPort={audioPort}
        />
      );

      const ladybug = screen.getByTestId('critter-slot-Ladybug Lou');
      expect(ladybug).toHaveAttribute('data-unlocked', 'true');
      expect(ladybug).toHaveAttribute('data-silhouette', 'false');

      const daisy = screen.getByTestId('blossom-slot-Sunburst Daisy');
      expect(daisy).toHaveAttribute('data-unlocked', 'true');

      // Tapping unlocked critter plays chime and triggers animation
      fireEvent.click(ladybug);
      expect(audioPort.chimeCount).toBe(1);
      expect(ladybug).toHaveAttribute('data-animating', 'true');

      // Tapping unlocked blossom also plays chime
      fireEvent.click(daisy);
      expect(audioPort.chimeCount).toBe(2);
      expect(daisy).toHaveAttribute('data-animating', 'true');
    });

    it('close button invokes onClose callback', () => {
      const onClose = vi.fn();
      render(
        <GreenhouseDrawer
          isOpen={true}
          onClose={onClose}
          unlockedBlossoms={['Sunburst Daisy']}
          unlockedCritters={['Ladybug Lou']}
          audioPort={audioPort}
        />
      );

      const closeBtn = screen.getByTestId('greenhouse-drawer-close');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('GardenVineShell Integration: Greenhouse Drawer Toggle & Milestone Blossom Navigation', () => {
    let stateMachine: GardenStateMachine;

    beforeEach(() => {
      stateMachine = createGardenStateMachine();
    });

    it('header renders Greenhouse Drawer toggle button with critter counter badge', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      const toggleBtn = screen.getByTestId('greenhouse-drawer-toggle');
      expect(toggleBtn).toBeInTheDocument();

      const badge = screen.getByTestId('greenhouse-critter-count');
      expect(badge).toHaveTextContent('0');
      expect(screen.queryByTestId('greenhouse-drawer')).not.toBeInTheDocument();
    });

    it('taps header button to slide open and close Greenhouse Drawer without losing scroll position', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      expect(stateMachine.getState().activeIndex).toBe(0);
      expect(stateMachine.getState().frontierIndex).toBe(0);

      // Open drawer
      const toggleBtn = screen.getByTestId('greenhouse-drawer-toggle');
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId('greenhouse-drawer')).toBeInTheDocument();
      expect(stateMachine.getState().activeIndex).toBe(0);

      // Close drawer via close button
      const closeBtn = screen.getByTestId('greenhouse-drawer-close');
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId('greenhouse-drawer')).not.toBeInTheDocument();
      expect(stateMachine.getState().activeIndex).toBe(0);
    });

    it('completing milestone blossom card on the vine unlocks critter, updates header count, and unlocks in terrarium', () => {
      render(<GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />);

      // Fast-forward through lessons 1, 2, 3, 4 letter cards to reach lesson-4-milestone card
      // Card 0: a
      const touchA = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchA);
      act(() => { vi.advanceTimersByTime(1200); });
      fireEvent.pointerUp(touchA);
      act(() => { vi.advanceTimersByTime(2000); });

      // Card 1: m
      const touchM = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchM);
      act(() => { vi.advanceTimersByTime(1200); });
      fireEvent.pointerUp(touchM);
      act(() => { vi.advanceTimersByTime(2000); });

      // Card 2: s
      const touchS = screen.getByTestId('letter-touch-target');
      fireEvent.pointerDown(touchS);
      act(() => { vi.advanceTimersByTime(1200); });
      fireEvent.pointerUp(touchS);
      act(() => { vi.advanceTimersByTime(2000); });

      // Card 3: t (3 seed pod taps)
      const pods = screen.getAllByTestId(/seed-pod-\d/);
      fireEvent.click(pods[0]);
      fireEvent.click(pods[1]);
      fireEvent.click(pods[2]);
      act(() => { vi.advanceTimersByTime(2000); });

      // Active card is now Card 4: Lesson 4 Milestone Blossom!
      expect(screen.getByTestId('milestone-blossom-card')).toBeInTheDocument();
      expect(screen.getAllByText(/Sunburst Daisy/i).length).toBeGreaterThanOrEqual(1);
      expect(stateMachine.getState().activeIndex).toBe(4);

      // Tap Milestone Blossom card to bloom and complete
      const bloomTarget = screen.getByTestId('milestone-touch-target');
      fireEvent.click(bloomTarget);

      // Unlocks Sunburst Daisy and Ladybug Lou
      expect(stateMachine.getState().unlockedBlossoms).toContain('Sunburst Daisy');
      expect(stateMachine.getState().unlockedCritters).toContain('Ladybug Lou');

      // Auto-advance celebration timer
      act(() => { vi.advanceTimersByTime(2000); });

      // Header critter counter badge now displays 1!
      const badge = screen.getByTestId('greenhouse-critter-count');
      expect(badge).toHaveTextContent('1');

      // Open Greenhouse Drawer to inspect terrarium
      const toggleBtn = screen.getByTestId('greenhouse-drawer-toggle');
      fireEvent.click(toggleBtn);

      const ladybugSlot = screen.getByTestId('critter-slot-Ladybug Lou');
      expect(ladybugSlot).toHaveAttribute('data-unlocked', 'true');

      // Tap unlocked critter to hear joyful chime
      const initialChimes = audioPort.chimeCount;
      fireEvent.click(ladybugSlot);
      expect(audioPort.chimeCount).toBe(initialChimes + 1);
    });
  });
});
