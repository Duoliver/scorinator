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
import { useLeagueDraftSync } from './useLeagueDraftSync';
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
  const [status, setStatus] = useState<string | null>(null);

  const detailsStepRef = useRef<DetailsStepHandle>(null);
  const stepsRef: RefObject<FieldHandle<string>> = useRef(null);

  const skipDraftSync = useLeagueDraftSync(
    { details, teams: teamList.teams, fixedTrigrams: teamList.fixedTrigrams, step },
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

  const createProblem = teamListProblem(teamList.teams);

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
      });
    } catch (error) {
      // `createLeague` throws for a Blueprint twice in the list or a closed
      // database. Neither can happen from this screen today. This only
      // keeps the screen up if a store change elsewhere ever adds another.
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
    status,
    stepsRef,
    detailsStepRef,
    goToDetails: () => goToStep('details'),
    goToTeams: () => goToStep('teams'),
    goToReview: () => goToStep('review'),
    handleTabChange: (id) => goToStep(id as LeagueSetupStep),
    handleCreate,
  };
}
