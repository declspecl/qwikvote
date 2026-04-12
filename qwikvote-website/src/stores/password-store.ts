import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PasswordStore {
  passwords: Record<string, string>;
  setPassword: (pollId: string, password: string) => void;
  getPassword: (pollId: string) => string | null;
}

export const usePasswordStore = create<PasswordStore>()(
  persist(
    (set, get) => ({
      passwords: {},
      setPassword: (pollId, password) =>
        set((state) => ({
          passwords: { ...state.passwords, [pollId]: password },
        })),
      getPassword: (pollId) => get().passwords[pollId] ?? null,
    }),
    { name: "qwikvote-passwords" }
  )
);
