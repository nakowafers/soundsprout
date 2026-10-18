import React, { useState, useEffect, useRef } from 'react';
import { HeartWordCardData } from '../domain/types';
import { AudioPort } from '../audio/audioPort';

export interface HeartWordCardProps {
  card: HeartWordCardData;
  audioPort: AudioPort;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const HeartWordCard: React.FC<HeartWordCardProps> = ({
  card,
  audioPort,
  onComplete,
  isCompleted = false,
}) => {
  const [tappedIndices, setTappedIndices] = useState<Set<number>>(
    () => new Set(isCompleted ? card.parts.map((_, i) => i) : [])
  );
  const [sparklingIndex, setSparklingIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(isCompleted);

  const sparkleTimerRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(isFinished);
  isFinishedRef.current = isFinished;

  useEffect(() => {
    if (isCompleted) {
      setTappedIndices(new Set(card.parts.map((_, i) => i)));
      setIsFinished(true);
    }
  }, [isCompleted, card.parts]);

  useEffect(() => {
    return () => {
      if (sparkleTimerRef.current !== null) {
        window.clearTimeout(sparkleTimerRef.current);
      }
    };
  }, []);

  const handlePartClick = (index: number) => {
    const part = card.parts[index];

    // Voice phoneme (regular phoneme for regular part, irregular phoneme for heart part)
    audioPort.playPhoneme(part.phoneme);

    // If heart part, trigger golden sparkle
    if (part.isHeart) {
      setSparklingIndex(index);
      if (sparkleTimerRef.current !== null) {
        window.clearTimeout(sparkleTimerRef.current);
      }
      sparkleTimerRef.current = window.setTimeout(() => {
        setSparklingIndex(null);
        sparkleTimerRef.current = null;
      }, 700);
    }

    const nextTapped = new Set(tappedIndices);
    nextTapped.add(index);
    setTappedIndices(nextTapped);

    // Check if all parts have now been explored
    if (nextTapped.size === card.parts.length && !isFinishedRef.current) {
      setIsFinished(true);
      // Whole word spoken via playWord and card completes
      audioPort.playWord(card.word);
      onComplete();
    }
  };

  const allPartsTapped = isFinished || tappedIndices.size === card.parts.length;

  return (
    <div
      data-testid="heart-word-card"
      className="heart-word-card"
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
            color: '#D84315',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>💛</span>
          <span>{card.title}</span>
        </h2>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#BF360C',
          }}
        >
          {allPartsTapped
            ? `Hooray! You mapped ${card.word} by heart!`
            : 'Tap each sound to map the heart word!'}
        </p>
      </div>

      {/* Orthographic Mapping: Grapheme Parts */}
      <div
        data-testid="heart-word-parts"
        className="heart-word-parts"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          width: '100%',
          maxWidth: '380px',
          padding: '24px 16px',
          backgroundColor: '#FFF8E1',
          borderRadius: '28px',
          border: '3px dashed #FFE082',
        }}
      >
        {card.parts.map((part, index) => {
          const isTapped = tappedIndices.has(index);
          const isSparkling = sparklingIndex === index;

          return (
            <div
              key={`${part.grapheme}-${index}`}
              data-testid={`heart-part-${index}`}
              data-tapped={isTapped ? 'true' : 'false'}
              data-is-heart={part.isHeart ? 'true' : 'false'}
              className={`heart-part-tile touch-target-oversized ${
                part.isHeart ? 'heart-part-pulse' : ''
              }`}
              onClick={() => handlePartClick(index)}
              style={{
                position: 'relative',
                zIndex: 5,
                minWidth: '76px',
                minHeight: '76px',
                padding: '0 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                backgroundColor: isTapped
                  ? part.isHeart
                    ? '#FFE082'
                    : '#C8E6C9'
                  : '#FFFFFF',
                border: part.isHeart
                  ? '3px solid #FFA000'
                  : isTapped
                    ? '3px solid #4CAF50'
                    : '3px solid #E0E0E0',
                boxShadow: part.isHeart
                  ? '0 6px 20px rgba(255, 160, 0, 0.4)'
                  : isTapped
                    ? '0 6px 16px rgba(76, 175, 80, 0.3)'
                    : '0 4px 10px rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transform: isTapped ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              {/* Golden Heart Badge for irregular grapheme */}
              {part.isHeart && (
                <div
                  data-testid="golden-heart-badge"
                  className="golden-heart-badge"
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    backgroundColor: '#FFD54F',
                    border: '2px solid #FFA000',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    boxShadow: '0 2px 8px rgba(255, 160, 0, 0.5)',
                  }}
                >
                  💛
                </div>
              )}

              {/* Sparkle overlay when heart part is tapped */}
              {isSparkling && (
                <div
                  data-testid="heart-sparkle"
                  className="heart-sparkle"
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    right: '-12px',
                    fontSize: '24px',
                    animation: 'sparklePop 0.6s ease-out',
                    pointerEvents: 'none',
                  }}
                >
                  ✨
                </div>
              )}

              {/* Grapheme text */}
              <span
                data-testid={`part-grapheme-${index}`}
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: part.isHeart ? '#E65100' : isTapped ? '#1B5E20' : '#424242',
                  lineHeight: 1,
                  marginTop: part.isHeart ? '6px' : '0',
                }}
              >
                {part.grapheme}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completed Whole Word Representation */}
      {allPartsTapped && (
        <div
          data-testid="completed-heart-word"
          className="completed-heart-word"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#FFF3E0',
            border: '3px solid #FFB74D',
            borderRadius: '24px',
            padding: '14px 32px',
            boxShadow: '0 8px 24px rgba(255, 152, 0, 0.25)',
            marginTop: '8px',
            animation: 'illustrationPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <span style={{ fontSize: '28px' }}>💛</span>
          <span
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#E65100',
              letterSpacing: '1px',
            }}
          >
            {card.word}
          </span>
          <span style={{ fontSize: '28px' }}>✨</span>
        </div>
      )}
    </div>
  );
};
