import React from 'react';

export const CelebrationOverlay: React.FC = () => {
  return (
    <div
      data-testid="celebration-overlay"
      className="celebration-overlay-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onClick={(e) => {
        // Prevent all clicks from propagating during locked celebration window
        e.stopPropagation();
      }}
    >
      <div
        className="celebration-burst-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'celebrationBounce 0.6s ease-out infinite alternate',
        }}
      >
        <span
          role="img"
          aria-label="Bloomed blossom"
          style={{
            fontSize: '96px',
            lineHeight: 1,
            filter: 'drop-shadow(0 8px 16px rgba(255, 193, 7, 0.5))',
          }}
        >
          🌸
        </span>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#2E7D32',
            marginTop: '16px',
            textShadow: '0 2px 4px rgba(255,255,255,0.8)',
          }}
        >
          BLOOMING! ✨
        </h2>
      </div>

      {/* Floating Sparkles & Confetti elements */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          fontSize: '32px',
          animation: 'sparkleFloat 1.2s ease-in-out infinite',
        }}
      >
        🌟
      </div>
      <div
        style={{
          position: 'absolute',
          top: '25%',
          right: '25%',
          fontSize: '36px',
          animation: 'sparkleFloat 1.5s ease-in-out infinite 0.2s',
        }}
      >
        ✨
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '30%',
          fontSize: '30px',
          animation: 'sparkleFloat 1.1s ease-in-out infinite 0.4s',
        }}
      >
        🎉
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          right: '20%',
          fontSize: '34px',
          animation: 'sparkleFloat 1.4s ease-in-out infinite 0.3s',
        }}
      >
        🌺
      </div>
    </div>
  );
};
