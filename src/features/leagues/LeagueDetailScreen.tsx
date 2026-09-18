import type { JSX } from 'preact';
import { Tabs, type TabItem } from '@/design-system';
import { useLeagueStore } from '@/app/state/leagueStore';
import { ROUTES } from '@/app/routes';
import { FixturesView } from '@/features/fixtures';
import { StandingsView } from '@/features/standings';
import { describeLeague } from './leagueSummary';
import styles from './LeagueDetailScreen.module.css';

interface LeagueDetailScreenProps {
  slug: string;
}

/** Standings and Fixtures only, matching the design reference exactly —
 * scorination is a button inside Fixtures there, not its own tab. Fixtures
 * (Task 14) renders the matchday browser, and its Scorinate buttons
 * (Task 15) play a match or a whole matchday. Standings (Task 16) renders
 * the live league table from the same `league` record, so a scorinate in
 * Fixtures shows up there on the next tab switch. */
export function LeagueDetailScreen({ slug }: LeagueDetailScreenProps): JSX.Element {
  const leagues = useLeagueStore((state) => state.leagues);
  const league = leagues.find((candidate) => candidate.slug === slug);

  if (!league) {
    return (
      <div class={styles.screen}>
        <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
          ← Leagues
        </a>
        <p>League not found.</p>
      </div>
    );
  }

  const pointsSummary = `${league.points.win}/${league.points.draw}/${league.points.loss} pts`;
  const meta = `${describeLeague(league)} · ${pointsSummary}`;

  const tabs: TabItem[] = [
    {
      id: 'standings',
      label: 'Standings',
      content: <StandingsView league={league} />,
    },
    {
      id: 'fixtures',
      label: 'Fixtures',
      content: <FixturesView league={league} />,
    },
  ];

  return (
    <div class={styles.screen}>
      <div>
        <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
          ← Leagues
        </a>
        <h1 class={styles.title}>{league.name}</h1>
        <span class={styles.meta}>{meta}</span>
      </div>

      <Tabs tabs={tabs} defaultTab="standings" />
    </div>
  );
}
LeagueDetailScreen.displayName = 'LeagueDetailScreen';
