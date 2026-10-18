import { GardenCard, GardenSessionState, MilestoneBlossomCardData } from '../domain/types';
import { INITIAL_CURRICULUM_CARDS, generateMasteryBatch } from '../domain/curriculum';

export const STORAGE_KEY = 'soundsprout_garden_session_v1';

export interface GardenStateMachineOptions {
  initialCards?: GardenCard[];
  storage?: Storage;
}

export interface GardenStateMachine {
  getState: () => GardenSessionState;
  subscribe: (listener: (state: GardenSessionState) => void) => () => void;
  completeActiveCard: () => { isAutoAdvancing: boolean; isEncore: boolean };
  finishCelebration: () => void;
  scrollTo: (targetIndex: number) => { clamped: boolean; index: number };
  returnToFrontier: () => void;
  resetProgress: () => void;
  jumpToLesson: (target: number | 'mastery') => void;
}

interface PersistedState {
  frontierIndex: number;
  completedCardIds: string[];
  unlockedBlossoms: string[];
  unlockedCritters: string[];
  masteryBatchCount?: number;
}

function resolveStorage(storageProp?: Storage): Storage | undefined {
  if (storageProp) return storageProp;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return undefined;
}

export type LessonStatus = 'completed' | 'in-progress' | 'not-started';

export function getMasteryBatchCount(cards: GardenCard[]): number {
  return Math.floor(
    cards.filter((c) => c.id.startsWith('mastery-batch-')).length / 4
  );
}

export function getLessonStatus(
  state: GardenSessionState,
  lessonNumber: number
): LessonStatus {
  const lessonCards = state.cards.filter(
    (c) => c.lessonNumber === lessonNumber && !c.id.startsWith('mastery-batch-')
  );
  if (lessonCards.length === 0) return 'not-started';

  const isComplete = lessonCards.every((c) =>
    state.completedCardIds.includes(c.id)
  );
  if (isComplete) return 'completed';

  const firstIdx = state.cards.findIndex((c) => c.id === lessonCards[0].id);
  const lastIdx = firstIdx + lessonCards.length - 1;

  if (state.frontierIndex >= firstIdx && state.frontierIndex <= lastIdx) {
    return 'in-progress';
  }

  if (state.frontierIndex > lastIdx) {
    const anyDone = lessonCards.some((c) => state.completedCardIds.includes(c.id));
    return anyDone ? 'in-progress' : 'not-started';
  }

  return 'not-started';
}

function appendMasteryBatch(currentCards: GardenCard[]): GardenCard[] {
  const currentCount = getMasteryBatchCount(currentCards);
  const nextBatch = generateMasteryBatch(currentCount + 1);
  return [...currentCards, ...nextBatch];
}

