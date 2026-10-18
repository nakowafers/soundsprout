import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface ParentGateButtonProps {
  onOpen: () => void;
  holdDurationMs?: number;
}

export const ParentGateButton: React.FC<ParentGateButtonProps> = ({
  onOpen,
  holdDurationMs = 3000,
}) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);

  const resetHold = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedMsRef.current = 0;
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      resetHold();
    };
  }, [resetHold]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button if button is specified
    if (e.button !== undefined && e.button !== 0) return;

    resetHold();
    accumulatedMsRef.current = 0;
    const stepMs = 50;

    intervalRef.current = window.setInterval(() => {
      accumulatedMsRef.current += stepMs;
      const pct = Math.min(100, (accumulatedMsRef.current / holdDurationMs) * 100);
      setProgress(pct);

      if (accumulatedMsRef.current >= holdDurationMs) {
        onOpen();
        resetHold();
      }
    }, stepMs);
  };

  const handlePointerUp = () => {
    resetHold();
  };

  const handlePointerLeave = () => {
    resetHold();
  };

  const handlePointerCancel = () => {
    resetHold();
  };

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <button
      type="button"
      data-testid="parent-gate-button"
      aria-label="Educator Settings (Hold 3 seconds)"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#F5F5F5',
        border: '2px solid #E0E0E0',
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        style={{
          position: 'absolute',
          top: -2,
          left: -2,
          pointerEvents: 'none',
        }}
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#E0E0E0"
          strokeWidth="3"
        />
        <circle
          data-testid="parent-gate-progress-ring"
          data-progress={Math.round(progress)}
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{
            transition: progress === 0 ? 'none' : 'stroke-dashoffset 0.05s linear',
          }}
        />
      </svg>
      <span
        style={{
          fontSize: '18px',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        ⚙️
      </span>
    </button>
  );
};
