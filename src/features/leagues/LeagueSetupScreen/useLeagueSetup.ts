import { useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { route } from 'preact-router';
import type { FieldHandle } from '@/design-system';
import { getErrorMessage } from '@/app/getErrorMessage';
import { leagueDetailPath, seasonLeagueDetailPath } from '@/app/routes';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { resetLeagueDraft } from '@/app/state/leagueDraftActions';
import {
  getLeagueDraft,
  useLeagueDraftStore,
  type LeagueDraftDetails,
  type LeagueSetupStep,
} from '@/app/state/leagueDraftStore';
import { createLeague } from '@/app/state/leagueWrapperActions';
import { createSeasonLeague } from '@/app/state/seasonLeagueActions';
import { teamListProblem } from '@/app/state/teamInstances';
import type { SeasonWrapper } from '@/domain';
import type { DetailsStepHandle } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import { formatAdvanceText } from '@/features/components/leagueSummary';
import { leagueNameProblem } from './leagueName';
import type { LeagueSetup } from './types';
import {
  bracketQualifiers,
  bracketWarning,
  phaseChecks,
  phaseProblemText,
} from './phaseChecks';
import { getSeasonTeamRows } from './seasonTeams';
import { useLeagueDraftSync } from './useLeagueDraftSync';
import { usePhaseList } from './usePhaseList';
import { usePhaseOneGroups } from './usePhaseOneGroups';
import { useTeamList } from './useTeamList';

/** The League Setup wizard: the draft, the step changes, and the create.
 * With a Season, the wizard keeps the draft of that Season, and creates the
 * league in it (Task 218). */
export function useLeagueSetup(
  seasonUuid?: string,
  season?: SeasonWrapper
): LeagueSetup {
  // Read the persisted draft once, on mount — not a subscribed selector.
  // Nothing below ties this screen's render to `leagueDraftStore` while it
  // stays mounted; see that store's file for why. `useState`'s initial
  // value only runs once, on the first render, so calling `getState()`
  // outside it costs nothing extra on later renders.
  const initialDraft = getLeagueDraft(useLeagueDraftStore.getState(), seasonUuid);
  const blueprints = useDatabaseStore((state) => state.blueprints);
  const [details, setDetails] = useState<LeagueDraftDetails>(initialDraft.details);
  const [step, setStep] = useState<LeagueSetupStep>(initialDraft.step);
  const teamList = useTeamList(initialDraft.teams, initialDraft.fixedTrigrams);
  const phaseList = usePhaseList(initialDraft.plans);
  const phaseOne = usePhaseOneGroups(
    teamList,
    phaseList.plans,
    initialDraft.groups ?? null
  );
  const firstGroupSizes = phaseOne.groups?.map((group) => group.length);
  const [status, setStatus] = useState<string | null>(null);

  const detailsStepRef = useRef<DetailsStepHandle>(null);
  const stepsRef: RefObject<FieldHandle<string>> = useRef(null);

  const skipDraftSync = useLeagueDraftSync(
    {
      details,
      teams: teamList.teams,
      fixedTrigrams: teamList.fixedTrigrams,
      plans: phaseList.plans,
      groups: phaseOne.groups,
      step,
    },
    detailsStepRef,
    seasonUuid
  );
  const seasonRows =
    season &&
    getSeasonTeamRows(season, teamList.teams, blueprints, teamList.fixedTrigrams);

  // Reads whatever is currently in the Details fields before a step change
  // can unmount them — `Tabs` only renders the active tab's content, so this
  // is the one moment `DetailsStep`'s uncontrolled values must be captured.
  const syncDetailsFromFields = (): void => {
    setDetails(detailsStepRef.current?.getValues() ?? details);
  };

  // Back and Next live inside the step, so the step change removes the
  // button that has focus. Focus moves to the new step tab, which stays on
  // the page. On a tab click, that tab already has focus.
  const goToStep = (next: LeagueSetupStep): void => {
    syncDetailsFromFields();
    stepsRef.current?.setValue(next);
    stepsRef.current?.focus();
    setStep(next);
  };

  // The phase problems need the team count (Task 177 choice 3).
  const checks = phaseChecks(phaseList.plans, teamList.teams.length, firstGroupSizes);
  const phaseProblems = checks.problems.map((problem) =>
    phaseProblemText(problem, phaseList.plans)
  );
  // The bracket team count and its power-of-2 warning (US-04.9, Task 140).
  const qualifiers = bracketQualifiers(phaseList.plans, checks.counts);
  // The name comes first (Task 179): the step tabs can reach Review past
  // the disabled Next of the Details step. A phase problem shows its first
  // text (Task 177 choice 6).
  const createProblem =
    leagueNameProblem(details.name) ??
    teamListProblem(teamList.teams) ??
    phaseProblems[0] ??
    null;

  const handleCreate = (): void => {
    // `DetailsStep` is unmounted by the time Review is reachable — `details`
    // already holds its final values, synced by `goToStep` on the way out.
    // The Review step disables "Create league" while `createProblem` holds a
    // reason, the name included (Task 179).
    if (createProblem) return;
    // The Instances keep the OVR they rolled at the add (Task 81). In a
    // Season, a joining team keeps it as its Season base (Task 215).
    const input = {
      name: details.name.trim(),
      homeAdvantage: details.homeAdvantage,
      points: details.points,
      teams: teamList.teams,
      fixedTrigrams: teamList.fixedTrigrams,
      plans: phaseList.plans,
      groups: phaseOne.groups ?? undefined,
    };
    let path: string;
    try {
      if (seasonUuid === undefined) {
        path = leagueDetailPath(createLeague(input).uuid);
      } else {
        const league = createSeasonLeague(seasonUuid, input);
        path = seasonLeagueDetailPath(seasonUuid, league.uuid);
      }
    } catch (error) {
      // `createLeague` throws for a Blueprint twice in the list, a closed
      // database, or plans that do not fit the teams (Task 128). Until Task
      // 177 shows the fit problems on the steps, this status line says it.
      setStatus(getErrorMessage(error));
      return;
    }

    // Skip the unmount draft sync before the store reset. See
    // `useLeagueDraftSync`. Local state itself needs no reset: this
    // instance is about to unmount and never render again.
    skipDraftSync();
    resetLeagueDraft(seasonUuid);
    route(path);
  };

  return {
    ...teamList,
    seasonRows,
    step,
    details,
    createProblem,
    phaseProblems,
    status,
    stepsRef,
    detailsStepRef,
    // The team actions that also change the phase-1 draw (Task 130).
    addTeams: phaseOne.addTeams,
    removeTeam: phaseOne.removeTeam,
    switchTeam: phaseOne.switchTeam,
    phaseList,
    groups: phaseOne.groups,
    groupsAdvanceText: formatAdvanceText(phaseList.plans),
    bracketQualifiers: qualifiers,
    bracketWarning: qualifiers === undefined ? undefined : bracketWarning(qualifiers),
    shuffleGroups: phaseOne.shuffleGroups,
    moveTeam: phaseOne.moveTeam,
    goToDetails: () => goToStep('details'),
    goToPhases: () => goToStep('phases'),
    goToTeams: () => goToStep('teams'),
    goToReview: () => goToStep('review'),
    handleTabChange: (id) => goToStep(id as LeagueSetupStep),
    handleCreate,
  };
}
