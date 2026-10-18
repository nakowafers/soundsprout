import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DecodableStoryCardData } from '../domain/types';
import { AudioPort } from '../audio/audioPort';

export interface DecodableStoryCardProps {
  card: DecodableStoryCardData;
  audioPort: AudioPort;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const DecodableStoryCard: React.FC<DecodableStoryCardProps> = ({
  card,
  audioPort,
  onComplete,
  isCompleted = false,
}) => {
  const [readIndex, setReadIndex] = useState<number>(
    isCompleted ? card.words.length - 1 : -1
  );
  const [wobblingIndex, setWobblingIndex] = useState<number | null>(null);

  const readIndexRef = useRef<number>(readIndex);
  readIndexRef.current = readIndex;

  const wobbleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isCompleted) {
      setReadIndex(card.words.length - 1);
    }
  }, [isCompleted, card.words.length]);

  useEffect(() => {
    return () => {
      if (wobbleTimerRef.current !== null) {
        window.clearTimeout(wobbleTimerRef.current);
      }
    };
  }, []);

  const triggerWobbleHint = useCallback(
    (expectedIndex: number) => {
      audioPort.playWobbleHint();
      setWobblingIndex(expectedIndex);
      if (wobbleTimerRef.current !== null) {
        window.clearTimeout(wobbleTimerRef.current);
      }
      wobbleTimerRef.current = window.setTimeout(() => {
        setWobblingIndex(null);
        wobbleTimerRef.current = null;
      }, 500);
    },
    [audioPort]
  );

  const handleWordClick = (index: number) => {
    const currentRead = readIndexRef.current;
    const nextExpected = currentRead + 1;

    if (index === nextExpected) {
      // In-order tap: advances reading progress
      setReadIndex(index);
      const cleanWord = card.words[index].replace(/[.,!?;:]/g, '');
      audioPort.playWord(cleanWord);

      if (index === card.words.length - 1) {
        // Reached end of sentence: read full fluent sentence and complete card
        audioPort.playWord(card.sentence);
        onComplete();
      }
    } else if (index > nextExpected) {
      // Out-of-order tap: play wobble hint and gently highlight next unread word
      triggerWobbleHint(nextExpected);
    } else if (index <= currentRead) {
      // Already read word tapped: re-voice word for exploration
      const cleanWord = card.words[index].replace(/[.,!?;:]/g, '');
      audioPort.playWord(cleanWord);
    }
  };

  const isAllRead = readIndex >= card.words.length - 1;
  const nextExpectedIndex = isAllRead ? -1 : readIndex + 1;

  return (
    <div
      data-testid="decodable-story-card"
      className="decodable-story-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '16px 8px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {/* Title & Directionality Prompt */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#1B5E20',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>📖</span>
          <span>{card.title}</span>
        </h2>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#388E3C',
          }}
        >
          {isAllRead
            ? 'Wonderful reading! You revealed the whole garden scene!'
            : 'Read from left to right: tap each word to grow the scene!'}
        </p>
      </div>

      {/* Multi-Element SVG Garden Scene Illustration */}
      <div
        data-testid="story-scene-illustration"
        className="story-scene-illustration"
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '190px',
          backgroundColor: '#E8F5E9',
          borderRadius: '24px',
          border: '3px solid #81C784',
          boxShadow: '0 6px 18px rgba(76, 175, 80, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 400 200"
          style={{ width: '100%', height: '100%' }}
          role="img"
          aria-label="Garden Story Scene"
        >
          {/* Background Sky & Garden Lawn */}
          <rect x="0" y="0" width="400" height="130" fill="#E1F5FE" />
          <path
            d="M 0 120 Q 100 110, 200 125 T 400 120 L 400 200 L 0 200 Z"
            fill="#A5D6A7"
          />
          <path
            d="M 0 145 Q 120 135, 240 150 T 400 142 L 400 200 L 0 200 Z"
            fill="#81C784"
          />

          {/* Dynamic Scene Elements for Each Word */}
          {card.words.map((_, index) => {
            const isRevealed = index <= readIndex;

            // Render tailored decorative SVG elements per word index
            if (index === 0) {
              // Word 0: Sprout Character (Sam) pops up
              return (
                <g
                  key={`scene-${index}`}
                  data-testid={`scene-element-${index}`}
                  data-revealed={isRevealed ? 'true' : 'false'}
                  style={{
                    opacity: isRevealed ? 1 : 0.2,
                    transform: isRevealed
                      ? 'translate(0, 0) scale(1)'
                      : 'translate(0, 25px) scale(0.8)',
                    transformOrigin: '75px 145px',
                    transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  {/* Sam the sprout body & head */}
                  <ellipse cx="75" cy="148" rx="22" ry="18" fill="#66BB6A" />
                  <circle cx="75" cy="115" r="20" fill="#81C784" />
                  {/* Sprout seedling leaves on top */}
                  <path
                    d="M 75 95 Q 65 75, 52 82 Q 62 95, 75 95 Z"
                    fill="#4CAF50"
                  />
                  <path
                    d="M 75 95 Q 85 75, 98 82 Q 88 95, 75 95 Z"
                    fill="#4CAF50"
                  />
                  {/* Eyes & Smile */}
                  <circle cx="68" cy="112" r="3" fill="#1B5E20" />
                  <circle cx="82" cy="112" r="3" fill="#1B5E20" />
                  <path
                    d="M 70 122 Q 75 128, 80 122"
                    stroke="#1B5E20"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Cheerful blush */}
                  <ellipse cx="64" cy="120" rx="3.5" ry="2" fill="#FF8A80" opacity="0.7" />
                  <ellipse cx="86" cy="120" rx="3.5" ry="2" fill="#FF8A80" opacity="0.7" />
                </g>
              );
            }

            if (index === 1) {
              // Word 1: Garden Bench / Cozy Log for sitting
              return (
                <g
                  key={`scene-${index}`}
                  data-testid={`scene-element-${index}`}
                  data-revealed={isRevealed ? 'true' : 'false'}
                  style={{
                    opacity: isRevealed ? 1 : 0.2,
                    transform: isRevealed
                      ? 'scale(1)'
                      : 'scale(0.85)',
                    transformOrigin: '150px 155px',
                    transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  <rect
                    x="115"
                    y="142"
                    width="70"
                    height="16"
                    rx="8"
                    fill="#8D6E63"
                  />
                  <rect x="122" y="158" width="6" height="18" rx="2" fill="#5D4037" />
                  <rect x="172" y="158" width="6" height="18" rx="2" fill="#5D4037" />
                  {/* Cozy sitting leaf cushion */}
                  <ellipse cx="150" cy="142" rx="22" ry="6" fill="#C8E6C9" />
                </g>
              );
            }

            if (index === 2) {
              // Word 2: Blooming Garden Flowers & path
              return (
                <g
                  key={`scene-${index}`}
                  data-testid={`scene-element-${index}`}
                  data-revealed={isRevealed ? 'true' : 'false'}
                  style={{
                    opacity: isRevealed ? 1 : 0.2,
                    transform: isRevealed
                      ? 'scale(1) rotate(0deg)'
                      : 'scale(0.8) rotate(-8deg)',
                    transformOrigin: '220px 145px',
                    transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  {/* Stems */}
                  <line x1="210" y1="165" x2="210" y2="135" stroke="#388E3C" strokeWidth="3" />
                  <line x1="235" y1="170" x2="235" y2="128" stroke="#388E3C" strokeWidth="3" />
                  {/* Flower 1: Tulip Pink */}
                  <circle cx="210" cy="132" r="10" fill="#F48FB1" />
                  <circle cx="210" cy="132" r="4" fill="#FCE4EC" />
                  {/* Flower 2: Daisy Yellow */}
                  <circle cx="235" cy="125" r="12" fill="#FFF59D" />
                  <circle cx="235" cy="125" r="5" fill="#FFA000" />
                </g>
              );
            }

            if (index === 3) {
              // Word 3: Fluttering Friendly Butterfly / Sunburst
              return (
                <g
                  key={`scene-${index}`}
                  data-testid={`scene-element-${index}`}
                  data-revealed={isRevealed ? 'true' : 'false'}
                  style={{
                    opacity: isRevealed ? 1 : 0.2,
                    transform: isRevealed
                      ? 'translate(0, 0)'
                      : 'translate(20px, -20px)',
                    transformOrigin: '290px 75px',
                    transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  {/* Sun in upper corner */}
                  <circle cx="350" cy="35" r="22" fill="#FFE082" />
                  <circle cx="350" cy="35" r="15" fill="#FFCA28" />
                  {/* Butterfly */}
                  <ellipse cx="295" cy="75" rx="3" ry="9" fill="#5D4037" />
                  <ellipse cx="288" cy="70" rx="9" ry="7" fill="#80DEEA" />
                  <ellipse cx="302" cy="70" rx="9" ry="7" fill="#80DEEA" />
                  <ellipse cx="289" cy="80" rx="6" ry="5" fill="#4DD0E1" />
                  <ellipse cx="301" cy="80" rx="6" ry="5" fill="#4DD0E1" />
                </g>
              );
            }

            // Word 4+: Woven Garden Mat / Tin Pan / Fan
            return (
              <g
                key={`scene-${index}`}
                data-testid={`scene-element-${index}`}
                data-revealed={isRevealed ? 'true' : 'false'}
                style={{
                  opacity: isRevealed ? 1 : 0.2,
                  transform: isRevealed
                    ? 'scale(1)'
                    : 'scale(0.75)',
                  transformOrigin: '320px 165px',
                  transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              >
                {/* Woven Garden Mat */}
                <ellipse cx="320" cy="165" rx="46" ry="16" fill="#FFE082" />
                <ellipse cx="320" cy="165" rx="40" ry="12" fill="#FFF8E1" />
                <path
                  d="M 285 165 L 355 165 M 300 156 L 340 174 M 300 174 L 340 156"
                  stroke="#FFD54F"
                  strokeWidth="1.5"
                />
                {/* Cheerful Garden Star / Blossom on mat */}
                <circle cx="320" cy="165" r="5" fill="#FF7043" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Story Word Pills (Left-to-Right Print Directionality) */}
      <div
        data-testid="story-words-container"
        className="story-words-container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '440px',
          padding: '16px 12px',
          backgroundColor: '#F1F8E9',
          borderRadius: '24px',
          border: '3px dashed #A5D6A7',
        }}
      >
        {card.words.map((word, index) => {
          const isRead = index <= readIndex;
          const isNextPulsing = index === nextExpectedIndex;
          const isWobbling = index === wobblingIndex;

          return (
            <button
              key={`${word}-${index}`}
              type="button"
              data-testid={`story-word-${index}`}
              data-read={isRead ? 'true' : 'false'}
              data-pulsing={isNextPulsing ? 'true' : 'false'}
              data-wobbling={isWobbling ? 'true' : 'false'}
              className={`story-word-pill touch-target-oversized ${
                isNextPulsing ? 'grapheme-pulse' : ''
              } ${isWobbling ? 'grapheme-wobble' : ''}`}
              onClick={() => handleWordClick(index)}
              style={{
                minHeight: '60px',
                minWidth: '70px',
                padding: '10px 22px',
                borderRadius: '30px',
                border: isRead
                  ? '3px solid #4CAF50'
                  : isNextPulsing
                    ? '3px solid #2E7D32'
                    : isWobbling
                      ? '3px solid #FF7043'
                      : '3px solid #C8E6C9',
                backgroundColor: isRead
                  ? '#C8E6C9'
                  : isNextPulsing
                    ? '#FFFFFF'
                    : '#FAFAFA',
                color: isRead ? '#1B5E20' : '#2E7D32',
                fontSize: '26px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isRead
                  ? '0 4px 12px rgba(76, 175, 80, 0.25)'
                  : isNextPulsing
                    ? '0 0 16px rgba(46, 125, 50, 0.4)'
                    : '0 2px 6px rgba(0, 0, 0, 0.05)',
                transform: isRead ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <span>{word}</span>
              {isRead && <span style={{ fontSize: '18px' }}>🌱</span>}
            </button>
          );
        })}
      </div>

      {/* Completed Fluent Sentence Readout */}
      {isAllRead && (
        <div
          data-testid="completed-story-sentence"
          className="completed-story-sentence"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#E8F5E9',
            border: '3px solid #66BB6A',
            borderRadius: '24px',
            padding: '14px 28px',
            boxShadow: '0 6px 20px rgba(46, 125, 50, 0.2)',
            animation: 'illustrationPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '28px' }}>🌸</span>
          <span
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#1B5E20',
              fontStyle: 'italic',
            }}
          >
            "{card.sentence}"
          </span>
          <span style={{ fontSize: '28px' }}>✨</span>
        </div>
      )}
    </div>
  );
};
