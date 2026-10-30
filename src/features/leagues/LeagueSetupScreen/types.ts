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
  removeTeam: (blueprintUuid: string) => void;
}

/** What `useLeagueSetup` gives `LeagueSetupScreen`. */
export interface LeagueSetup extends TeamList {
  step: LeagueSetupStep;
  details: LeagueDraftDetails;
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
