import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Badge, Button } from '@/design-system';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { findCurrentMatchday, findResult, isMatchdayFullyPlayed } from '@/features/scorination';
import type { LeagueRecord } from '@/features/leagues/types';
import styles from './FixturesView.module.css';

interface FixturesViewProps {
  league: LeagueRecord;
  /** Which matchday is visible on mount. Uncontrolled after that, the same
   * convention as `Tabs`' `defaultTab`. */
  initialMatchday?: number;
  /** Notified whenever the visible matchday changes. `Tabs` unmounts an
   * inactive tab, so a parent that must keep the matchday across a tab
   * switch stores it here and passes it back as `initialMatchday`. */
  onMatchdayChange?: (matchday: number) => void;
}

interface TeamDisplay {
  name: string;
  colour: string;
}

/** Scorination (Task 15) plays an unplayed match, or a whole unplayed
 * matchday, via `useLeagueStore`'s `scorinateFixture`/`scorinateMatchday`.
 * A played match shows its real score, with no button — re-scorinate is
 * Task 7 (engine) plus Task 19 (UI), confirmed out of scope here, see the
 * Task 15 decisions log entry. */
export function FixturesView({
  league,
  initialMatchday = 1,
  onMatchdayChange,
}: FixturesViewProps): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const scorinateFixture = useLeagueStore((state) => state.scorinateFixture);
  const scorinateMatchday = useLeagueStore((state) => state.scorinateMatchday);
  const [matchday, setMatchday] = useState(initialMatchday);

  const goToMatchday = (next: number): void => {
    setMatchday(next);
    onMatchdayChange?.(next);
  };

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
  // `undefined` means every match has a result: the league is completed.
  const currentMatchday = findCurrentMatchday(league);

  return (
    <div class={styles.view}>
      <div class={styles.nav}>
        <div class={styles.matchdayNav}>
          <Button
            variant="secondary"
            size="sm"
            aria-label="First matchday"
            disabled={matchday <= 1}
            onClick={() => goToMatchday(1)}
          >
            <span class={styles.jumpIcon} aria-hidden="true">
              «
            </span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={matchday <= 1}
            onClick={() => goToMatchday(matchday - 1)}
          >
            ← Previous matchday
          </Button>
          <span class={styles.matchday}>
            Matchday {matchday} / {totalMatchdays}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={matchday >= totalMatchdays}
            onClick={() => goToMatchday(matchday + 1)}
          >
            Next matchday →
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Last matchday"
            disabled={matchday >= totalMatchdays}
            onClick={() => goToMatchday(totalMatchdays)}
          >
            <span class={styles.jumpIcon} aria-hidden="true">
              »
            </span>
          </Button>
        </div>
        <div class={styles.actions}>
          {currentMatchday === undefined ? (
            <Badge tone="accent">League completed</Badge>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={matchday === currentMatchday}
              onClick={() => goToMatchday(currentMatchday)}
            >
              Current matchday
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={isMatchdayFullyPlayed(league, matchday)}
            onClick={() => scorinateMatchday(league.slug, matchday)}
          >
            Scorinate matchday
          </Button>
        </div>
      </div>

      <div class={styles.list}>
        {matchesThisMatchday.map((fixture) => {
          const home = teamDisplay(fixture.home);
          const away = teamDisplay(fixture.away);
          const result = findResult(league, fixture);
          return (
            <div class={styles.match} key={`${fixture.home}-${fixture.away}`}>
              <div class={styles.home}>
                {home.name}
                <span class={styles.swatch} style={{ background: home.colour }} />
              </div>
              <span class={styles.score}>
                {result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs'}
              </span>
              <div class={styles.away}>
                <span class={styles.swatch} style={{ background: away.colour }} />
                {away.name}
              </div>
              <div class={styles.action}>
                {!result && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => scorinateFixture(league.slug, fixture)}
                  >
                    Scorinate
                  </Button>
                )}
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