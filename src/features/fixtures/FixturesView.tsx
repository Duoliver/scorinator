import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Badge, Button } from '@/design-system';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { LeagueRecord } from '@/features/leagues/types';
import styles from './FixturesView.module.css';

interface FixturesViewProps {
  league: LeagueRecord;
}

interface TeamDisplay {
  name: string;
  colour: string;
}

/** Scorination (Task 15) is what turns this into a real interactive
 * schedule — this component only ever shows the unplayed schedule Task 14
 * generates, so every match gets the same `vs` placeholder in place of a
 * score, and there is no "Scorinate matchday" action here yet. */
export function FixturesView({ league }: FixturesViewProps): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const [matchday, setMatchday] = useState(1);

  if (league.fixtures.length === 0) {
    return <p class={styles.empty}>Not enough teams to generate fixtures yet.</p>;
  }

  const teamDisplay = (slug: string): TeamDisplay => {
    const team = teams.find((candidate) => candidate.slug === slug);
    return team ? { name: team.name, colour: team.colour } : { name: slug, colour: '' };
  };

  const totalMatchdays = Math.max(
    ...league.fixtures.map((fixture) => fixture.matchday),
    ...league.byes.map((bye) => bye.matchday)
  );

  const matchesThisMatchday = league.fixtures.filter(
    (fixture) => fixture.matchday === matchday
  );
  const byeThisMatchday = league.byes.find((bye) => bye.matchday === matchday);

  return (
    <div class={styles.view}>
      <div class={styles.nav}>
        <Button
          variant="secondary"
          size="sm"
          disabled={matchday <= 1}
          onClick={() => setMatchday((current) => current - 1)}
        >
          ← Previous matchday
        </Button>
        <div class={styles.matchdayWrapper}>
          <span class={styles.matchday}>
            Matchday {matchday} / {totalMatchdays}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={matchday >= totalMatchdays}
          onClick={() => setMatchday((current) => current + 1)}
        >
          Next matchday →
        </Button>
      </div>

      <div class={styles.list}>
        {matchesThisMatchday.map((fixture) => {
          const home = teamDisplay(fixture.home);
          const away = teamDisplay(fixture.away);
          return (
            <div class={styles.match} key={`${fixture.home}-${fixture.away}`}>
              <div class={styles.home}>
                {home.name}
                <span class={styles.swatch} style={{ background: home.colour }} />
              </div>
              <span class={styles.score}>vs</span>
              <div class={styles.away}>
                <span class={styles.swatch} style={{ background: away.colour }} />
                {away.name}
              </div>
            </div>
          );
        })}
        {byeThisMatchday && (
          <div class={styles.bye}>
            <Badge tone="warning">Bye</Badge>
            {teamDisplay(byeThisMatchday.team).name}
          </div>
        )}
      </div>
    </div>
  );
}
FixturesView.displayName = 'FixturesView';
