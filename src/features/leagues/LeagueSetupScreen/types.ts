import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system';
import type { LeagueDraftDetails, LeagueSetupStep } from '@/app/state/leagueDraftStore';
import type { PhasePlan } from '@/engine/phases';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import type { DetailsStepHandle } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import type { TeamInstanceEdit } from '@/features/leagues/LeagueSetupScreen/steps/TeamsStep/EditTeamDrawer';
import type { PhaseFormatKey } from './phasePlans';

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
  /** Changes one Instance, and sets or clears its fixed trigram, from the
   * Edit drawer (US-08.4, Task 172). */
  updateTeam: (blueprintUuid: string, edit: TeamInstanceEdit) => void;
  /** The trigrams fixed in the Edit drawer, by Blueprint UUID (Task 172). */
  fixedTrigrams: Record<string, string>;
}

/** What `usePhaseList` gives: the phase chain of the Phases step, a stable
 * key for each phase card, and the ways to change the chain (Task 129). */
export interface PhaseList {
  plans: PhasePlan[];
  /** One key for each phase, in the same order. A key moves with its
   * phase, so the uncontrolled fields of a card keep their values. */
  phaseKeys: number[];
  addPhase: () => void;
  removePhase: (index: number) => void;
  movePhase: (index: number, step: -1 | 1) => void;
  setFormat: (index: number, key: PhaseFormatKey) => void;
  setGroupBy: (index: number, by: 'size' | 'count') => void;
  setGroupNumber: (index: number, value: number) => void;
  setTop: (index: number, top: number) => void;
  setBestOfNext: (index: number, bestOfNext: number) => void;
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
  /** The phase chain of the Phases step (Task 129). */
  phaseList: PhaseList;
  goToDetails: () => void;
  goToPhases: () => void;
  goToTeams: () => void;
  goToReview: () => void;
  /** For a click on a step tab. */
  handleTabChange: (id: string) => void;
  handleCreate: () => void;
}
