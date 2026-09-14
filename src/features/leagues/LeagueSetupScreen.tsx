import { useRef, useState } from 'preact/hooks';
import type { JSX, RefObject } from 'preact';
import { Tabs, type TabItem } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import {
  useLeagueDraftStore,
  type LeagueSetupStep,
} from '@/app/state/leagueDraftStore';
import { DetailsStep } from './steps/DetailsStep';
import { TeamsStep } from './steps/TeamsStep';
import { ReviewStep } from './steps/ReviewStep';
import styles from './LeagueSetupScreen.module.css';

export function LeagueSetupScreen(): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addLeague = useLeagueStore((state) => state.addLeague);

  const details = useLeagueDraftStore((state) => state.details);
  const selectedSlugs = useLeagueDraftStore((state) => state.selectedSlugs);
  const step = useLeagueDraftStore((state) => state.step);
  const setName = useLeagueDraftStore((state) => state.setName);
  const setPoints = useLeagueDraftStore((state) => state.setPoints);
  const setHomeAdvantage = useLeagueDraftStore((state) => state.setHomeAdvantage);
  const toggleTeam = useLeagueDraftStore((state) => state.toggleTeam);
  const selectTeam = useLeagueDraftStore((state) => state.selectTeam);
  const selectAllTeams = useLeagueDraftStore((state) => state.selectAllTeams);
  const clearSelection = useLeagueDraftStore((state) => state.clearSelection);
  const setStep = useLeagueDraftStore((state) => state.setStep);
  const resetDraft = useLeagueDraftStore((state) => state.reset);

  const stepsRef: RefObject<FieldHandle<string>> = useRef(null);
  const [status, setStatus] = useState<string | null>(null);

  const selectedTeams = teams.filter((team) => selectedSlugs.includes(team.slug));

  const goToStep = (next: LeagueSetupStep): void => {
    stepsRef.current?.setValue(next);
    setStep(next);
  };

  const handleCreate = (): void => {
    const league = addLeague({
      name: details.name.trim(),
      homeAdvantage: details.homeAdvantage,
      points: details.points,
      teams: selectedTeams,
    });
    setStatus(`League "${league.name}" created with ${league.teams.length} teams.`);
    resetDraft();
    stepsRef.current?.setValue('details');
  };

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: '1 · Details',
      content: (
        <DetailsStep
          name={details.name}
          points={details.points}
          homeAdvantage={details.homeAdvantage}
          onNameChange={setName}
          onPointsChange={setPoints}
          onHomeAdvantageChange={setHomeAdvantage}
          onNext={() => goToStep('teams')}
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
        onChange={(id) => setStep(id as LeagueSetupStep)}
        ref={stepsRef}
        fullWidth
      />

      {status && <span class={styles.status}>{status}</span>}
    </div>
  );
}
LeagueSetupScreen.displayName = 'LeagueSetupScreen';
