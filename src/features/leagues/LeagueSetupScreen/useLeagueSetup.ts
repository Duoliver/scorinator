import { useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { route } from 'preact-router';
import type { FieldHandle } from '@/design-system';
import { getErrorMessage } from '@/app/getErrorMessage';
import { leagueDetailPath } from '@/app/routes';
import { resetLeagueDraft } from '@/app/state/leagueDraftActions';
import {
  useLeagueDraftStore,
  type LeagueDraftDetails,
  type LeagueSetupStep,
} from '@/app/state/leagueDraftStore';
import { createLeague } from '@/app/state/leagueWrapperActions';
import { teamListProblem } from '@/app/state/teamInstances';
import type { LeagueWrapper } from '@/domain';
import type { DetailsStepHandle } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import { leagueNameProblem } from './leagueName';
import type { LeagueSetup } from './types';
import { phaseChecks, phaseProblemText } from './phaseChecks';
import { hasBracketPhase } from './phasePlans';
import { useLeagueDraftSync } from './useLeagueDraftSync';
import { groupsAdvanceText } from './phaseOneGroups';
import { usePhaseList } from './usePhaseList';
import { usePhaseOneGroups } from './usePhaseOneGroups';
import { useTeamList } from './useTeamList';

/** The League Setup wizard: the draft, the step changes, and the create. */
export function useLeagueSetup(): LeagueSetup {
  // Read the persisted draft once, on mount — not a subscribed selector.
  // Nothing below ties this screen's render to `leagueDraftStore` while it
  // stays mounted; see that store's file for why. `useState`'s initial
  // value only runs once, on the first render, so calling `getState()`
  // outside it costs nothing extra on later renders.
  const initialDraft = useLeagueDraftStore.getState();
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
    detailsStepRef
  );

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
  const phaseProblems = phaseChecks(
    phaseList.plans,
    teamList.teams.length,
    firstGroupSizes
  ).problems.map((problem) => phaseProblemText(problem, phaseList.plans));
  // A bracket phase cannot start before Task 139, so "Create league" stays
  // off (Task 129 choice 2). A phase problem shows its first text (Task 177
  // choice 6).
  const createProblem =
    teamListProblem(teamList.teams) ??
    (hasBracketPhase(phaseList.plans)
      ? 'Bracket phases come in a later update.'
      : null) ??
    phaseProblems[0] ??
    null;

  const handleCreate = (): void => {
    // `DetailsStep` is unmounted by the time Review is reachable — `details`
    // already holds its final values, synced by `goToStep` on the way out.
    // The step tabs can reach Review past a disabled Next, so check the
    // name again here.
    const nameProblem = leagueNameProblem(details.name);
    if (nameProblem) {
      setStatus(nameProblem);
      return;
    }
    // The Review step disables "Create league" for a list that cannot start.
    if (createProblem) return;
    let league: LeagueWrapper;
    try {
      // The Instances keep the OVR they rolled at the add (Task 81).
      league = createLeague({
        name: details.name.trim(),
        homeAdvantage: details.homeAdvantage,
        points: details.points,
        teams: teamList.teams,
        fixedTrigrams: teamList.fixedTrigrams,
        plans: phaseList.plans,
        groups: phaseOne.groups ?? undefined,
      });
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
    resetLeagueDraft();
    route(leagueDetailPath(league.uuid));
  };

  return {
    ...teamList,
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
    groupsAdvanceText: groupsAdvanceText(phaseList.plans),
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
