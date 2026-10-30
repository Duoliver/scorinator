import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system';
import type { LeagueDraftDetails, LeagueSetupStep } from '@/app/state/leagueDraftStore';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import type { DetailsStepHandle } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';

/** What `useTeamList` gives: the team list of the Teams step, and the ways
 * to change it. */
export interface TeamList {
  teams: TeamInstance[];
  /** Adds an Instance, with a rolled OVR, for each Blueprint that is not in
   * the list, in the given order (Task 81). */
  addTeams: (blueprints: readonly TeamBlueprint[]) => void;
  /** Takes the team out of the list, with its fixed trigram. */
  removeTeam: (blueprintUuid: string) => void;
  /** Puts a new Instance of the Blueprint, with a rolled OVR, in the place
   * of the team. Its edits and its fixed trigram are lost (US-08.5). */
  switchTeam: (blueprintUuid: string, replacement: TeamBlueprint) => void;
  /** The trigrams fixed in the Edit drawer, by Blueprint UUID (Task 172). */
  fixedTrigrams: Record<string, string>;
}

/** What `useLeagueSetup` gives `LeagueSetupScreen`. */
export interface LeagueSetup extends TeamList {
  step: LeagueSetupStep;
  details: LeagueDraftDetails;
  /** Why the list cannot start a league, or `null` (US-08.8). */
  createProblem: string | null;
  /** The message of the last failed create, shown under the steps. */
  status: string | null;
  stepsRef: RefObject<FieldHandle<string>>;
  detailsStepRef: RefObject<DetailsStepHandle>;
  goToDetails: () => void;
  goToTeams: () => void;
  goToReview: () => void;
  /** For a click on a step tab. */
  handleTabChange: (id: string) => void;
  handleCreate: () => void;
}
