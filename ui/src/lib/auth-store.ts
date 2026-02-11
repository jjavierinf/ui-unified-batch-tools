import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "user" | "leader";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

const USERS: User[] = [
  { id: "data-engineer", name: "Data Engineer", role: "user", avatar: "DE" },
  { id: "team-leader", name: "Team Leader", role: "leader", avatar: "TL" },
];

interface AuthStore {
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentUser: null,

      login: (userId: string) => {
        const user = USERS.find((u) => u.id === userId) ?? null;
        set({ currentUser: user });
      },

      logout: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: "auth-store-v1",
    }
  )
);

export { USERS };
