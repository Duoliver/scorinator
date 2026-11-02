import type { JSX } from 'preact';
import { Button, Tabs, Tooltip, type TabItem } from '@/design-system';
import type { LeagueWrapper } from '@/domain';
import { FixturesView } from '@/features/fixtures';
import { formatAdvanceText, phaseShortName } from '@/features/leagues/leagueSummary';
import { StandingsView } from '@/features/standings';
import styles from './LeagueDetailScreen.module.css';

/** Keeps the visible matchday of each phase, from 0, across tab switches:
 * `Tabs` unmounts an inactive tab. */
export interface MatchdayMemory {
  matchdayOf: (phaseIndex: number) => number;
  setMatchday: (phaseIndex: number, matchday: number) => void;
}

/** The Start button of the next phase (US-07.3), for the tab of the
 * current phase. `hint` is the reason it is off, for a Bracket next phase
 * (Task 132 choice 4). */
export interface PhaseStart {
  label: string;
  hint: string | undefined;
  onClick: () => void;
}

/** The reason the Start button is off for a Bracket next phase. */
export const BRACKET_START_HINT =
  'A Bracket phase cannot start yet. It comes with the bracket screens.';

const StartButton = ({ start }: { start: PhaseStart }): JSX.Element => {
  const { hint } = start;
  if (hint === undefined) {
    return (
      <Button variant="primary" size="sm" onClick={start.onClick}>
        {start.label}
      </Button>
    );
  }
  return (
    <Tooltip content={hint}>
      {(describedBy) => (
        <Button
          variant="primary"
          size="sm"
          aria-describedby={describedBy}
          disabled
          focusableWhenDisabled
        >
          {start.label}
        </Button>
      )}
    </Tooltip>
  );
};

/** Standings and Fixtures of one started phase, matching the design
 * reference: scorination is a button inside Fixtures, not its own tab. Both
 * views read the same `league` wrapper, so a scorinate in Fixtures shows up
 * in Standings on the next tab switch. */
export const getLeagueTabs = (
  league: LeagueWrapper,
  phaseIndex: number,
  memory: MatchdayMemory
): TabItem[] => [
  {
    id: 'standings',
    label: 'Standings',
    content: (
      <StandingsView
        league={league}
        phaseIndex={phaseIndex}
        advanceText={formatAdvanceText(league.content.plans, phaseIndex)}
      />
    ),
  },
  {
    id: 'fixtures',
    label: 'Fixtures',
    content: (
      <FixturesView
        league={league}
        phaseIndex={phaseIndex}
        initialMatchday={memory.matchdayOf(phaseIndex)}
        onMatchdayChange={(matchday) => memory.setMatchday(phaseIndex, matchday)}
      />
    ),
  },
];

/** One tab for each planned phase (US-01.2): "1 · Group Stage". A started
 * phase holds its own Standings and Fixtures tabs, keyed by phase, so a
 * switch between phases mounts fresh views. The current phase has the
 * Start button of the next phase at the end of that row, when it can start
 * (Task 132 choice 2). A phase not started yet holds the US-07.3 line
 * (Task 132 choice 6). */
export const getPhaseTabs = (
  league: LeagueWrapper,
  memory: MatchdayMemory,
  start: PhaseStart | undefined
): TabItem[] =>
  league.content.plans.map((plan, index) => {
    const number = index + 1;
    const started = index < league.content.phases.length;
    const isCurrent = index === league.content.phases.length - 1;
    return {
      id: phaseTabId(index),
      label: `${number} · ${phaseShortName(plan)}`,
      content: started ? (
        <Tabs
          key={phaseTabId(index)}
          tabs={getLeagueTabs(league, index, memory)}
          defaultTab="standings"
          actions={isCurrent && start ? <StartButton start={start} /> : undefined}
        />
      ) : (
        <p class={styles.note}>
          This phase starts when phase {number - 1} is complete.
        </p>
      ),
    };
  });

/** The id of the tab of a phase, from 0. */
export const phaseTabId = (phaseIndex: number): string => `phase-${phaseIndex + 1}`;
