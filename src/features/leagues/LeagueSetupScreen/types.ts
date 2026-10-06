import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system/field';
import type { LeagueDraftDetails, LeagueSetupStep } from '@/app/state/leagueDraftStore';
import type { TeamRecord } from '@/features/components';
import type { DetailsStepHandle } from '@/features/leagues/steps/DetailsStep';

/** What `useTeamSelection` gives: the teams picked on the Teams step, and
 * the ways to change that pick. */
export interface TeamSelection {
  selectedSlugs: string[];
  toggleTeam: (slug: string) => void;
  /** Adds one team. Used for a team created inside the Teams step. */
  selectTeam: (slug: string) => void;
  selectAllTeams: (slugs: string[]) => void;
  clearSelection: (slugs: string[]) => void;
}

/** What `useLeagueSetup` gives `LeagueSetupScreen`. */
export interface LeagueSetup extends TeamSelection {
  step: LeagueSetupStep;
  details: LeagueDraftDetails;
  takenSlugs: string[];
  selectedTeams: TeamRecord[];
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
