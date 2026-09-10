import type { JSX } from 'preact';
import { Badge, Button } from '../../../design-system';
import type { PointsConfig } from '../../../engine/standings';
import type { TeamRecord } from '../../components';

interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  selectedTeams: readonly TeamRecord[];
  onBack: () => void;
  onCreate: () => void;
}

export function ReviewStep({
  name,
  homeAdvantage,
  points,
  selectedTeams,
  onBack,
  onCreate,
}: ReviewStepProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
        {name || 'Untitled league'}
      </h2>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge tone="neutral">Round robin (two-way)</Badge>
        <Badge tone={homeAdvantage ? 'accent' : 'neutral'}>
          Home adv. {homeAdvantage ? 'on' : 'off'}
        </Badge>
        <Badge tone="neutral">
          {points.win}/{points.draw}/{points.loss} pts
        </Badge>
        <Badge tone="neutral">{selectedTeams.length} teams</Badge>
      </div>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0, padding: 0, listStyle: 'none' }}>
        {selectedTeams.map((team) => (
          <li
            key={team.slug}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <div
              style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid var(--color-fg)',
                background: team.colour || 'transparent',
              }}
            />
            <span>{team.name}</span>
            <Badge tone="dark">{team.tier}</Badge>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onCreate} disabled={!name.trim() || selectedTeams.length === 0}>
          Create league
        </Button>
      </div>
    </div>
  );
}
ReviewStep.displayName = 'ReviewStep';
