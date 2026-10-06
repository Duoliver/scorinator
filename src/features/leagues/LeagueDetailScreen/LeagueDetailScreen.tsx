import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Badge, Tabs, type TabItem } from '@/design-system';
import { useLeagueStore } from '@/app/state/leagueStore';
import { setCurrentLeague } from '@/app/state/fileActions';
import { isLeagueUnsaved, useFileStore } from '@/app/state/fileStore';
import { ROUTES } from '@/app/routes';
import { FixturesView } from '@/features/fixtures';
import { StandingsView } from '@/features/standings';
import { describeLeague } from '@/features/leagues/leagueSummary';
import styles from './LeagueDetailScreen.module.css';

interface LeagueDetailScreenProps {
  slug: string;
}

/** Standings and Fixtures only, matching the design reference exactly —
 * scorination is a button inside Fixtures there, not its own tab. Fixtures
 * (Task 14) renders the matchday browser, and its Scorinate buttons
 * (Task 15) play a match or a whole matchday. Standings (Task 16) renders
 * the live league table from the same `league` record, so a scorinate in
 * Fixtures shows up there on the next tab switch. An `Unsaved` badge
 * (Task 26) sits beside the title while the league has unsaved changes. */
export function LeagueDetailScreen({ slug }: LeagueDetailScreenProps): JSX.Element {
  const leagues = useLeagueStore((state) => state.leagues);
  const savedLeagues = useFileStore((state) => state.savedLeagues);
  // `Tabs` unmounts the inactive tab, so `FixturesView`'s own matchday state
  // would reset on every switch. Kept here instead, and fed back in below.
  const [fixturesMatchday, setFixturesMatchday] = useState(1);
  const league = leagues.find((candidate) => candidate.slug === slug);
  const found = league !== undefined;

  // The league on screen is the one Ctrl+S saves (Task 17).
  useEffect(() => {
    if (found) setCurrentLeague(slug);
  }, [slug, found]);

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
      content: (
        <FixturesView
          league={league}
          initialMatchday={fixturesMatchday}
          onMatchdayChange={setFixturesMatchday}
        />
      ),
    },
  ];

  return (
    <div class={styles.screen}>
      <div>
        <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
          ← Leagues
        </a>
        <div class={styles.titleRow}>
          <h1 class={styles.title}>{league.name}</h1>
          {isLeagueUnsaved(league, savedLeagues) && (
            <Badge tone="warning">Unsaved</Badge>
          )}
        </div>
        <span class={styles.meta}>{meta}</span>
      </div>

      <Tabs tabs={tabs} defaultTab="standings" />
    </div>
  );
}
LeagueDetailScreen.displayName = 'LeagueDetailScreen';
