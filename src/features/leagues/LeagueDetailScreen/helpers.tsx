import type { JSX } from 'preact';
import { Button, Tabs, Tooltip, type TabItem } from '@/design-system';
import type { LeagueWrapper } from '@/domain';
import { FixturesView } from '@/features/fixtures';
import { GroupCards } from '@/features/leagues/GroupCards';
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

/** The draw of the current phase while it can change (Task 181): a later
 * Groups phase with no result. */
export interface GroupsDraw {
  groups: readonly (readonly string[])[];
  onMove: (blueprintUuid: string, groupIndex: number) => void;
  onShuffle: () => void;
}

/** The line under a draw that can change (Task 181 choice 4). */
export const DRAW_RULE_LINE =
  'You can change the groups until the first match has a result. A group needs at least 2 teams.';

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

const ShuffleButton = ({ draw }: { draw: GroupsDraw }): JSX.Element => (
  <Button variant="secondary" size="sm" onClick={draw.onShuffle}>
    ⟲ Shuffle groups
  </Button>
);

/** The draw cards of Task 181 (choice 1): the wizard group cards, with the
 * moves only, and the rule line. */
const DrawEditor = ({
  league,
  draw,
}: {
  league: LeagueWrapper;
  draw: GroupsDraw;
}): JSX.Element => (
  <div class={styles.draw}>
    <GroupCards
      groups={draw.groups}
      teams={league.teams}
      onMove={draw.onMove}
      keepTwoPerGroup
    />
    <p class={styles.note}>{DRAW_RULE_LINE}</p>
  </div>
);

/** Standings and Fixtures of one started phase, matching the design
 * reference: scorination is a button inside Fixtures, not its own tab. Both
 * views read the same `league` wrapper, so a scorinate in Fixtures shows up
 * in Standings on the next tab switch. With a `draw`, the Standings tab
 * shows the draw cards in place of the tables (Task 181). */
export const getLeagueTabs = (
  league: LeagueWrapper,
  phaseIndex: number,
  memory: MatchdayMemory,
  draw?: GroupsDraw
): TabItem[] => [
  {
    id: 'standings',
    label: 'Standings',
    content: draw ? (
      <DrawEditor league={league} draw={draw} />
    ) : (
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
 * (Task 132 choice 2), or "⟲ Shuffle groups" while its draw can change
 * (Task 181 choice 2). A phase not started yet holds the US-07.3 line
 * (Task 132 choice 6). */
export const getPhaseTabs = (
  league: LeagueWrapper,
  memory: MatchdayMemory,
  start: PhaseStart | undefined,
  draw: GroupsDraw | undefined
): TabItem[] =>
  league.content.plans.map((plan, index) => {
    const number = index + 1;
    const started = index < league.content.phases.length;
    const isCurrent = index === league.content.phases.length - 1;
    const currentDraw = isCurrent ? draw : undefined;
    let actions: JSX.Element | undefined;
    if (isCurrent && start) actions = <StartButton start={start} />;
    else if (currentDraw) actions = <ShuffleButton draw={currentDraw} />;
    return {
      id: phaseTabId(index),
      label: `${number} · ${phaseShortName(plan)}`,
      content: started ? (
        <Tabs
          key={phaseTabId(index)}
          tabs={getLeagueTabs(league, index, memory, currentDraw)}
          defaultTab="standings"
          actions={actions}
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
