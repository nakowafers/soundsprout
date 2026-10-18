import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GardenStateMachine } from '../state/gardenStateMachine';
import { AudioPort } from '../audio/audioPort';
import {
  GardenSessionState,
  LetterCardData,
  BlendingWordCardData,
  HeartWordCardData,
  DecodableStoryCardData,
} from '../domain/types';
import { LetterCard } from './LetterCard';
import { BlendingWordCard } from './BlendingWordCard';
import { HeartWordCard } from './HeartWordCard';
import { DecodableStoryCard } from './DecodableStoryCard';
import { ReturnToFrontierPill } from './ReturnToFrontierPill';
import { CelebrationOverlay } from './CelebrationOverlay';

export interface GardenVineShellProps {
  stateMachine: GardenStateMachine;
  audioPort: AudioPort;
}

export const GardenVineShell: React.FC<GardenVineShellProps> = ({
  stateMachine,
  audioPort,
}) => {
  const [sessionState, setSessionState] = useState<GardenSessionState>(
    stateMachine.getState()
  );
  const [isBouncing, setIsBouncing] = useState(false);
  const bounceTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  // Subscribe to state machine updates
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((nextState) => {
      setSessionState(nextState);
    });
    return () => {
      unsubscribe();
      if (bounceTimerRef.current !== null) {
        window.clearTimeout(bounceTimerRef.current);
      }
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, [stateMachine]);

  const triggerBounce = useCallback(() => {
    setIsBouncing(true);
    if (bounceTimerRef.current !== null) {
      window.clearTimeout(bounceTimerRef.current);
    }
    bounceTimerRef.current = window.setTimeout(() => {
      setIsBouncing(false);
      bounceTimerRef.current = null;
    }, 350);
  }, []);

  const handleCardComplete = useCallback(() => {
    audioPort.playBloomFanfare();
    const result = stateMachine.completeActiveCard();

    if (result.isAutoAdvancing) {
      // 2,000ms Locked Celebration Auto-Advance (ADR-0001)
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current);
      }
      celebrationTimerRef.current = window.setTimeout(() => {
        stateMachine.finishCelebration();
        celebrationTimerRef.current = null;
      }, 2000);
    }
  }, [audioPort, stateMachine]);

  // Touch Gesture Handling for Vertical Snap-Scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (sessionState.isCelebrationLocked) return;
    if (e.touches.length > 0) {
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (sessionState.isCelebrationLocked) return;
    if (e.touches.length > 0) {
      touchCurrentY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (sessionState.isCelebrationLocked) return;
    if (touchStartY.current !== null && touchCurrentY.current !== null) {
      const deltaY = touchCurrentY.current - touchStartY.current;
      const swipeThreshold = 35; // Minimum drag to trigger card transition

      if (deltaY < -swipeThreshold) {
        // Swiping upward -> navigate down the vine to next card
        const result = stateMachine.scrollTo(sessionState.activeIndex + 1);
        if (result.clamped) {
          triggerBounce();
        }
      } else if (deltaY > swipeThreshold) {
        // Swiping downward -> navigate up the vine to previous card
        stateMachine.scrollTo(sessionState.activeIndex - 1);
      }
    }
    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  const activeCard = sessionState.cards[sessionState.activeIndex];
  const isCurrentCardCompleted = activeCard
    ? sessionState.completedCardIds.includes(activeCard.id)
    : false;

  const isBelowFrontier = sessionState.activeIndex < sessionState.frontierIndex;

  return (
    <div
      data-testid="garden-vine-viewport"
      data-bouncing={isBouncing ? 'true' : 'false'}
      className={`garden-vine-viewport ${isBouncing ? 'vine-elastic-bounce' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#E8F5E9',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Garden Header */}
      <header
        className="garden-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          backgroundColor: '#FFFFFF',
          borderBottom: '2px solid #C8E6C9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🌱</span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#2E7D32',
              letterSpacing: '-0.5px',
            }}
          >
            SoundSprout
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4CAF50',
              backgroundColor: '#E8F5E9',
              padding: '6px 12px',
              borderRadius: '16px',
            }}
          >
            Lesson {activeCard ? activeCard.lessonNumber : 1}
          </span>
        </div>
      </header>

      {/* Vertical Garden Vine Trail Graphic Background */}
      <div
        className="garden-vine-track"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '24px 16px 80px',
        }}
      >
        {/* Active Card Container */}
        <main
          data-testid="active-card-container"
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(46, 125, 50, 0.12)',
            border: '3px solid #A5D6A7',
            padding: '20px 16px',
            position: 'relative',
            zIndex: 5,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isBouncing ? 'translateY(-24px)' : 'translateY(0)',
          }}
        >
          {activeCard && activeCard.type === 'letter' && (
            <LetterCard
              card={activeCard as LetterCardData}
              audioPort={audioPort}
              onComplete={handleCardComplete}
              isCompleted={isCurrentCardCompleted}
            />
          )}
          {activeCard && activeCard.type === 'blending-word' && (
            <BlendingWordCard
              card={activeCard as BlendingWordCardData}
              audioPort={audioPort}
              onComplete={handleCardComplete}
              isCompleted={isCurrentCardCompleted}
            />
          )}
          {activeCard && activeCard.type === 'heart-word' && (
            <HeartWordCard
              card={activeCard as HeartWordCardData}
              audioPort={audioPort}
              onComplete={handleCardComplete}
              isCompleted={isCurrentCardCompleted}
            />
          )}
          {activeCard && activeCard.type === 'decodable-story' && (
            <DecodableStoryCard
              card={activeCard as DecodableStoryCardData}
              audioPort={audioPort}
              onComplete={handleCardComplete}
              isCompleted={isCurrentCardCompleted}
            />
          )}
        </main>
      </div>

      {/* Floating Return to Frontier Pill when browsing earlier bloomed cards */}
      {isBelowFrontier && (
        <ReturnToFrontierPill
          onReturn={() => stateMachine.returnToFrontier()}
          frontierCardTitle={sessionState.cards[sessionState.frontierIndex]?.title}
        />
      )}

      {/* Locked Celebration Auto-Advance Overlay */}
      {sessionState.isCelebrationLocked && <CelebrationOverlay />}
    </div>
  );
};
