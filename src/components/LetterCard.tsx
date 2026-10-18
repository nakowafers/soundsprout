import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LetterCardData } from '../domain/types';
import { AudioPort } from '../audio/audioPort';
import { SproutMouthAvatar } from './SproutMouthAvatar';

export interface LetterCardProps {
  card: LetterCardData;
  audioPort: AudioPort;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const LetterCard: React.FC<LetterCardProps> = ({
  card,
  audioPort,
  onComplete,
  isCompleted = false,
}) => {
  const isContinuous = card.phonemeClassification === 'continuous';
  const cleanPhoneme = card.phoneme.replace(/[/]/g, '');
  const totalHoldMs = card.holdDurationMs ?? 1200;
  const totalPodsRequired = card.seedPodTapsRequired ?? 3;

  // Continuous Phoneme Hold State
  const [accumulatedHoldMs, setAccumulatedHoldMs] = useState(
    isCompleted ? totalHoldMs : 0
  );
  const accumulatedRef = useRef(isCompleted ? totalHoldMs : 0);
  const [isHolding, setIsHolding] = useState(false);
  const isHoldingRef = useRef(false);
  const holdIntervalRef = useRef<number | null>(null);
  const completedRef = useRef(isCompleted);

  // Stop Phoneme Pods State
  const poppedPodsRef = useRef<boolean[]>(
    isCompleted
      ? Array(totalPodsRequired).fill(true)
      : Array(totalPodsRequired).fill(false)
  );
  const [poppedPods, setPoppedPods] = useState<boolean[]>(poppedPodsRef.current);

  useEffect(() => {
    completedRef.current = isCompleted;
    if (isCompleted) {
      accumulatedRef.current = totalHoldMs;
      setAccumulatedHoldMs(totalHoldMs);
      const allTrue = Array(totalPodsRequired).fill(true);
      poppedPodsRef.current = allTrue;
      setPoppedPods(allTrue);
    }
  }, [isCompleted, totalHoldMs, totalPodsRequired]);

  // Clean up timer & audio strictly on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current !== null) {
        window.clearInterval(holdIntervalRef.current);
      }
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        audioPort.stopContinuousPhoneme();
      }
    };
  }, [audioPort]);

  // Handle Continuous Press-and-Hold
  const handleHoldStart = useCallback(() => {
    if (completedRef.current) return;
    isHoldingRef.current = true;
    setIsHolding(true);
    audioPort.startContinuousPhoneme(card.phoneme);

    const stepMs = 50;
    holdIntervalRef.current = window.setInterval(() => {
      accumulatedRef.current += stepMs;
      if (accumulatedRef.current >= totalHoldMs) {
        accumulatedRef.current = totalHoldMs;
        setAccumulatedHoldMs(totalHoldMs);
        if (holdIntervalRef.current !== null) {
          window.clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;
        }
        if (isHoldingRef.current) {
          isHoldingRef.current = false;
          setIsHolding(false);
          audioPort.stopContinuousPhoneme();
        }
        completedRef.current = true;
        onComplete();
      } else {
        setAccumulatedHoldMs(accumulatedRef.current);
      }
    }, stepMs);
  }, [card.phoneme, totalHoldMs, audioPort, onComplete]);

  const handleHoldEnd = useCallback(() => {
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsHolding(false);
      audioPort.stopContinuousPhoneme();
    }
  }, [audioPort]);

  // Handle Stop Phoneme Pod Tap
  const handlePodTap = useCallback(
    (index: number) => {
      if (completedRef.current || poppedPodsRef.current[index]) return;

      audioPort.playPhoneme(card.phoneme);
      audioPort.playPop();

      const newPopped = [...poppedPodsRef.current];
      newPopped[index] = true;
      poppedPodsRef.current = newPopped;
      setPoppedPods(newPopped);

      if (newPopped.every(Boolean)) {
        completedRef.current = true;
        onComplete();
      }
    },
    [card.phoneme, audioPort, onComplete]
  );

  const holdProgressFraction = Math.min(1, accumulatedHoldMs / totalHoldMs);

  return (
    <div
      className={`letter-card ${isCompleted ? 'letter-card-bloomed' : ''}`}
      data-testid="letter-card-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        maxWidth: '480px',
        margin: '0 auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Title */}
      <h2
        className="card-title"
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#2E7D32',
          marginBottom: '8px',
        }}
      >
        {card.title}
      </h2>

      {/* Upper/Lower Grapheme Header */}
      <div
        className="grapheme-display-container"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '16px',
          marginBottom: '12px',
        }}
      >
        <span
          className="grapheme-lowercase"
          style={{
            fontSize: '84px',
            fontWeight: 800,
            color: '#2E7D32',
            lineHeight: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {card.grapheme}
        </span>
        <span
          className="grapheme-uppercase"
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#66BB6A',
            lineHeight: 1,
          }}
        >
          {card.uppercase}
        </span>
      </div>

      {/* Sprout Mouth Avatar with Articulatory Guidance */}
      <div
        className="avatar-and-prompt"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <SproutMouthAvatar mouthState={card.articulatoryCue.mouthState} />
        <p
          className="articulatory-kid-prompt"
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#37474F',
            textAlign: 'center',
            marginTop: '8px',
            maxWidth: '320px',
          }}
        >
          {card.articulatoryCue.kidPrompt}
        </p>
      </div>

      {/* Gesture Physics Interactive Target */}
      {isContinuous ? (
        // Continuous Phoneme: Press-and-Hold
        <div
          className="continuous-hold-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <button
            type="button"
            data-testid="letter-touch-target"
            className="touch-target-oversized continuous-hold-button"
            onPointerDown={handleHoldStart}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
            onPointerCancel={handleHoldEnd}
            aria-label={`Hold to make the /${card.phoneme}/ sound`}
            style={{
              width: '120px',
              height: '120px',
              minWidth: '64px',
              minHeight: '64px',
              borderRadius: '50%',
              backgroundColor: isHolding ? '#81C784' : '#4CAF50',
              border: '4px solid #2E7D32',
              boxShadow: isHolding
                ? '0 0 20px #81C784, inset 0 2px 6px rgba(0,0,0,0.2)'
                : '0 6px 14px rgba(46, 125, 50, 0.35)',
              transform: isHolding ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'none',
              outline: 'none',
            }}
          >
            <span
              style={{
                fontSize: '44px',
                lineHeight: 1,
              }}
            >
              {isCompleted || holdProgressFraction >= 1 ? '🌸' : '🌱'}
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginTop: '4px',
                letterSpacing: '0.5px',
              }}
            >
              {isCompleted ? 'BLOOMED!' : isHolding ? 'HOLDING...' : 'HOLD ME'}
            </span>
          </button>

          {/* Cumulative Progress Bar (preserves progress across brief releases) */}
          <div
            data-testid="hold-progress-bar"
            data-progress-ms={accumulatedHoldMs}
            style={{
              width: '240px',
              height: '16px',
              backgroundColor: '#E0E0E0',
              borderRadius: '8px',
              overflow: 'hidden',
              marginTop: '16px',
              border: '2px solid #81C784',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${holdProgressFraction * 100}%`,
                backgroundColor: '#43A047',
                borderRadius: '6px',
                transition: isHolding ? 'width 0.05s linear' : 'none',
              }}
            />
          </div>
        </div>
      ) : (
        // Stop Phoneme: 3 Tactile Seed Pod Taps
        <div
          className="stop-phoneme-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <p
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#4E342E',
              marginBottom: '16px',
            }}
          >
            Pop all 3 seed pods: /{cleanPhoneme}/ /{cleanPhoneme}/ /{cleanPhoneme}/!
          </p>
          <div
            className="seed-pods-row"
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {poppedPods.map((isPopped, idx) => (
              <button
                key={idx}
                type="button"
                data-testid={`seed-pod-${idx}`}
                className="touch-target-oversized seed-pod-button"
                onClick={() => handlePodTap(idx)}
                aria-label={`Pop seed pod ${idx + 1}`}
                style={{
                  width: '80px',
                  height: '80px',
                  minWidth: '64px',
                  minHeight: '64px',
                  borderRadius: '50%',
                  backgroundColor: isPopped ? '#FFF59D' : '#8D6E63',
                  border: isPopped ? '4px solid #FBC02D' : '4px solid #5D4037',
                  boxShadow: isPopped
                    ? '0 0 12px #FFF59D'
                    : '0 5px 10px rgba(0,0,0,0.25)',
                  transform: isPopped ? 'scale(0.92)' : 'scale(1)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                  cursor: isPopped ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  outline: 'none',
                }}
              >
                {isPopped ? '✨' : '🌰'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
