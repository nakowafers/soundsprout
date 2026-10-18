import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BlendingWordCardData } from '../domain/types';
import { AudioPort } from '../audio/audioPort';
import { getGraphemePhoneme } from '../domain/curriculum';

export interface BlendingWordCardProps {
  card: BlendingWordCardData;
  audioPort: AudioPort;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const BlendingWordCard: React.FC<BlendingWordCardProps> = ({
  card,
  audioPort,
  onComplete,
  isCompleted = false,
}) => {
  const [reachedIndex, setReachedIndex] = useState<number>(
    isCompleted ? card.graphemes.length - 1 : -1
  );
  const [isDragging, setIsDragging] = useState(false);
  const [wobblingIndex, setWobblingIndex] = useState<number | null>(null);
  const [showIllustration, setShowIllustration] = useState<boolean>(isCompleted);

  const reachedIndexRef = useRef<number>(reachedIndex);
  reachedIndexRef.current = reachedIndex;

  const isDraggingRef = useRef<boolean>(isDragging);
  isDraggingRef.current = isDragging;

  const wobbleTimeoutRef = useRef<number | null>(null);

  // Sync if isCompleted prop changes
  useEffect(() => {
    if (isCompleted) {
      setReachedIndex(card.graphemes.length - 1);
      setShowIllustration(true);
    }
  }, [isCompleted, card.graphemes.length]);

  useEffect(() => {
    return () => {
      if (wobbleTimeoutRef.current !== null) {
        window.clearTimeout(wobbleTimeoutRef.current);
      }
    };
  }, []);

  const triggerWobbleHint = useCallback(
    (nextExpected: number) => {
      audioPort.playWobbleHint();
      setWobblingIndex(nextExpected);
      if (wobbleTimeoutRef.current !== null) {
        window.clearTimeout(wobbleTimeoutRef.current);
      }
      wobbleTimeoutRef.current = window.setTimeout(() => {
        setWobblingIndex(null);
        wobbleTimeoutRef.current = null;
      }, 500);
    },
    [audioPort]
  );

  const advanceToGrapheme = useCallback(
    (index: number) => {
      const current = reachedIndexRef.current;
      const nextExpected = current + 1;

      if (index === nextExpected) {
        // Correct progression in sequence
        setReachedIndex(index);
        const phoneme = getGraphemePhoneme(card.graphemes[index]);
        audioPort.playPhoneme(phoneme);

        if (index === card.graphemes.length - 1) {
          // Reached final grapheme: voice full blended word, reveal illustration, complete card
          audioPort.playWord(card.word);
          setShowIllustration(true);
          onComplete();
        }
      } else if (index > nextExpected) {
        // Tapped or reached out of order -> gentle wobble hint on next expected
        triggerWobbleHint(nextExpected);
      } else if (index <= current) {
        // Already reached tile tapped -> re-voice pure phoneme for toddler exploration
        const phoneme = getGraphemePhoneme(card.graphemes[index]);
        audioPort.playPhoneme(phoneme);
      }
    },
    [card.graphemes, card.word, audioPort, onComplete, triggerWobbleHint]
  );

  const handleTilePointerDown = (index: number) => {
    setIsDragging(true);
    advanceToGrapheme(index);
  };

  const handleTilePointerEnter = (index: number) => {
    if (isDraggingRef.current) {
      advanceToGrapheme(index);
    }
  };

  const handleTileClick = (index: number) => {
    advanceToGrapheme(index);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const totalGraphemes = card.graphemes.length;
  const isFinished = reachedIndex >= totalGraphemes - 1;
  const nextExpectedIndex = isFinished ? -1 : reachedIndex + 1;

  // Percentage along track for slider buddy
  const progressRatio =
    totalGraphemes <= 1
      ? 0.5
      : reachedIndex < 0
        ? 0
        : reachedIndex / (totalGraphemes - 1);

  return (
    <div
      data-testid="blending-word-card"
      className="blending-word-card"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '16px 8px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {/* Title & Prompt */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#2E7D32',
            marginBottom: '4px',
          }}
        >
          {card.title}
        </h2>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#558B2F',
          }}
        >
          {isFinished
            ? `Hooray! You blended ${card.word}!`
            : 'Slide or tap across the sounds to blend the word!'}
        </p>
      </div>

      {/* Horizontal Garden Track & Grapheme Tiles */}
      <div
        data-testid="blending-track"
        className="blending-track"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          width: '100%',
          maxWidth: '380px',
          padding: '24px 16px',
          backgroundColor: '#F1F8E9',
          borderRadius: '28px',
          border: '3px dashed #A5D6A7',
        }}
      >
        {/* Horizontal Track Vine Line behind tiles */}
        <div
          style={{
            position: 'absolute',
            left: '32px',
            right: '32px',
            top: '50%',
            height: '8px',
            backgroundColor: '#C8E6C9',
            borderRadius: '4px',
            zIndex: 1,
            transform: 'translateY(-50%)',
          }}
        />

        {/* Highlighted connected track segment up to reachedIndex */}
        {reachedIndex >= 0 && (
          <div
            style={{
              position: 'absolute',
              left: '32px',
              width: `calc((100% - 64px) * ${progressRatio})`,
              top: '50%',
              height: '8px',
              backgroundColor: '#66BB6A',
              borderRadius: '4px',
              zIndex: 2,
              transform: 'translateY(-50%)',
              transition: 'width 0.25s ease-out',
            }}
          />
        )}

        {/* Draggable Slider Buddy positioned along track */}
        <div
          data-testid="slider-buddy"
          className="slider-buddy"
          style={{
            position: 'absolute',
            top: '-18px',
            left: `calc(32px + (100% - 64px) * ${progressRatio})`,
            transform: 'translateX(-50%)',
            zIndex: 10,
            transition: 'left 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '2px solid #4CAF50',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
          }}
        >
          <span style={{ fontSize: '24px' }}>{isFinished ? '🌸' : '🌱'}</span>
        </div>

        {/* Grapheme Tiles */}
        {card.graphemes.map((grapheme, index) => {
          const isIlluminated = index <= reachedIndex;
          const isNextPulsing = index === nextExpectedIndex;
          const isWobbling = index === wobblingIndex;

          return (
            <div
              key={`${grapheme}-${index}`}
              data-testid={`grapheme-tile-${index}`}
              data-illuminated={isIlluminated ? 'true' : 'false'}
              data-pulsing={isNextPulsing ? 'true' : 'false'}
              data-wobbling={isWobbling ? 'true' : 'false'}
              className={`grapheme-tile touch-target-oversized ${
                isNextPulsing ? 'grapheme-pulse' : ''
              } ${isWobbling ? 'grapheme-wobble' : ''}`}
              onPointerDown={() => handleTilePointerDown(index)}
              onPointerEnter={() => handleTilePointerEnter(index)}
              onClick={() => handleTileClick(index)}
              style={{
                position: 'relative',
                zIndex: 5,
                width: '76px',
                height: '76px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                backgroundColor: isIlluminated ? '#FFD54F' : '#FFFFFF',
                border: isIlluminated
                  ? '3px solid #FFA000'
                  : isNextPulsing
                    ? '3px solid #4CAF50'
                    : '3px solid #C8E6C9',
                boxShadow: isIlluminated
                  ? '0 6px 20px rgba(255, 160, 0, 0.45)'
                  : isNextPulsing
                    ? '0 0 16px rgba(76, 175, 80, 0.4)'
                    : '0 4px 10px rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transform: isIlluminated ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <span
                data-testid={`grapheme-${index}`}
                style={{
                  fontSize: '38px',
                  fontWeight: 800,
                  color: isIlluminated ? '#3E2723' : '#2E7D32',
                  lineHeight: 1,
                }}
              >
                {grapheme}
              </span>
            </div>
          );
        })}
      </div>

      {/* Revealed Friendly Word Illustration */}
      {showIllustration && (
        <div
          data-testid="word-illustration"
          className="word-illustration-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F1F8E9',
            border: '3px solid #81C784',
            borderRadius: '24px',
            padding: '16px 36px',
            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
            marginTop: '8px',
            animation: 'illustrationPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          {card.illustration && (
            <span style={{ fontSize: '56px', lineHeight: 1 }}>
              {card.illustration}
            </span>
          )}
          <span
            data-testid="blended-word-text"
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#2E7D32',
              letterSpacing: '1px',
            }}
          >
            {card.word}
          </span>
        </div>
      )}
    </div>
  );
};
