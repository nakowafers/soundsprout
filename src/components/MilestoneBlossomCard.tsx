import React, { useState } from 'react';
import { MilestoneBlossomCardData } from '../domain/types';
import { MILESTONE_DEFINITIONS } from '../domain/curriculum';
import { AudioPort } from '../audio/audioPort';

export interface MilestoneBlossomCardProps {
  card: MilestoneBlossomCardData;
  audioPort: AudioPort;
  onComplete: () => void;
  isCompleted: boolean;
}

export const MilestoneBlossomCard: React.FC<MilestoneBlossomCardProps> = ({
  card,
  audioPort,
  onComplete,
  isCompleted,
}) => {
  const [bloomed, setBloomed] = useState<boolean>(isCompleted);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const isActuallyBloomed = bloomed || isCompleted;
  const milestoneDef = MILESTONE_DEFINITIONS.find(
    (def) => def.blossomName === card.blossomName || def.lessonNumber === card.lessonNumber
  );
  const flowerEmoji = milestoneDef?.blossomEmoji ?? '🌸';
  const critterEmoji = milestoneDef?.critterEmoji ?? '✨';

  const handleTap = () => {
    audioPort.playBloomFanfare();
    setBloomed(true);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
    onComplete();
  };

  return (
    <div
      data-testid="milestone-blossom-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '16px 8px',
        userSelect: 'none',
      }}
    >
      {/* Milestone Badge Header */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          backgroundColor: '#FFF9C4',
          border: '2px solid #FBC02D',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 800,
          color: '#F57F17',
          marginBottom: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span>🌟</span>
        <span>Lesson {card.lessonNumber} Milestone Checkpoint</span>
      </div>

      <h2
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#2E7D32',
          margin: '0 0 4px',
        }}
      >
        {card.title}
      </h2>

      <p
        style={{
          fontSize: '15px',
          color: '#558B2F',
          margin: '0 0 20px',
          fontWeight: 600,
        }}
      >
        {isActuallyBloomed
          ? `Your ${card.blossomName} is blooming and ${card.critterName} has joined your greenhouse!`
          : `Tap to bloom your ${card.blossomName} and welcome ${card.critterName}!`}
      </p>

      {/* Large Toddler Touch Target Button */}
      <button
        type="button"
        data-testid="milestone-touch-target"
        aria-label={`Bloom ${card.blossomName} and meet ${card.critterName}`}
        onClick={handleTap}
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: isActuallyBloomed ? '#FFF8E1' : '#E8F5E9',
          border: isActuallyBloomed ? '6px solid #FFD54F' : '6px dashed #81C784',
          boxShadow: isActuallyBloomed
            ? '0 12px 32px rgba(255, 179, 0, 0.35)'
            : '0 8px 24px rgba(76, 175, 80, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
          position: 'relative',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isAnimating ? 'scale(1.15) rotate(4deg)' : 'scale(1)',
        }}
      >
        {isActuallyBloomed ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <span
              data-testid="milestone-flower"
              style={{
                fontSize: '64px',
                lineHeight: 1,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                animation: isAnimating ? 'bounce 0.6s infinite' : 'none',
              }}
            >
              {flowerEmoji}
            </span>
            <span
              data-testid="milestone-critter"
              style={{
                fontSize: '44px',
                lineHeight: 1,
                position: 'absolute',
                top: '-12px',
                right: '-24px',
                transform: isAnimating ? 'scale(1.2) rotate(15deg)' : 'scale(1)',
                transition: 'transform 0.2s ease-out',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
              }}
            >
              {critterEmoji}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '56px', lineHeight: 1 }}>🌱</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#2E7D32',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Tap to Bloom
            </span>
          </div>
        )}
      </button>

      {/* Discovery Details Footer */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#33691E',
            backgroundColor: '#DCEDC8',
            padding: '6px 14px',
            borderRadius: '16px',
          }}
        >
          Flower: {card.blossomName}
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#E65100',
            backgroundColor: '#FFE0B2',
            padding: '6px 14px',
            borderRadius: '16px',
          }}
        >
          Companion: {card.critterName}
        </span>
      </div>
    </div>
  );
};
