import React from 'react';

interface ReturnToFrontierPillProps {
  onReturn: () => void;
  frontierCardTitle?: string;
}

export const ReturnToFrontierPill: React.FC<ReturnToFrontierPillProps> = ({
  onReturn,
  frontierCardTitle,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        data-testid="return-to-frontier-button"
        className="touch-target-oversized return-frontier-pill"
        onClick={onReturn}
        aria-label="Return to active Vine Frontier card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 28px',
          minHeight: '64px',
          backgroundColor: '#2E7D32',
          color: '#FFFFFF',
          fontSize: '17px',
          fontWeight: 700,
          border: '3px solid #81C784',
          borderRadius: '32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          outline: 'none',
        }}
      >
        <span style={{ fontSize: '24px' }}>⬇️</span>
        <span>Return to Sprout</span>
        {frontierCardTitle && (
          <span
            style={{
              backgroundColor: '#1B5E20',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          >
            {frontierCardTitle}
          </span>
        )}
      </button>
    </div>
  );
};
