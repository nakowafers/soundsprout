import { GardenCard, GardenSessionState, MilestoneBlossomCardData } from '../domain/types';
import { INITIAL_CURRICULUM_CARDS } from '../domain/curriculum';

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
}

interface PersistedState {
  frontierIndex: number;
  completedCardIds: string[];
  unlockedBlossoms: string[];
  unlockedCritters: string[];
}

function resolveStorage(storageProp?: Storage): Storage | undefined {
  if (storageProp) return storageProp;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return undefined;
}

export function createGardenStateMachine(
  options: GardenStateMachineOptions = {}
): GardenStateMachine {
  const cards = options.initialCards ?? [...INITIAL_CURRICULUM_CARDS];
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
        const validFrontier = Math.max(
          0,
          Math.min(parsed.frontierIndex ?? 0, cards.length - 1)
        );
        state = {
          ...state,
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
      const toSave: PersistedState = {
        frontierIndex: state.frontierIndex,
        completedCardIds: state.completedCardIds,
        unlockedBlossoms: state.unlockedBlossoms,
        unlockedCritters: state.unlockedCritters,
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

        state = {
          ...state,
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

    resetProgress: () => {
      state = {
        cards,
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
