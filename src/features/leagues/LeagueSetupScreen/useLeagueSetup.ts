import { useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { route } from 'preact-router';
import type { FieldHandle } from '@/design-system/field';
import { leagueDetailPath } from '@/app/routes';
import { addLeague } from '@/app/state/leagueActions';
import { resetLeagueDraft } from '@/app/state/leagueDraftActions';
import {
  useLeagueDraftStore,
  type LeagueDraftDetails,
  type LeagueSetupStep,
} from '@/app/state/leagueDraftStore';
import { useLeagueStore, type LeagueRecord } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { DetailsStepHandle } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import { leagueNameProblem } from './leagueName';
import type { LeagueSetup } from './types';
import { useLeagueDraftSync } from './useLeagueDraftSync';
import { useTeamSelection } from './useTeamSelection';

/** The League Setup wizard: the draft, the step changes, and the create. */
export function useLeagueSetup(): LeagueSetup {
  const teams = useTeamsStore((state) => state.teams);
  // The whole list, not a mapped selector: a new array on every call would
  // make the store hook re-render without end.
  const leagues = useLeagueStore((state) => state.leagues);
  const takenSlugs = leagues.map((league) => league.slug);

  // Read the persisted draft once, on mount — not a subscribed selector.
  // Nothing below ties this screen's render to `leagueDraftStore` while it
  // stays mounted; see that store's file for why. `useState`'s initial
  // value only runs once, on the first render, so calling `getState()`
  // outside it costs nothing extra on later renders.
  const initialDraft = useLeagueDraftStore.getState();
  const [details, setDetails] = useState<LeagueDraftDetails>(initialDraft.details);
  const [step, setStep] = useState<LeagueSetupStep>(initialDraft.step);
  const selection = useTeamSelection(initialDraft.selectedSlugs);
  const [status, setStatus] = useState<string | null>(null);

  const detailsStepRef = useRef<DetailsStepHandle>(null);
  const stepsRef: RefObject<FieldHandle<string>> = useRef(null);

  const skipDraftSync = useLeagueDraftSync(
    { details, selectedSlugs: selection.selectedSlugs, step },
    detailsStepRef
  );

  const selectedTeams = teams.filter((team) =>
    selection.selectedSlugs.includes(team.slug)
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

  const handleCreate = (): void => {
    // `DetailsStep` is unmounted by the time Review is reachable — `details`
    // already holds its final values, synced by `goToStep` on the way out.
    // The step tabs can reach Review past a disabled Next, so check the
    // name again here: invalid, or taken by an open league (Task 40).
    const nameProblem = leagueNameProblem(details.name, takenSlugs);
    if (nameProblem) {
      setStatus(nameProblem);
      return;
    }
    let league: LeagueRecord;
    try {
      league = addLeague({
        name: details.name.trim(),
        homeAdvantage: details.homeAdvantage,
        points: details.points,
        teams: selectedTeams,
      });
    } catch (error) {
      // The check above covers both errors `addLeague` can throw (a name
      // with no slug, a taken slug). This only keeps the screen up if a
      // store change elsewhere ever adds another.
      setStatus((error as Error).message);
      return;
    }

    // Skip the unmount draft sync before the store reset. See
    // `useLeagueDraftSync`. Local state itself needs no reset: this
    // instance is about to unmount and never render again.
    skipDraftSync();
    resetLeagueDraft();
    route(leagueDetailPath(league.slug));
  };

  return {
    ...selection,
    step,
    details,
    takenSlugs,
    selectedTeams,
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
