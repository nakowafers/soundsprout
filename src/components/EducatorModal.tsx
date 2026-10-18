import React, { useState, useEffect } from 'react';
import { GardenStateMachine } from '../state/gardenStateMachine';
import { AudioPort } from '../audio/audioPort';
import { GardenSessionState } from '../domain/types';

export interface EducatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stateMachine: GardenStateMachine;
  audioPort: AudioPort;
}

export const EducatorModal: React.FC<EducatorModalProps> = ({
  isOpen,
  onClose,
  stateMachine,
  audioPort,
}) => {
  const [sessionState, setSessionState] = useState<GardenSessionState>(
    stateMachine.getState()
  );
  const [isMuted, setIsMuted] = useState(audioPort.isMuted());

  useEffect(() => {
    if (!isOpen) return;
    setSessionState(stateMachine.getState());
    setIsMuted(audioPort.isMuted());
    const unsubscribe = stateMachine.subscribe((next) => {
      setSessionState(next);
    });
    return () => {
      unsubscribe();
    };
  }, [isOpen, stateMachine, audioPort]);

  if (!isOpen) return null;

  const handleMuteToggle = () => {
    const nextMuted = !audioPort.isMuted();
    audioPort.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleJumpLesson = (lesson: number | 'mastery') => {
    stateMachine.jumpToLesson(lesson);
    onClose();
  };

  const handleResetProgress = () => {
    stateMachine.resetProgress();
    onClose();
  };

  const isLessonComplete = (lessonNum: number) => {
    const lessonCards = sessionState.cards.filter(
      (c) => c.lessonNumber === lessonNum && !c.id.startsWith('mastery-batch-')
    );
    if (lessonCards.length === 0) return false;
    return lessonCards.every((c) => sessionState.completedCardIds.includes(c.id));
  };

  const isLessonInProgress = (lessonNum: number) => {
    const lessonCards = sessionState.cards.filter(
      (c) => c.lessonNumber === lessonNum && !c.id.startsWith('mastery-batch-')
    );
    if (lessonCards.length === 0) return false;
    const firstIdx = sessionState.cards.findIndex((c) => c.id === lessonCards[0].id);
    const lastIdx = firstIdx + lessonCards.length - 1;
    return (
      sessionState.frontierIndex >= firstIdx &&
      sessionState.frontierIndex <= lastIdx &&
      !isLessonComplete(lessonNum)
    );
  };

  const hasMasteryCards = sessionState.cards.some((c) =>
    c.id.startsWith('mastery-batch-')
  );
  const masteryCardsCompleted = sessionState.cards.filter(
    (c) => c.id.startsWith('mastery-batch-') && sessionState.completedCardIds.includes(c.id)
  ).length;

  return (
    <div
      data-testid="educator-modal"
      role="dialog"
      aria-label="Parent & Educator Settings"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
          border: '3px solid #C8E6C9',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '2px solid #E8F5E9',
            backgroundColor: '#F1F8E9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🌱</span>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#2E7D32',
                margin: 0,
              }}
            >
              Educator & Parent Settings
            </h2>
          </div>
          <button
            type="button"
            data-testid="educator-modal-close"
            aria-label="Close settings"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#555555',
              padding: '4px 8px',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Audio Controls */}
          <section
            style={{
              padding: '12px 16px',
              backgroundColor: '#FAFAFA',
              borderRadius: '16px',
              border: '1px solid #EEEEEE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#333333' }}>
                Sound Effects & Audio
              </div>
              <div style={{ fontSize: '13px', color: '#666666' }}>
                Phoneme sounds, hints, and celebration fanfare
              </div>
            </div>
            <button
              type="button"
              data-testid="audio-mute-toggle"
              onClick={handleMuteToggle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: isMuted ? '#FFEBEE' : '#E8F5E9',
                color: isMuted ? '#C62828' : '#2E7D32',
                border: `2px solid ${isMuted ? '#EF9A9A' : '#A5D6A7'}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>{isMuted ? '🔇' : '🔊'}</span>
              <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
            </button>
          </section>

          {/* Lesson Progress & Jump Navigator */}
          <section>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#2E7D32',
                marginTop: 0,
                marginBottom: '10px',
              }}
            >
              Curriculum Navigation & Progress
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '280px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lessonNum) => {
                const complete = isLessonComplete(lessonNum);
                const inProgress = isLessonInProgress(lessonNum);
                let statusText = 'Not Started';
                let statusBg = '#EEEEEE';
                let statusColor = '#616161';

                if (complete) {
                  statusText = 'Completed';
                  statusBg = '#C8E6C9';
                  statusColor = '#2E7D32';
                } else if (inProgress) {
                  statusText = 'In Progress';
                  statusBg = '#FFF9C4';
                  statusColor = '#F57F17';
                }

                return (
                  <div
                    key={lessonNum}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#FAFAFA',
                      borderRadius: '12px',
                      border: '1px solid #EEEEEE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        Lesson {lessonNum}
                      </span>
                      <span
                        data-testid={`lesson-status-${lessonNum}`}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: statusBg,
                          color: statusColor,
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {statusText}
                      </span>
                    </div>
                    <button
                      type="button"
                      data-testid={`jump-lesson-${lessonNum}`}
                      onClick={() => handleJumpLesson(lessonNum)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#E8F5E9',
                        color: '#2E7D32',
                        border: '1px solid #81C784',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Jump to Lesson
                    </button>
                  </div>
                );
              })}

              {/* Mastery Stream Entry */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#F3E5F5',
                  borderRadius: '12px',
                  border: '1px solid #E1BEE7',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#6A1B9A' }}>
                    Mastery Stream
                  </span>
                  <span
                    data-testid="mastery-stream-status"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#E1BEE7',
                      color: '#4A148C',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {hasMasteryCards
                      ? `Active (${masteryCardsCompleted} cards bloomed)`
                      : 'Endless Stream'}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="jump-lesson-mastery"
                  onClick={() => handleJumpLesson('mastery')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#BA68C8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Jump to Stream
                </button>
              </div>
            </div>
          </section>

          {/* Reset Progress Danger Zone */}
          <section
            style={{
              padding: '14px 16px',
              backgroundColor: '#FFEBEE',
              borderRadius: '16px',
              border: '1px solid #FFCDD2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#C62828' }}>
                Reset Garden Progress
              </div>
              <div style={{ fontSize: '12px', color: '#B71C1C' }}>
                Restore garden back to Lesson 1 and clear unlocks
              </div>
            </div>
            <button
              type="button"
              data-testid="reset-progress-button"
              onClick={handleResetProgress}
              style={{
                padding: '8px 14px',
                backgroundColor: '#D32F2F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
