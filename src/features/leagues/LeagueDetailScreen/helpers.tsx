import type { TabItem } from '@/design-system';
import type { LeagueRecord } from '@/domain';
import { FixturesView } from '@/features/fixtures';
import { StandingsView } from '@/features/standings';

/** Standings and Fixtures only, matching the design reference exactly —
 * scorination is a button inside Fixtures there, not its own tab. Both
 * views read the same `league` record, so a scorinate in Fixtures shows up
 * in Standings on the next tab switch. */
export const getLeagueTabs = (
  league: LeagueRecord,
  fixturesMatchday: number,
  onMatchdayChange: (matchday: number) => void
): TabItem[] => [
  {
    id: 'standings',
    label: 'Standings',
    content: <StandingsView league={league} />,
  },
  {
    id: 'fixtures',
    label: 'Fixtures',
    content: (
      <FixturesView
        league={league}
        initialMatchday={fixturesMatchday}
        onMatchdayChange={onMatchdayChange}
      />
    ),
  },
];
