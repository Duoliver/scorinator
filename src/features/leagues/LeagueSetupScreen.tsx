import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Button } from '../../design-system';
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from '../../engine/standings';
import { useTeamsStore } from '../../app/state/teamsStore';
import { useLeagueStore } from '../../app/state/leagueStore';
import { DetailsStep } from './steps/DetailsStep';
import { TeamsStep } from './steps/TeamsStep';
import { ReviewStep } from './steps/ReviewStep';

type Step = 'details' | 'teams' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'details', label: '1 · Details' },
  { id: 'teams', label: '2 · Teams' },
  { id: 'review', label: '3 · Review' },
];

function emptyDetails(): { name: string; points: PointsConfig; homeAdvantage: boolean } {
  return { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false };
}

export function LeagueSetupScreen(): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addLeague = useLeagueStore((state) => state.addLeague);

  const [step, setStep] = useState<Step>('details');
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
    setStep('details');
    setDetails(emptyDetails());
    setSelectedSlugs([]);
  };

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
      <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
        League Setup
      </h1>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {STEPS.map((s) => (
          <Button
            key={s.id}
            variant={s.id === step ? 'primary' : 'secondary'}
            onClick={() => setStep(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {step === 'details' && (
        <DetailsStep
          name={details.name}
          points={details.points}
          homeAdvantage={details.homeAdvantage}
          onNameChange={(name) => setDetails((current) => ({ ...current, name }))}
          onPointsChange={(points) => setDetails((current) => ({ ...current, points }))}
          onHomeAdvantageChange={(homeAdvantage) =>
            setDetails((current) => ({ ...current, homeAdvantage }))
          }
          onNext={() => setStep('teams')}
        />
      )}

      {step === 'teams' && (
        <TeamsStep
          selectedSlugs={selectedSlugs}
          onToggleTeam={toggleTeam}
          onTeamCreated={selectTeam}
          onBack={() => setStep('details')}
          onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          selectedTeams={selectedTeams}
          onBack={() => setStep('teams')}
          onCreate={handleCreate}
        />
      )}

      {status && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
          {status}
        </span>
      )}
    </div>
  );
}
LeagueSetupScreen.displayName = 'LeagueSetupScreen';
