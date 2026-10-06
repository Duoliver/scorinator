import type { JSX } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Badge, Button } from '@/design-system';
import {
  rescorinateFixture,
  scorinateFixture,
  scorinateMatchday,
} from '@/app/state/leagueActions';
import {
  findCurrentMatchday,
  findResult,
  isMatchdayFullyPlayed,
} from '@/features/scorination';
import { useTeamLookup } from '@/features/components';
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

/** How long a freshly generated score shows in the accent colour. */
const SCORE_FLASH_MS = 500;

const fixtureKey = (match: { matchday: number; home: string; away: string }): string =>
  `${match.matchday}-${match.home}-${match.away}`;

/** Scorination (Task 15) plays an unplayed match, or a whole unplayed
 * matchday, via `leagueActions`' `scorinateFixture`/`scorinateMatchday`.
 * A played match shows its real score, and its button turns into
 * Re-scorinate (Task 7 action, Task 19 UI), which draws a new score
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
  const teamDisplay = useTeamLookup();
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
            aria-label="Previous matchday"
            disabled={matchday <= 1}
            onClick={() => goToMatchday(matchday - 1)}
          >
            {/* One outer span: `Button` is a flex row with a gap, and the
                inner text must keep normal word spacing. */}
            <span>
              <span aria-hidden="true">←</span>
              <span class={styles.wideOnly}> Previous matchday</span>
            </span>
          </Button>
          <span class={styles.matchday}>
            {/* Two counters, so each one stays a single text node: the full
                one for screen readers and text search, hidden from view on
                a narrow width, and a short one shown only there. */}
            <span class={styles.fullText}>
              Matchday {matchday} / {totalMatchdays}
            </span>
            <span class={styles.shortText} aria-hidden="true">
              {matchday} / {totalMatchdays}
            </span>
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next matchday"
            disabled={matchday >= totalMatchdays}
            onClick={() => goToMatchday(matchday + 1)}
          >
            <span>
              <span class={styles.wideOnly}>Next matchday </span>
              <span aria-hidden="true">→</span>
            </span>
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
            <Badge tone="accent">
              <span class={styles.fullText}>League completed</span>
              <span class={styles.shortText} aria-hidden="true">
                Completed
              </span>
            </Badge>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              aria-label="Current matchday"
              disabled={matchday === currentMatchday}
              onClick={() => goToMatchday(currentMatchday)}
            >
              <span>
                Current<span class={styles.wideOnly}> matchday</span>
              </span>
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            aria-label="Scorinate matchday"
            disabled={isMatchdayFullyPlayed(league, matchday)}
            onClick={() => scorinateMatchday(league.slug, matchday)}
          >
            <span>
              Scorinate<span class={styles.wideOnly}> matchday</span>
            </span>
          </Button>
        </div>
      </div>

      <div class={styles.list}>
        {matchesThisMatchday.map((fixture) => {
          const home = teamDisplay(fixture.home);
          const away = teamDisplay(fixture.away);
          const result = findResult(league, fixture);
          const flash = flashing.has(fixtureKey(fixture)) ? '' : undefined;
          // The goals spans serve only the stacked layout (Task 39), where
          // each team has its own line. The score span stays the one text
          // that screen readers and tests read, in both layouts.
          return (
            <div class={styles.match} key={`${fixture.home}-${fixture.away}`}>
              <div class={styles.home}>
                <span class={styles.teamName}>{home.name}</span>
                <span class={styles.swatch} style={{ background: home.colour }} />
                <span
                  class={styles.goals}
                  data-goals="home"
                  data-flashing={flash}
                  aria-hidden="true"
                >
                  {result?.homeGoals}
                </span>
              </div>
              <span class={styles.score} data-flashing={flash}>
                {result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs'}
              </span>
              <div class={styles.away}>
                <span class={styles.swatch} style={{ background: away.colour }} />
                <span class={styles.teamName}>{away.name}</span>
                <span
                  class={styles.goals}
                  data-goals="away"
                  data-flashing={flash}
                  aria-hidden="true"
                >
                  {result?.awayGoals}
                </span>
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
