import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VoteStore {
  selectedOptionId: string | null;
  weight: number;
  isVeto: boolean;
  votedPolls: string[];
  ownedPolls: string[];
  setSelection: (optionId: string) => void;
  setWeight: (weight: number) => void;
  toggleVeto: () => void;
  markVoted: (pollId: string) => void;
  hasVoted: (pollId: string) => boolean;
  markOwned: (pollId: string) => void;
  isOwner: (pollId: string) => boolean;
  reset: () => void;
}

export const useVoteStore = create<VoteStore>()(
  persist(
    (set, get) => ({
      selectedOptionId: null,
      weight: 1,
      isVeto: false,
      votedPolls: [],
      ownedPolls: [],
      setSelection: (optionId) => set({ selectedOptionId: optionId, isVeto: false }),
      setWeight: (weight) => set({ weight }),
      toggleVeto: () => set((state) => ({ isVeto: !state.isVeto })),
      markVoted: (pollId) =>
        set((state) => {
          if (state.votedPolls.includes(pollId)) return state;
          return { votedPolls: [...state.votedPolls, pollId] };
        }),
      hasVoted: (pollId) => get().votedPolls.includes(pollId),
      markOwned: (pollId) =>
        set((state) => {
          if (state.ownedPolls.includes(pollId)) return state;
          return { ownedPolls: [...state.ownedPolls, pollId] };
        }),
      isOwner: (pollId) => get().ownedPolls.includes(pollId),
      reset: () => set({ selectedOptionId: null, weight: 1, isVeto: false }),
    }),
    {
      name: "qwikvote-votes",
      partialize: (state) => ({
        votedPolls: state.votedPolls,
        ownedPolls: state.ownedPolls,
      }),
    }
  )
);
