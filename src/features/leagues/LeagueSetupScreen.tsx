import { useRef, useState } from 'preact/hooks';
import type { JSX, RefObject } from 'preact';
import { Tabs, type TabItem } from '../../design-system';
import type { FieldHandle } from '../../design-system/field';
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from '../../engine/standings';
import { useTeamsStore } from '../../app/state/teamsStore';
import { useLeagueStore } from '../../app/state/leagueStore';
import { DetailsStep } from './steps/DetailsStep';
import { TeamsStep } from './steps/TeamsStep';
import { ReviewStep } from './steps/ReviewStep';

function emptyDetails(): { name: string; points: PointsConfig; homeAdvantage: boolean } {
  return { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false };
}

export function LeagueSetupScreen(): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addLeague = useLeagueStore((state) => state.addLeague);

  const stepsRef: RefObject<FieldHandle<string>> = useRef(null);
  const [details, setDetails] = useState(emptyDetails());
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const selectedTeams = teams.filter((team) => selectedSlugs.includes(team.slug));

  const toggleTeam = (slug: string): void => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  };

  const selectTeam = (slug: string): void => {
    setSelectedSlugs((current) => (current.includes(slug) ? current : [...current, slug]));
  };

  const handleCreate = (): void => {
    const league = addLeague({
      name: details.name.trim(),
      homeAdvantage: details.homeAdvantage,
      points: details.points,
      teams: selectedTeams,
    });
    setStatus(`League "${league.name}" created with ${league.teams.length} teams.`);
    stepsRef.current?.setValue('details');
    setDetails(emptyDetails());
    setSelectedSlugs([]);
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
          onNameChange={(name) => setDetails((current) => ({ ...current, name }))}
          onPointsChange={(points) => setDetails((current) => ({ ...current, points }))}
          onHomeAdvantageChange={(homeAdvantage) =>
            setDetails((current) => ({ ...current, homeAdvantage }))
          }
          onNext={() => stepsRef.current?.setValue('teams')}
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
          onTeamCreated={selectTeam}
          onBack={() => stepsRef.current?.setValue('details')}
          onNext={() => stepsRef.current?.setValue('review')}
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
          onBack={() => stepsRef.current?.setValue('teams')}
          onCreate={handleCreate}
        />
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        padding: '2.5rem 3rem',
        maxWidth: '52rem',
      }}
    >
      <h1>League Setup</h1>

      <Tabs tabs={tabs} defaultTab="details" ref={stepsRef} />

      {status && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
          {status}
        </span>
      )}
    </div>
  );
}
LeagueSetupScreen.displayName = 'LeagueSetupScreen';
