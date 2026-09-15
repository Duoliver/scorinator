import type { JSX } from 'preact';
import { Card, Tabs, type TabItem } from '@/design-system';
import { useLeagueStore } from '@/app/state/leagueStore';
import { ROUTES } from '@/app/routes';
import { describeLeague } from './leagueSummary';
import styles from './LeagueDetailScreen.module.css';

interface LeagueDetailScreenProps {
  slug: string;
}

/** Standings and Fixtures only, matching the design reference exactly —
 * scorination is a button inside Fixtures there, not its own tab. Both
 * tabs render a placeholder here: real rendering is Task 14 (fixtures)
 * and Task 16 (standings); wiring the scorinate buttons is Task 15. None
 * of that is built yet, so this screen is a routed shell only. */
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
      content: (
        <Card padding="lg">
          <p class={styles.placeholder}>
            Fixtures for this league will show here once Task 14 is built.
          </p>
        </Card>
      ),
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
