import type { JSX } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Badge, Button } from '@/design-system';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import {
  findCurrentMatchday,
  findResult,
  isMatchdayFullyPlayed,
} from '@/features/scorination';
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

/** How long a freshly generated score shows in the accent colour. */
const SCORE_FLASH_MS = 500;

const fixtureKey = (match: { matchday: number; home: string; away: string }): string =>
  `${match.matchday}-${match.home}-${match.away}`;

/** Scorination (Task 15) plays an unplayed match, or a whole unplayed
 * matchday, via `useLeagueStore`'s `scorinateFixture`/`scorinateMatchday`.
 * A played match shows its real score, and its button turns into
 * Re-scorinate (Task 7 store action, Task 19 UI), which draws a new score
 * and overwrites the old one with no confirm — MVP1 §1: a round-robin
 * match feeds nothing downstream.
 *
 * A score flashes in the accent colour for `SCORE_FLASH_MS` whenever it is
 * generated, the first time or on a re-scorinate. A generated score is a
 * result object the previous render did not hold (`scorinateFixture` adds
 * one, `rescorinateFixture` replaces one, and both leave every other result
 * as the same object). So the flash does not depend on the new score
 * differing from the old, does not play for results that exist when the view
 * opens, and does not replay when the user changes matchday. */
export function FixturesView({
  league,
  initialMatchday = 1,
  onMatchdayChange,
}: FixturesViewProps): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const scorinateFixture = useLeagueStore((state) => state.scorinateFixture);
  const rescorinateFixture = useLeagueStore((state) => state.rescorinateFixture);
  const scorinateMatchday = useLeagueStore((state) => state.scorinateMatchday);
  const [matchday, setMatchday] = useState(initialMatchday);
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());
  const seenResults = useRef(league.results);
  const flashTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useLayoutEffect(() => {
    const previous = new Set(seenResults.current);
    seenResults.current = league.results;
    const generated = league.results.filter((result) => !previous.has(result));
    if (generated.length === 0) return;

    const keys = generated.map(fixtureKey);
    setFlashing((current) => new Set([...current, ...keys]));
    for (const key of keys) {
      clearTimeout(flashTimers.current.get(key));
      flashTimers.current.set(
        key,
        setTimeout(() => {
          flashTimers.current.delete(key);
          setFlashing((current) => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        }, SCORE_FLASH_MS)
      );
    }
  }, [league.results]);

  useLayoutEffect(() => {
    const timers = flashTimers.current;
    return (): void => timers.forEach(clearTimeout);
  }, []);

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
              <span
                class={styles.score}
                data-flashing={flashing.has(fixtureKey(fixture)) ? '' : undefined}
              >
                {result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs'}
              </span>
              <div class={styles.away}>
                <span class={styles.swatch} style={{ background: away.colour }} />
                {away.name}
              </div>
              <div class={styles.action}>
                <Button
                  variant={result ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() =>
                    result
                      ? rescorinateFixture(league.slug, fixture)
                      : scorinateFixture(league.slug, fixture)
                  }
                >
                  {result ? 'Re-scorinate' : 'Scorinate'}
                </Button>
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
