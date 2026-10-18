import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BubblePopCardData, BubbleItem } from '../domain/types';
import { AudioPort } from '../audio/audioPort';

export interface PhonemeBubblePopCardProps {
  card: BubblePopCardData;
  audioPort: AudioPort;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const PhonemeBubblePopCard: React.FC<PhonemeBubblePopCardProps> = ({
  card,
  audioPort,
  onComplete,
  isCompleted = false,
}) => {
  const targetRequired = card.targetCountRequired ?? 3;

  // Track popped bubble ids
  const [poppedBubbleIds, setPoppedBubbleIds] = useState<string[]>(() =>
    isCompleted
      ? card.bubbles.filter((b) => b.isTarget).map((b) => b.id)
      : []
  );
  const [wobblingBubbleId, setWobblingBubbleId] = useState<string | null>(null);
  const [hintedBubbleId, setHintedBubbleId] = useState<string | null>(null);

  const wobbleTimerRef = useRef<number | null>(null);
  const completedRef = useRef(isCompleted);

  // Announce target phoneme when card enters / mounts
  useEffect(() => {
    audioPort.playPhoneme(card.targetPhoneme);
  }, [audioPort, card.targetPhoneme]);

  // Synchronize when isCompleted prop updates
  useEffect(() => {
    completedRef.current = isCompleted;
    if (isCompleted) {
      setPoppedBubbleIds(
        card.bubbles.filter((b) => b.isTarget).map((b) => b.id)
      );
    }
  }, [isCompleted, card.bubbles]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (wobbleTimerRef.current !== null) {
        window.clearTimeout(wobbleTimerRef.current);
      }
    };
  }, []);

  // Compute current water level
  const targetBubbles = card.bubbles.filter((b) => b.isTarget);
  const poppedTargets = targetBubbles.filter((b) =>
    poppedBubbleIds.includes(b.id)
  );
  const waterLevel = isCompleted
    ? targetRequired
    : Math.min(targetRequired, poppedTargets.length);

  // Tap-to-repeat speaker prompt handler
  const handleRepeatSpeaker = useCallback(() => {
    audioPort.playPhoneme(card.targetPhoneme);
  }, [audioPort, card.targetPhoneme]);

  // Bubble tap handler
  const handleBubbleTap = useCallback(
    (bubble: BubbleItem) => {
      if (completedRef.current) return;
      if (poppedBubbleIds.includes(bubble.id)) return;

      if (bubble.isTarget) {
        // Target bubble tapped: play audio, pop bubble, increment water
        audioPort.playWaterDrop();
        audioPort.playPhoneme(card.targetPhoneme);

        const nextPopped = [...poppedBubbleIds, bubble.id];
        setPoppedBubbleIds(nextPopped);

        // If this bubble was hinted, clear the hint
        if (hintedBubbleId === bubble.id) {
          setHintedBubbleId(null);
        }

        const currentPoppedTargets = targetBubbles.filter((b) =>
          nextPopped.includes(b.id)
        );

        if (currentPoppedTargets.length >= targetRequired) {
          completedRef.current = true;
          onComplete();
        }
      } else {
        // Distractor bubble tapped: No-Fail Positive Scaffolding
        audioPort.playWobbleHint();

        setWobblingBubbleId(bubble.id);
        if (wobbleTimerRef.current !== null) {
          window.clearTimeout(wobbleTimerRef.current);
        }
        wobbleTimerRef.current = window.setTimeout(() => {
          setWobblingBubbleId(null);
          wobbleTimerRef.current = null;
        }, 450);

        // Highlight a remaining unpopped target bubble with golden hint glow
        const remainingTarget = card.bubbles.find(
          (b) => b.isTarget && !poppedBubbleIds.includes(b.id)
        );
        if (remainingTarget) {
          setHintedBubbleId(remainingTarget.id);
        }
      }
    },
    [
      card.bubbles,
      card.targetPhoneme,
      hintedBubbleId,
      onComplete,
      audioPort,
      poppedBubbleIds,
      targetBubbles,
      targetRequired,
    ]
  );

  return (
    <div
      data-testid="phoneme-bubble-pop-card-root"
      className={`bubble-pop-card ${isCompleted ? 'bubble-pop-card-bloomed' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
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
          marginBottom: '6px',
        }}
      >
        {card.title}
      </h2>

      {/* Target Phoneme & Tap-to-Repeat Speaker Prompt */}
      <div
        className="sound-prompt-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '10px',
          backgroundColor: '#E8F5E9',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '2px solid #A5D6A7',
        }}
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#1B5E20',
            letterSpacing: '1px',
          }}
        >
          /{card.targetPhoneme}/
        </span>

        <button
          type="button"
          data-testid="repeat-speaker-button"
          aria-label={`Repeat target sound /${card.targetPhoneme}/`}
          onClick={handleRepeatSpeaker}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '22px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(46, 125, 50, 0.3)',
            transition: 'transform 0.15s ease',
            outline: 'none',
          }}
        >
          🔊
        </button>
      </div>

      {/* Kid Prompt */}
      <p
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#37474F',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        {card.promptText ?? `Pop all 3 bubbles that make the /${card.targetPhoneme}/ sound!`}
      </p>

      {/* 6 Floating Bubbles Field (2 rows of 3) */}
      <div
        className="bubbles-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px 20px',
          justifyItems: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '340px',
          marginBottom: '24px',
        }}
      >
        {card.bubbles.map((bubble) => {
          const isPopped = poppedBubbleIds.includes(bubble.id);
          const isWobbling = wobblingBubbleId === bubble.id;
          const isHinted = hintedBubbleId === bubble.id && !isPopped;

          return (
            <button
              key={bubble.id}
              type="button"
              data-testid={`bubble-${bubble.id}`}
              data-target={bubble.isTarget ? 'true' : 'false'}
              data-popped={isPopped ? 'true' : 'false'}
              data-hinted={isHinted ? 'true' : 'false'}
              data-wobbling={isWobbling ? 'true' : 'false'}
              className={`touch-target-oversized bubble-button ${
                isWobbling ? 'bubble-wobble' : ''
              } ${isHinted ? 'bubble-hint-glow' : ''}`}
              aria-label={
                bubble.accessibleDescription
                  ? `Bubble ${bubble.accessibleDescription}`
                  : `Bubble ${bubble.label}`
              }
              onClick={() => handleBubbleTap(bubble)}
              disabled={isPopped || isCompleted}
              style={{
                width: '76px',
                height: '76px',
                minWidth: '64px',
                minHeight: '64px',
                borderRadius: '50%',
                backgroundColor: isPopped
                  ? '#E0E0E0'
                  : isHinted
                  ? '#FFF9C4'
                  : '#E1F5FE',
                border: isHinted
                  ? '3px solid #FFD700'
                  : isPopped
                  ? '2px dashed #BDBDBD'
                  : '3px solid #81D4FA',
                boxShadow: isHinted
                  ? '0 0 20px 6px #FFD700, 0 4px 12px rgba(255, 215, 0, 0.4)'
                  : isPopped
                  ? 'none'
                  : '0 6px 14px rgba(3, 169, 244, 0.25)',
                transform: isPopped
                  ? 'scale(0.85)'
                  : isWobbling
                  ? 'rotate(-10deg) scale(0.95)'
                  : isHinted
                  ? 'scale(1.08)'
                  : 'scale(1)',
                opacity: isPopped ? 0.35 : 1,
                cursor: isPopped || isCompleted ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: bubble.type === 'letter' ? '32px' : '36px',
                fontWeight: 800,
                color: bubble.type === 'letter' ? '#0277BD' : 'inherit',
                transition:
                  'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                outline: 'none',
              }}
            >
              {isPopped ? '💦' : bubble.label}
            </button>
          );
        })}
      </div>

      {/* Sprout Water Level Indicator */}
      <div
        data-testid="sprout-water-level"
        data-water-level={waterLevel}
        className="sprout-water-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#F1F8E9',
          padding: '12px 20px',
          borderRadius: '20px',
          border: '2px solid #C5E1A5',
          width: '100%',
          maxWidth: '300px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '28px' }}>
            {waterLevel >= targetRequired ? '🌸' : waterLevel >= 2 ? '🌿' : '🌱'}
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#33691E',
            }}
          >
            {waterLevel >= targetRequired
              ? 'Sprout is bloomed!'
              : `Water drops: ${waterLevel}/${targetRequired}`}
          </span>
        </div>

        {/* 3 Water Droplets */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {Array.from({ length: targetRequired }).map((_, idx) => (
            <span
              key={idx}
              data-testid={`water-drop-${idx}`}
              style={{
                fontSize: '22px',
                opacity: idx < waterLevel ? 1 : 0.25,
                transform: idx < waterLevel ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.2s ease, opacity 0.2s ease',
              }}
            >
              💧
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
