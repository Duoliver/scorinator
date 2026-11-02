import { Tabs, type TabItem } from '@/design-system';
import type { LeagueWrapper } from '@/domain';
import { FixturesView } from '@/features/fixtures';
import {
  formatGroupsAdvanceText,
  phaseShortName,
} from '@/features/leagues/leagueSummary';
import { StandingsView } from '@/features/standings';
import styles from './LeagueDetailScreen.module.css';

/** Keeps the visible matchday of each phase, from 0, across tab switches:
 * `Tabs` unmounts an inactive tab. */
export interface MatchdayMemory {
  matchdayOf: (phaseIndex: number) => number;
  setMatchday: (phaseIndex: number, matchday: number) => void;
}

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
        advanceText={formatGroupsAdvanceText(league.content.plans, phaseIndex)}
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
 * switch between phases mounts fresh views. A phase not started yet holds
 * one line (Task 131 choice 1). */
export const getPhaseTabs = (
  league: LeagueWrapper,
  memory: MatchdayMemory
): TabItem[] =>
  league.content.plans.map((plan, index) => {
    const number = index + 1;
    const started = index < league.content.phases.length;
    return {
      id: phaseTabId(index),
      label: `${number} · ${phaseShortName(plan)}`,
      content: started ? (
        <Tabs
          key={phaseTabId(index)}
          tabs={getLeagueTabs(league, index, memory)}
          defaultTab="standings"
        />
      ) : (
        <p class={styles.note}>
          Phase {number} starts when phase {number - 1} is complete.
        </p>
      ),
    };
  });

/** The id of the tab of a phase, from 0. */
export const phaseTabId = (phaseIndex: number): string => `phase-${phaseIndex + 1}`;
