import { create } from "zustand";

interface VoteStore {
  selectedOptionId: string | null;
  weight: number;
  isVeto: boolean;
  votedPolls: Set<string>;
  setSelection: (optionId: string) => void;
  setWeight: (weight: number) => void;
  toggleVeto: () => void;
  markVoted: (pollId: string) => void;
  hasVoted: (pollId: string) => boolean;
  reset: () => void;
}

export const useVoteStore = create<VoteStore>((set, get) => ({
  selectedOptionId: null,
  weight: 1,
  isVeto: false,
  votedPolls: new Set(),
  setSelection: (optionId) => set({ selectedOptionId: optionId, isVeto: false }),
  setWeight: (weight) => set({ weight }),
  toggleVeto: () => set((state) => ({ isVeto: !state.isVeto })),
  markVoted: (pollId) =>
    set((state) => {
      const next = new Set(state.votedPolls);
      next.add(pollId);
      return { votedPolls: next };
    }),
  hasVoted: (pollId) => get().votedPolls.has(pollId),
  reset: () => set({ selectedOptionId: null, weight: 1, isVeto: false }),
}));
