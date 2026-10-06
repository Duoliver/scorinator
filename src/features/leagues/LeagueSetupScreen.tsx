import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX, RefObject } from 'preact';
import { route } from 'preact-router';
import { Tabs, type TabItem } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import { useTeamsStore } from '@/app/state/teamsStore';
import { addLeague } from '@/app/state/leagueActions';
import { useLeagueStore, type LeagueRecord } from '@/app/state/leagueStore';
import { resetLeagueDraft, setLeagueDraft } from '@/app/state/leagueDraftActions';
import { leagueDetailPath } from '@/app/routes';
import {
  useLeagueDraftStore,
  type LeagueDraftDetails,
  type LeagueSetupStep,
} from '@/app/state/leagueDraftStore';
import { DetailsStep, type DetailsStepHandle } from './steps/DetailsStep';
import { TeamsStep } from './steps/TeamsStep';
import { ReviewStep } from './steps/ReviewStep';
import { leagueNameProblem } from './steps/leagueName';
import styles from './LeagueSetupScreen.module.css';

export function LeagueSetupScreen(): JSX.Element {
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
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    initialDraft.selectedSlugs
  );
  const [step, setStep] = useState<LeagueSetupStep>(initialDraft.step);

  const detailsStepRef = useRef<DetailsStepHandle>(null);
  const stepsRef: RefObject<FieldHandle<string>> = useRef(null);
  const [status, setStatus] = useState<string | null>(null);

  // Always holds the latest local state, for the unmount effect below —
  // an empty dependency array keeps that effect from re-registering on
  // every keystroke-driven `selectedSlugs`/`step` change, so this ref is
  // what keeps its closure from going stale instead.
  const latestRef = useRef({ details, selectedSlugs, step });
  latestRef.current = { details, selectedSlugs, step };

  // `handleCreate` sets this synchronously, before `route(...)` triggers
  // the unmount below. Preact batches that navigation together with
  // `handleCreate`'s own `setState` calls, so this component can unmount
  // without ever re-rendering with their new values first — the render
  // body above, which is what actually refreshes `latestRef.current`,
  // then never runs again. Left unguarded, the cleanup below would read
  // stale pre-create field values through `latestRef` and write them back
  // into `leagueDraftStore`, silently undoing `handleCreate`'s own
  // `reset()` call. This flag lets that cleanup skip its write instead,
  // since a successful create already reset the store directly.
  const suppressDraftSyncRef = useRef(false);

  useEffect(() => {
    // `detailsStepRef`/`latestRef` are read for their value at the moment
    // this cleanup actually runs (true unmount), not at the moment this
    // effect was registered — an empty dependency array is correct.
    return (): void => {
      if (suppressDraftSyncRef.current) return;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
      const fromRef = detailsStepRef.current?.getValues();
      const currentDetails = fromRef ?? latestRef.current.details;
      setLeagueDraft({
        details: currentDetails,
        selectedSlugs: latestRef.current.selectedSlugs,
        step: latestRef.current.step,
      });
    };
  }, []);

  const selectedTeams = teams.filter((team) => selectedSlugs.includes(team.slug));

  // Reads whatever is currently in the Details fields before a step change
  // can unmount them — `Tabs` only renders the active tab's content, so this
  // is the one moment `DetailsStep`'s uncontrolled values must be captured.
  const syncDetailsFromRef = (): LeagueDraftDetails => {
    const next = detailsStepRef.current?.getValues() ?? details;
    setDetails(next);
    return next;
  };

  // Back and Next live inside the step, so the step change removes the
  // button that has focus. Focus moves to the new step tab, which stays on
  // the page. On a tab click, that tab already has focus.
  const goToStep = (next: LeagueSetupStep): void => {
    syncDetailsFromRef();
    stepsRef.current?.setValue(next);
    stepsRef.current?.focus();
    setStep(next);
  };

  const toggleTeam = (slug: string): void => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  };

  const selectTeam = (slug: string): void => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current : [...current, slug]
    );
  };

  const selectAllTeams = (slugs: string[]): void => {
    setSelectedSlugs((current) => Array.from(new Set([...current, ...slugs])));
  };

  const clearSelection = (slugs: string[]): void => {
    setSelectedSlugs((current) => current.filter((slug) => !slugs.includes(slug)));
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

    // Suppress the unmount effect's draft-sync before resetting the store
    // directly — see that ref's own comment for why the effect cannot be
    // trusted to see fresh local state by the time `route(...)` unmounts
    // this component. Local state itself needs no reset: this instance is
    // about to unmount and never render again.
    suppressDraftSyncRef.current = true;
    resetLeagueDraft();
    route(leagueDetailPath(league.slug));
  };

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: '1 · Details',
      content: (
        <DetailsStep
          initial={details}
          takenSlugs={takenSlugs}
          onNext={() => goToStep('teams')}
          ref={detailsStepRef}
        />
      ),
    },
    {
      id: 'teams',
      label: '2 · Teams',
      content: (
        <TeamsStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          selectedSlugs={selectedSlugs}
          onToggleTeam={toggleTeam}
          onSelectAll={selectAllTeams}
          onClearSelection={clearSelection}
          onTeamCreated={selectTeam}
          onBack={() => goToStep('details')}
          onNext={() => goToStep('review')}
        />
      ),
    },
    {
      id: 'review',
      label: '3 · Review',
      content: (
        <ReviewStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          selectedTeams={selectedTeams}
          onBack={() => goToStep('teams')}
          onCreate={handleCreate}
        />
      ),
    },
  ];

  return (
    <div class={styles.screen}>
      <h1>League Setup</h1>

      <Tabs
        tabs={tabs}
        defaultTab={step}
        onChange={(id) => goToStep(id as LeagueSetupStep)}
        ref={stepsRef}
        fullWidth
        scrollToTopOnChange
      />

      {status && <span class={styles.status}>{status}</span>}
    </div>
  );
}
LeagueSetupScreen.displayName = 'LeagueSetupScreen';
