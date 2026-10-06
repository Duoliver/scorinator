import type { JSX } from 'preact';
import { Badge, Button } from '@/design-system';
import type FixturesViewProps from './types';
import { flashAttr, scoreText } from './helpers';
import { useFixtures } from './useFixtures';
import styles from './FixturesView.module.css';

export type { FixturesViewProps };

/** The matchday browser for one league: a header with the matchday jump
 * buttons and Scorinate matchday, then one row for each match. `useFixtures`
 * gives the data and the handlers. */
export function FixturesView(props: FixturesViewProps): JSX.Element {
  const {
    hasFixtures,
    nav,
    rows,
    byeTeamName,
    matchdayFullyPlayed,
    scorinateMatchday,
  } = useFixtures(props);

  if (!hasFixtures) {
    return <p class={styles.empty}>Not enough teams to generate fixtures yet.</p>;
  }

  return (
    <div class={styles.view}>
      <div class={styles.nav}>
        <div class={styles.matchdayNav}>
          <Button
            variant="secondary"
            size="sm"
            aria-label="First matchday"
            disabled={!nav.canGoBack}
            onClick={nav.goToFirst}
          >
            <span class={styles.jumpIcon} aria-hidden="true">
              «
            </span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous matchday"
            disabled={!nav.canGoBack}
            onClick={nav.goToPrevious}
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
              Matchday {nav.matchday} / {nav.totalMatchdays}
            </span>
            <span class={styles.shortText} aria-hidden="true">
              {nav.matchday} / {nav.totalMatchdays}
            </span>
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next matchday"
            disabled={!nav.canGoForward}
            onClick={nav.goToNext}
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
            disabled={!nav.canGoForward}
            onClick={nav.goToLast}
          >
            <span class={styles.jumpIcon} aria-hidden="true">
              »
            </span>
          </Button>
        </div>
        <div class={styles.actions}>
          {nav.leagueCompleted ? (
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
              disabled={nav.atCurrentMatchday}
              onClick={nav.goToCurrent}
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
            disabled={matchdayFullyPlayed}
            onClick={scorinateMatchday}
          >
            <span>
              Scorinate<span class={styles.wideOnly}> matchday</span>
            </span>
          </Button>
        </div>
      </div>

      <div class={styles.list}>
        {rows.map((row) => (
          // The goals spans serve only the stacked layout (Task 39), where
          // each team has its own line. The score span stays the one text
          // that screen readers and tests read, in both layouts.
          <div class={styles.match} key={row.key}>
            <div class={styles.home}>
              <span class={styles.teamName}>{row.home.name}</span>
              <span class={styles.swatch} style={{ background: row.home.colour }} />
              <span
                class={styles.goals}
                data-goals="home"
                data-flashing={flashAttr(row.flashing)}
                aria-hidden="true"
              >
                {row.result?.homeGoals}
              </span>
            </div>
            <span class={styles.score} data-flashing={flashAttr(row.flashing)}>
              {scoreText(row.result)}
            </span>
            <div class={styles.away}>
              <span class={styles.swatch} style={{ background: row.away.colour }} />
              <span class={styles.teamName}>{row.away.name}</span>
              <span
                class={styles.goals}
                data-goals="away"
                data-flashing={flashAttr(row.flashing)}
                aria-hidden="true"
              >
                {row.result?.awayGoals}
              </span>
            </div>
            <div class={styles.action}>
              <Button
                variant={row.result ? 'secondary' : 'primary'}
                size="sm"
                onClick={row.scorinate}
              >
                {row.result ? 'Re-scorinate' : 'Scorinate'}
              </Button>
            </div>
          </div>
        ))}
        {byeTeamName && (
          <div class={styles.bye}>
            <Badge tone="warning">Bye</Badge>
            {byeTeamName}
          </div>
        )}
      </div>
    </div>
  );
}
FixturesView.displayName = 'FixturesView';
