import type { JSX } from 'preact';
import { Card, Tabs, type TabItem } from '@/design-system';
import { useLeagueStore } from '@/app/state/leagueStore';
import { ROUTES } from '@/app/routes';
import { FixturesView } from '@/features/fixtures';
import { describeLeague } from './leagueSummary';
import styles from './LeagueDetailScreen.module.css';

interface LeagueDetailScreenProps {
  slug: string;
}

/** Standings and Fixtures only, matching the design reference exactly —
 * scorination is a button inside Fixtures there, not its own tab. Fixtures
 * renders the real, read-only matchday browser as of Task 14; Standings
 * still renders a placeholder until Task 16. Wiring the scorinate buttons
 * into Fixtures is Task 15. */
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
      content: (
        <Card padding="lg">
          <p class={styles.placeholder}>
            Standings for this league will show here once Task 16 is built.
          </p>
        </Card>
      ),
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