export function createGardenStateMachine(
  options: GardenStateMachineOptions = {}
): GardenStateMachine {
  const baseCards = options.initialCards ?? [...INITIAL_CURRICULUM_CARDS];
  let cards = [...baseCards];
  const storage = resolveStorage(options.storage);

  let state: GardenSessionState = {
    cards,
    frontierIndex: 0,
    activeIndex: 0,
    isCelebrationLocked: false,
    completedCardIds: [],
    unlockedBlossoms: [],
    unlockedCritters: [],
  };

  // Hydrate from storage if available
  if (storage) {
    try {
      const serialized = storage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized) as Partial<PersistedState>;
        let hydratedCards = [...cards];
        const batchCount = parsed.masteryBatchCount ?? 0;
        for (let b = 1; b <= batchCount; b++) {
          hydratedCards = appendMasteryBatch(hydratedCards);
        }
        while (
          parsed.frontierIndex !== undefined &&
          parsed.frontierIndex >= hydratedCards.length
        ) {
          hydratedCards = appendMasteryBatch(hydratedCards);
        }

        const validFrontier = Math.max(
          0,
          Math.min(parsed.frontierIndex ?? 0, hydratedCards.length - 1)
        );
        state = {
          ...state,
          cards: hydratedCards,
          frontierIndex: validFrontier,
          activeIndex: validFrontier,
          completedCardIds: Array.isArray(parsed.completedCardIds)
            ? parsed.completedCardIds
            : [],
          unlockedBlossoms: Array.isArray(parsed.unlockedBlossoms)
            ? parsed.unlockedBlossoms
            : [],
          unlockedCritters: Array.isArray(parsed.unlockedCritters)
            ? parsed.unlockedCritters
            : [],
        };
      }
    } catch {
      // Ignore corrupted storage
    }
  }

  const listeners = new Set<(state: GardenSessionState) => void>();

  function persist() {
    if (!storage) return;
    try {
      const masteryBatchCount = getMasteryBatchCount(state.cards);
      const toSave: PersistedState = {
        frontierIndex: state.frontierIndex,
        completedCardIds: state.completedCardIds,
        unlockedBlossoms: state.unlockedBlossoms,
        unlockedCritters: state.unlockedCritters,
        masteryBatchCount,
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore storage write errors (e.g. quota exceeded)
    }
  }

  function emit() {
    // Return a shallow copy snapshot
    const snapshot = { ...state };
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  return {
    getState: () => ({ ...state }),

    subscribe: (listener: (state: GardenSessionState) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    completeActiveCard: () => {
      if (state.isCelebrationLocked) {
        return { isAutoAdvancing: false, isEncore: false };
      }

      const activeCard = state.cards[state.activeIndex];
      if (!activeCard) {
        return { isAutoAdvancing: false, isEncore: false };
      }

      let unlockedBlossoms = state.unlockedBlossoms;
      let unlockedCritters = state.unlockedCritters;
      if (activeCard.type === 'milestone-blossom') {
        const blossomCard = activeCard as MilestoneBlossomCardData;
        if (!unlockedBlossoms.includes(blossomCard.blossomName)) {
          unlockedBlossoms = [...unlockedBlossoms, blossomCard.blossomName];
        }
        if (!unlockedCritters.includes(blossomCard.critterName)) {
          unlockedCritters = [...unlockedCritters, blossomCard.critterName];
        }
      }

      if (state.activeIndex === state.frontierIndex) {
        const completed = state.completedCardIds.includes(activeCard.id)
          ? state.completedCardIds
          : [...state.completedCardIds, activeCard.id];

        let nextCards = state.cards;
        // Append fresh 4-card Mastery Stream review batch when completing final Milestone Blossom
        // or when completing the final card on the vine in Mastery Stream
        if (
          activeCard.id === 'lesson-10-milestone' ||
          state.frontierIndex >= state.cards.length - 1
        ) {
          nextCards = appendMasteryBatch(nextCards);
        }

        state = {
          ...state,
          cards: nextCards,
          completedCardIds: completed,
          unlockedBlossoms,
          unlockedCritters,
          isCelebrationLocked: true,
        };
        persist();
        emit();
        return { isAutoAdvancing: true, isEncore: false };
      } else {
        // Replay of an already bloomed card in-place
        state = {
          ...state,
          unlockedBlossoms,
          unlockedCritters,
        };
        persist();
        emit();
        return { isAutoAdvancing: false, isEncore: true };
      }
    },

    finishCelebration: () => {
      if (!state.isCelebrationLocked) return;

      const nextIndex = Math.min(state.frontierIndex + 1, state.cards.length - 1);
      state = {
        ...state,
        frontierIndex: nextIndex,
        activeIndex: nextIndex,
        isCelebrationLocked: false,
      };
      persist();
      emit();
    },

    scrollTo: (targetIndex: number) => {
      if (state.isCelebrationLocked) {
        return { clamped: true, index: state.activeIndex };
      }

      if (targetIndex > state.frontierIndex) {
        // Clamped downward navigation
        return { clamped: true, index: state.activeIndex };
      }

      const validIndex = Math.max(0, targetIndex);
      if (validIndex !== state.activeIndex) {
        state = {
          ...state,
          activeIndex: validIndex,
        };
        emit();
      }
      return { clamped: false, index: state.activeIndex };
    },

    returnToFrontier: () => {
      if (state.isCelebrationLocked) return;
      if (state.activeIndex !== state.frontierIndex) {
        state = {
          ...state,
          activeIndex: state.frontierIndex,
        };
        emit();
      }
    },

    jumpToLesson: (target: number | 'mastery') => {
      let currentCards = state.cards;
      let targetIndex = -1;

      if (target === 'mastery') {
        const hasMastery = currentCards.some((c) => c.id.startsWith('mastery-batch-'));
        if (!hasMastery) {
          currentCards = appendMasteryBatch(currentCards);
        }
        targetIndex = currentCards.findIndex((c) => c.id.startsWith('mastery-batch-'));
      } else {
        targetIndex = currentCards.findIndex(
          (c) => c.lessonNumber === target && !c.id.startsWith('mastery-batch-')
        );
      }

      if (targetIndex !== -1) {
        state = {
          ...state,
          cards: currentCards,
          frontierIndex: targetIndex,
          activeIndex: targetIndex,
          isCelebrationLocked: false,
        };
        persist();
        emit();
      }
    },

    resetProgress: () => {
      state = {
        cards: [...baseCards],
        frontierIndex: 0,
        activeIndex: 0,
        isCelebrationLocked: false,
        completedCardIds: [],
        unlockedBlossoms: [],
        unlockedCritters: [],
      };
      if (storage) {
        try {
          storage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
      emit();
    },
  };
}

