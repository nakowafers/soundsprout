import React, { useState } from 'react';
import { AudioPort } from '../audio/audioPort';
import { MILESTONE_DEFINITIONS } from '../domain/curriculum';

export interface GreenhouseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedBlossoms: string[];
  unlockedCritters: string[];
  audioPort: AudioPort;
}

export const GreenhouseDrawer: React.FC<GreenhouseDrawerProps> = ({
  isOpen,
  onClose,
  unlockedBlossoms,
  unlockedCritters,
  audioPort,
}) => {
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleItemTap = (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;

    audioPort.playChime();
    setAnimatingId(id);
    setTimeout(() => {
      setAnimatingId(null);
    }, 600);
  };

  const totalCritters = MILESTONE_DEFINITIONS.length;
  const unlockedCount = unlockedCritters.length;

  return (
    <div
      data-testid="greenhouse-drawer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        data-testid="terrarium-container"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          backgroundColor: '#F1F8E9',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          border: '3px solid #81C784',
          borderBottom: 'none',
          boxShadow: '0 -8px 40px rgba(27, 94, 32, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: '#C8E6C9',
            borderBottom: '2px solid #A5D6A7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🏡</span>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#1B5E20',
                  letterSpacing: '-0.3px',
                }}
              >
                Greenhouse Terrarium
              </h2>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#388E3C',
                }}
              >
                {unlockedCount} of {totalCritters} companions roaming
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="greenhouse-drawer-close"
            aria-label="Close Greenhouse Terrarium"
            onClick={onClose}
            style={{
              minWidth: '64px',
              minHeight: '64px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #81C784',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#2E7D32',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Lush Terrarium Habitat Garden */}
        <div
          style={{
            padding: '20px 16px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            backgroundColor: '#E8F5E9',
          }}
        >
          {MILESTONE_DEFINITIONS.map((def) => {
            const isBlossomUnlocked = unlockedBlossoms.includes(def.blossomName);
            const isCritterUnlocked = unlockedCritters.includes(def.critterName);
            const isSlotUnlocked = isBlossomUnlocked || isCritterUnlocked;

            const isBlossomAnimating = animatingId === `blossom-${def.blossomName}`;
            const isCritterAnimating = animatingId === `critter-${def.critterName}`;

            return (
              <div
                key={def.lessonNumber}
                style={{
                  backgroundColor: isSlotUnlocked ? '#FFFFFF' : '#E0E0E0',
                  borderRadius: '24px',
                  border: isSlotUnlocked ? '3px solid #AED581' : '3px dashed #BDBDBD',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: isSlotUnlocked
                    ? '0 6px 16px rgba(51, 105, 30, 0.12)'
                    : 'none',
                  transition: 'transform 0.2s ease',
                }}
              >
                {/* Lesson Badge */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: isSlotUnlocked ? '#2E7D32' : '#757575',
                    backgroundColor: isSlotUnlocked ? '#F1F8E9' : '#EEEEEE',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                  }}
                >
                  Lesson {def.lessonNumber} Reward
                </div>

                {/* Blossom & Critter Habitat Area */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    margin: '8px 0',
                    width: '100%',
                  }}
                >
                  {/* Blossom Button */}
                  <button
                    type="button"
                    data-testid={`blossom-slot-${def.blossomName}`}
                    data-unlocked={isBlossomUnlocked ? 'true' : 'false'}
                    data-silhouette={!isBlossomUnlocked ? 'true' : 'false'}
                    data-animating={isBlossomAnimating ? 'true' : 'false'}
                    aria-label={
                      isBlossomUnlocked
                        ? `Tap ${def.blossomName} to hear chime`
                        : `${def.blossomName} locked silhouette`
                    }
                    onClick={() =>
                      handleItemTap(`blossom-${def.blossomName}`, isBlossomUnlocked)
                    }
                    style={{
                      minWidth: '64px',
                      minHeight: '64px',
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      backgroundColor: isBlossomUnlocked ? '#FFFDE7' : '#BDBDBD',
                      border: isBlossomUnlocked
                        ? '3px solid #FFF176'
                        : '2px solid #9E9E9E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '34px',
                      cursor: isBlossomUnlocked ? 'pointer' : 'default',
                      filter: isBlossomUnlocked
                        ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                        : 'grayscale(100%) opacity(40%)',
                      transform: isBlossomAnimating ? 'scale(1.3) rotate(-10deg)' : 'scale(1)',
                      transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      outline: 'none',
                    }}
                  >
                    {isBlossomUnlocked ? def.blossomEmoji : '🌱'}
                  </button>

                  {/* Critter Button */}
                  <button
                    type="button"
                    data-testid={`critter-slot-${def.critterName}`}
                    data-unlocked={isCritterUnlocked ? 'true' : 'false'}
                    data-silhouette={!isCritterUnlocked ? 'true' : 'false'}
                    data-animating={isCritterAnimating ? 'true' : 'false'}
                    aria-label={
                      isCritterUnlocked
                        ? `Tap ${def.critterName} to hear chime`
                        : `${def.critterName} locked silhouette`
                    }
                    onClick={() =>
                      handleItemTap(`critter-${def.critterName}`, isCritterUnlocked)
                    }
                    style={{
                      minWidth: '64px',
                      minHeight: '64px',
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      backgroundColor: isCritterUnlocked ? '#FFF3E0' : '#BDBDBD',
                      border: isCritterUnlocked
                        ? '3px solid #FFCC80'
                        : '2px solid #9E9E9E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '34px',
                      cursor: isCritterUnlocked ? 'pointer' : 'default',
                      filter: isCritterUnlocked
                        ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
                        : 'grayscale(100%) opacity(40%)',
                      transform: isCritterAnimating ? 'scale(1.35) rotate(15deg)' : 'scale(1)',
                      transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      outline: 'none',
                    }}
                  >
                    {isCritterUnlocked ? def.critterEmoji : '❓'}
                  </button>
                </div>

                {/* Names / Prompt */}
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: isSlotUnlocked ? '#2E7D32' : '#757575',
                    }}
                  >
                    {isSlotUnlocked ? def.blossomName : 'Locked Blossom'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isCritterUnlocked ? '#E65100' : '#9E9E9E',
                    }}
                  >
                    {isCritterUnlocked ? def.critterName : `Reach Lesson ${def.lessonNumber}!`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
