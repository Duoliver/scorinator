import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX, RefObject } from 'preact';
import { Tabs, type TabItem } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import {
  useLeagueDraftStore,
  type LeagueDraftDetails,
  type LeagueSetupStep,
} from '@/app/state/leagueDraftStore';
import { DetailsStep, type DetailsStepHandle } from './steps/DetailsStep';
import { TeamsStep } from './steps/TeamsStep';
import { ReviewStep } from './steps/ReviewStep';
import styles from './LeagueSetupScreen.module.css';

export function LeagueSetupScreen(): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addLeague = useLeagueStore((state) => state.addLeague);

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

  useEffect(() => {
    // `detailsStepRef`/`latestRef` are read for their value at the moment
    // this cleanup actually runs (true unmount), not at the moment this
    // effect was registered — an empty dependency array is correct.
    return (): void => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
      const fromRef = detailsStepRef.current?.getValues();
      const currentDetails = fromRef ?? latestRef.current.details;
      useLeagueDraftStore.getState().setDraft({
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

  const goToStep = (next: LeagueSetupStep): void => {
    syncDetailsFromRef();
    stepsRef.current?.setValue(next);
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
    const league = addLeague({
      name: details.name.trim(),
      homeAdvantage: details.homeAdvantage,
      points: details.points,
      teams: selectedTeams,
    });
    setStatus(`League "${league.name}" created with ${league.teams.length} teams.`);
    useLeagueDraftStore.getState().reset();
    setDetails(useLeagueDraftStore.getState().details);
    setSelectedSlugs([]);
    setStep('details');
    stepsRef.current?.setValue('details');
  };

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: '1 · Details',
      content: (
        <DetailsStep
          initial={details}
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
      />

      {status && <span class={styles.status}>{status}</span>}
    </div>
  );
}
LeagueSetupScreen.displayName = 'LeagueSetupScreen';
