import { create } from 'zustand';
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from '@/engine/standings';

/** The three steps of the League Setup wizard, by their `Tabs` id. */
export type LeagueSetupStep = 'details' | 'teams' | 'review';

export interface LeagueDraftDetails {
  name: string;
  points: PointsConfig;
  homeAdvantage: boolean;
}

function emptyDetails(): LeagueDraftDetails {
  return { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false };
}

/** The League Setup wizard's in-progress, not-yet-created state. Kept apart
 * from `leagueStore` (the committed leagues list) on purpose — this is a
 * draft, not a `LeagueRecord`. Exists so `LeagueSetupScreen` can unmount and
 * remount, as `preact-router` does on every nav switch, without losing what
 * the user was in the middle of entering. `reset()` runs after a successful
 * create, matching the screen's own prior post-create behavior. */
export interface LeagueDraftState {
  details: LeagueDraftDetails;
  selectedSlugs: string[];
  step: LeagueSetupStep;
  setName: (name: string) => void;
  setPoints: (points: PointsConfig) => void;
  setHomeAdvantage: (homeAdvantage: boolean) => void;
  toggleTeam: (slug: string) => void;
  selectTeam: (slug: string) => void;
  selectAllTeams: (slugs: string[]) => void;
  clearSelection: (slugs: string[]) => void;
  setStep: (step: LeagueSetupStep) => void;
  reset: () => void;
}

export const useLeagueDraftStore = create<LeagueDraftState>()((set) => ({
  details: emptyDetails(),
  selectedSlugs: [],
  step: 'details',

  setName: (name): void => set((state) => ({ details: { ...state.details, name } })),
  setPoints: (points): void =>
    set((state) => ({ details: { ...state.details, points } })),
  setHomeAdvantage: (homeAdvantage): void =>
    set((state) => ({ details: { ...state.details, homeAdvantage } })),

  toggleTeam: (slug): void =>
    set((state) => ({
      selectedSlugs: state.selectedSlugs.includes(slug)
        ? state.selectedSlugs.filter((s) => s !== slug)
        : [...state.selectedSlugs, slug],
    })),
  selectTeam: (slug): void =>
    set((state) => ({
      selectedSlugs: state.selectedSlugs.includes(slug)
        ? state.selectedSlugs
        : [...state.selectedSlugs, slug],
    })),
  selectAllTeams: (slugs): void =>
    set((state) => ({
      selectedSlugs: Array.from(new Set([...state.selectedSlugs, ...slugs])),
    })),
  clearSelection: (slugs): void =>
    set((state) => ({
      selectedSlugs: state.selectedSlugs.filter((slug) => !slugs.includes(slug)),
    })),

  setStep: (step): void => set({ step }),

  reset: (): void =>
    set({ details: emptyDetails(), selectedSlugs: [], step: 'details' }),
}));
