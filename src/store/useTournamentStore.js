import { create } from "zustand";

const useTournamentStore = create((set) => ({
  dbKey: "",
  sidKey: "",
  round: "",
  pairings: [],

  // setters
  setTournamentKeys: ({ dbKey, sidKey }) =>
    set({ dbKey, sidKey }),

  setPairings: ({ round, pairings }) =>
    set({ round, pairings }),

  reset: () =>
    set({
      dbKey: "",
      sidKey: "",
      round: "",
      pairings: [],
    }),
}));

export default useTournamentStore;
