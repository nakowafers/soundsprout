import React from 'react';
import { MouthState } from '../domain/types';

interface SproutMouthAvatarProps {
  mouthState: MouthState;
  size?: number;
}

export const SproutMouthAvatar: React.FC<SproutMouthAvatarProps> = ({
  mouthState,
  size = 140,
}) => {
  // Render articulatory mouth shapes based on mouthState
  const renderMouthShape = () => {
    switch (mouthState) {
      case 'open-wide':
        // Big open oval mouth for /ă/
        return (
          <ellipse
            cx="60"
            cy="70"
            rx="18"
            ry="22"
            fill="#D32F2F"
            stroke="#5D1010"
            strokeWidth="3"
          />
        );
      case 'lips-pressed':
        // Straight pressed lips line for /m/
        return (
          <path
            d="M 44 68 Q 60 70 76 68"
            stroke="#D32F2F"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        );
      case 'teeth-hiss':
        // Slight open smile showing teeth for /s/
        return (
          <g>
            <path
              d="M 45 66 Q 60 76 75 66 Z"
              fill="#D32F2F"
              stroke="#5D1010"
              strokeWidth="2"
            />
            {/* White teeth bar */}
            <rect
              x="50"
              y="66"
              width="20"
              height="4"
              rx="1"
              fill="#FFFFFF"
            />
          </g>
        );
      case 'tongue-tap':
        // Mouth open showing tongue touching behind upper teeth for /t/
        return (
          <g>
            <path
              d="M 46 64 Q 60 80 74 64 Z"
              fill="#4A1515"
              stroke="#5D1010"
              strokeWidth="2"
            />
            {/* Upper teeth */}
            <rect x="52" y="64" width="16" height="3" fill="#FFFFFF" />
            {/* Tongue elevated tapping top */}
            <ellipse cx="60" cy="68" rx="7" ry="5" fill="#FF5252" />
          </g>
        );
      case 'lip-pop':
        // Puckered circular lips for /p/
        return (
          <ellipse
            cx="60"
            cy="70"
            rx="10"
            ry="9"
            fill="#D32F2F"
            stroke="#5D1010"
            strokeWidth="3"
          />
        );
      case 'lip-bite-air':
        // Upper teeth resting on lower lip for /f/
        return (
          <g>
            <path
              d="M 46 72 Q 60 75 74 72"
              stroke="#D32F2F"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="53" y="67" width="14" height="5" rx="1" fill="#FFFFFF" />
          </g>
        );
      case 'smile-short-i':
        // Wide smiling mouth for /ĭ/
        return (
          <path
            d="M 42 66 Q 60 78 78 66"
            stroke="#D32F2F"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        );
      case 'tongue-hum':
      default:
        // Gentle smiling closed mouth
        return (
          <path
            d="M 46 68 Q 60 75 74 68"
            stroke="#D32F2F"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        );
    }
  };

  return (
    <div
      data-testid="sprout-mouth-avatar"
      data-mouth-state={mouthState}
      className="sprout-avatar-container"
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="sprout-avatar-svg"
      >
        {/* Seedling Leaves on head */}
        <g className="sprout-leaves">
          <path
            d="M 60 30 C 50 10 30 15 38 30 C 45 35 55 32 60 30 Z"
            fill="#4CAF50"
            stroke="#2E7D32"
            strokeWidth="2"
          />
          <path
            d="M 60 30 C 70 8 92 14 84 30 C 76 35 66 32 60 30 Z"
            fill="#66BB6A"
            stroke="#2E7D32"
            strokeWidth="2"
          />
          {/* Stem */}
          <path
            d="M 60 28 Q 60 38 60 42"
            stroke="#2E7D32"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Sprout Head (gentle warm seed / sprout body) */}
        <ellipse
          cx="60"
          cy="66"
          rx="38"
          ry="34"
          fill="#FFF9C4"
          stroke="#FBC02D"
          strokeWidth="3"
        />

        {/* Rosy toddler cheeks */}
        <circle cx="36" cy="68" r="6" fill="#FFCDD2" opacity="0.8" />
        <circle cx="84" cy="68" r="6" fill="#FFCDD2" opacity="0.8" />

        {/* Big expressive friendly eyes */}
        <g className="sprout-eyes">
          <ellipse cx="45" cy="52" rx="4.5" ry="6" fill="#212121" />
          <circle cx="43.5" cy="50" r="1.8" fill="#FFFFFF" />

          <ellipse cx="75" cy="52" rx="4.5" ry="6" fill="#212121" />
          <circle cx="73.5" cy="50" r="1.8" fill="#FFFFFF" />
        </g>

        {/* Articulatory mouth shape */}
        {renderMouthShape()}
      </svg>
    </div>
  );
};
