import { useState } from 'preact/hooks';
import type { SeasonWrapper } from '@/domain';
import { updateSeasonTeam, type SeasonTeamChanges } from '@/app/state/seasonActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import type { SeasonTeamDrawerProps } from './SeasonTeamDrawer';
import { findLeagueNames } from './helpers';

/** The edit drawer of one Season team (US-13.4, Task 213 choice 6). The
 * name and the trigram of the other Season teams are taken. */
export function useTeamEdit(season: SeasonWrapper | undefined): {
  openDrawer: (blueprintUuid: string) => void;
  drawer: SeasonTeamDrawerProps | null;
} {
  const [editing, setEditing] = useState<string | null>(null);
  const team = season?.teams.find((candidate) => candidate.blueprintUuid === editing);
  if (!season || !team) return { openDrawer: setEditing, drawer: null };

  const others = season.teams.filter((candidate) => candidate !== team);
  return {
    openDrawer: setEditing,
    drawer: {
      team,
      leagueNames: findLeagueNames(season, team.blueprintUuid),
      otherNames: others.map((other) => other.name),
      otherTrigrams: others.map((other) => other.trigram),
      onSave: (changes: Required<SeasonTeamChanges>): void => {
        updateSeasonTeam(season.uuid, team.blueprintUuid, changes);
        setEditing(null);
        setStatusLine({ tone: 'info', message: `Saved ${changes.name}.` });
      },
      onCancel: (): void => setEditing(null),
    },
  };
}
