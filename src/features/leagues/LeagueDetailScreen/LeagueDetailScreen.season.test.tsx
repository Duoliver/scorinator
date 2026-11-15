import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { SeasonWrapper } from '@/domain';
import { serializeSeasonWrapper } from '@/app/data/databaseFile';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { createSeasonLeague } from '@/app/state/seasonLeagueActions';
import { summarizeSeason } from '@/app/state/summarizeSeason';
import {
  LEAGUE,
  OTHER_LEAGUE,
  openTestDatabase,
  scheduled,
  SEASON,
  seasonWrapper,
} from '@/test/databaseRecords';
import { LeagueDetailScreen } from './LeagueDetailScreen';

const FINISHED_NOTICE =
  'This Season is finished. It is read only. Reopen it to change it.';
const season = (): SeasonWrapper => useDatabaseStore.getState().seasons[SEASON];

/** Puts the Season in the store: open and saved, or only on disk with its
 * row, as a Season that the user did not open yet. */
function storeSeason(wrapper: SeasonWrapper, options: { open: boolean }): void {
  const memory = openTestDatabase([]);
  memory.files.wrappers[SEASON] = serializeSeasonWrapper(wrapper);
  const row = summarizeSeason(wrapper);
  useDatabaseStore.setState({
    seasonRows: [row],
    savedSeasonRows: [row],
    ...(options.open && {
      seasons: { [SEASON]: wrapper },
      savedSeasons: { [SEASON]: wrapper },
    }),
  });
}

function finishedSeason(): SeasonWrapper {
  const wrapper = seasonWrapper();
  wrapper.content.finished = true;
  return wrapper;
}

beforeEach(() => {
  storeSeason(seasonWrapper(), { open: true });
});

describe('League Detail in a Season (US-13.6, Task 219)', () => {
  it('shows the breadcrumbs of the Season in place of "← Leagues"', () => {
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={LEAGUE} />);

    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumbs' });
    expect(within(crumbs).getByRole('link', { name: 'Seasons' })).toHaveAttribute(
      'href',
      '/seasons'
    );
    expect(
      within(crumbs).getByRole('link', { name: 'Liga Norte 2026-27' })
    ).toHaveAttribute('href', `/seasons/${SEASON}`);
    expect(within(crumbs).getByText('Coastal Premier')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.queryByRole('link', { name: '← Leagues' })).toBeNull();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Coastal Premier' })
    ).toBeInTheDocument();
  });

  it('scorinates a Season league, and shows the Season as unsaved', async () => {
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={LEAGUE} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Scorinate' })[0]!);

    const [league] = season().content.leagues;
    expect(scheduled(league.phases[0]).results).toHaveLength(1);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues).toEqual({});
  });

  it('plays the bracket of a Season league', async () => {
    const view = createSeasonLeague(SEASON, {
      name: 'Taça Norte',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: season().teams,
      plans: [{ format: 'bracket' }],
    });
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={view.uuid} />);

    await userEvent.click(screen.getByRole('button', { name: '⚽ Scorinate bracket' }));

    expect(season().content.leagues[1].phases[0].results).toHaveLength(1);
  });

  it('has no Export menu until Task 247 (choice 5)', () => {
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={LEAGUE} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
  });

  it('opens a Season that is not open yet from its file', async () => {
    storeSeason(seasonWrapper(), { open: false });
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={LEAGUE} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Coastal Premier' })
    ).toBeInTheDocument();
  });

  it('says so for a league that the Season does not have', () => {
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={OTHER_LEAGUE} />);

    expect(screen.getByText('League not found.')).toBeInTheDocument();
  });
});

describe('League Detail in a finished Season (US-13.9, Task 219 choice 4)', () => {
  beforeEach(() => {
    storeSeason(finishedSeason(), { open: true });
  });

  it('shows the notice, and disables scorinate', async () => {
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={LEAGUE} />);

    expect(screen.getByText(FINISHED_NOTICE)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    for (const button of screen.getAllByRole('button', { name: /Scorinate/ })) {
      expect(button).toBeDisabled();
    }
  });

  it('has no "Edit zones"', () => {
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={LEAGUE} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit zones' })).toBeNull();
  });

  it('disables the bracket buttons and the byes', async () => {
    const running = seasonWrapper();
    storeSeason(running, { open: true });
    const view = createSeasonLeague(SEASON, {
      name: 'Taça Norte',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: running.teams,
      plans: [{ format: 'bracket' }],
    });
    useDatabaseStore.setState((now) => ({
      seasons: {
        [SEASON]: {
          ...now.seasons[SEASON],
          content: { ...now.seasons[SEASON].content, finished: true },
        },
      },
    }));
    render(<LeagueDetailScreen seasonUuid={SEASON} uuid={view.uuid} />);

    expect(screen.getByRole('button', { name: '⚽ Scorinate bracket' })).toBeDisabled();
    for (const button of screen.queryAllByRole('button', { name: /^Scorinate/ })) {
      expect(button).toBeDisabled();
    }
    await userEvent.click(screen.getByRole('tab', { name: 'Seed List' }));
    for (const star of screen.queryAllByRole('button', { name: /bye/i })) {
      expect(star).toBeDisabled();
    }
  });
});
