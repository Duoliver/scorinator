import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { route } from 'preact-router';
import type { SeasonWrapper, TeamInstance } from '@/domain';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  emptyLeagueDraft,
  getLeagueDraft,
  useLeagueDraftStore,
} from '@/app/state/leagueDraftStore';
import { setLeagueDraft } from '@/app/state/leagueDraftActions';
import { summarizeSeason } from '@/app/state/summarizeSeason';
import {
  INSTALLATION,
  instance,
  openTestDatabase,
  SEASON,
  seasonWrapper,
  testUuid,
} from '@/test/databaseRecords';
import { LeagueSetupScreen } from './LeagueSetupScreen';

vi.mock('preact-router', () => ({ route: vi.fn() }));

const RIVERSIDE = testUuid(1);
const UNION = testUuid(2);
const DRAGOES = testUuid(3);

/** A Season with two teams: Riverside FC plays in "Primeira Divisão", and
 * Union Leste rests. Both have their roster values, not the Blueprint ones. */
function testSeason(finished = false): SeasonWrapper {
  const base = seasonWrapper();
  const roster: TeamInstance[] = [
    instance({
      blueprintUuid: RIVERSIDE,
      slug: 'riverside-fc',
      name: 'Riverside FC',
      tier: 'B',
      ovr: 74,
      trigram: 'RIV',
    }),
    instance({
      blueprintUuid: UNION,
      slug: 'union-leste',
      name: 'Union Leste',
      tier: 'C',
      ovr: 63,
      trigram: 'UNI',
    }),
  ];
  const [league] = base.content.leagues;
  return {
    ...base,
    teams: roster,
    content: {
      ...base.content,
      finished,
      leagues: [
        {
          ...league,
          name: 'Primeira Divisão',
          teamUuids: [RIVERSIDE],
        },
      ],
    },
  };
}

function openSeason(season: SeasonWrapper): void {
  const row = summarizeSeason(season);
  useDatabaseStore.setState({
    seasons: { [SEASON]: season },
    savedSeasons: { [SEASON]: season },
    seasonRows: [row],
    savedSeasonRows: [row],
  });
}

const season = (): SeasonWrapper => useDatabaseStore.getState().seasons[SEASON];

beforeEach(() => {
  vi.mocked(route).mockClear();
  openTestDatabase([
    {
      slug: 'riverside-fc',
      name: 'Riverside FC',
      colour: '#2E7D32',
      tier: 'B',
      location: 'Ribeira',
    },
    {
      slug: 'union-leste',
      name: 'Union Leste',
      colour: '#6A1B9A',
      tier: 'C',
      location: 'Vila Leste',
    },
    {
      slug: 'dragoes-do-sul',
      name: 'Dragões do Sul',
      colour: '#D81B60',
      tier: 'A',
      location: 'Baía',
    },
    {
      slug: 'riverside-fc-2',
      name: 'Riverside FC',
      colour: '#1565C0',
      tier: 'B',
      location: 'Northtown',
    },
  ]);
  useLeagueDraftStore.setState(useLeagueDraftStore.getInitialState(), true);
  openSeason(testSeason());
});

async function goToTeamsStep(): Promise<void> {
  await userEvent.type(screen.getByLabelText('League name'), 'Taça Norte');
  await userEvent.click(screen.getByText('Next: Phases →'));
  await userEvent.click(screen.getByText('Next: Teams →'));
}

/** The names of the buttons in one group of the open dialog. */
function namesInGroup(dialog: HTMLElement, group: string): string[] {
  return within(within(dialog).getByRole('list', { name: group }))
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label') ?? '');
}

/** Picks the teams in the "Add teams" dialog, each from its group. */
async function addTeams(picks: [group: string, name: string][]): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
  const dialog = screen.getByRole('dialog', { name: 'Add teams' });
  for (const [group, name] of picks) {
    const list = within(dialog).getByRole('list', { name: group });
    await userEvent.click(within(list).getByRole('button', { name }));
  }
  await userEvent.click(
    within(dialog).getByRole('button', {
      name: `Add ${picks.length} team${picks.length === 1 ? '' : 's'}`,
    })
  );
}

describe('the wizard in a Season (US-13.5, Task 218)', () => {
  it('shows the breadcrumbs and the Season title', () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);

    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumbs' });
    expect(within(crumbs).getByRole('link', { name: 'Seasons' })).toHaveAttribute(
      'href',
      '/seasons'
    );
    expect(
      within(crumbs).getByRole('link', { name: 'Liga Norte 2026-27' })
    ).toHaveAttribute('href', `/seasons/${SEASON}`);
    expect(within(crumbs).getByText('New league')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'New league in Liga Norte' })
    ).toBeInTheDocument();
  });

  it('lists the Season teams first in "Add teams", with their status, and no new team button', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();

    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    const dialog = screen.getByRole('dialog', { name: 'Add teams' });

    expect(namesInGroup(dialog, 'Season teams')).toEqual([
      'Riverside FC',
      'Union Leste',
    ]);
    expect(namesInGroup(dialog, 'Other teams')).toEqual([
      'Dragões do Sul',
      'Riverside FC',
    ]);
    expect(within(dialog).getByText('In 1 league')).toBeInTheDocument();
    expect(within(dialog).getByText('Rests')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Not in the Season')).toHaveLength(2);
    expect(
      within(dialog).queryByRole('button', { name: '+ Create new team' })
    ).toBeNull();
  });

  it('shows a joining team with its create name, a free trigram, and "Joins the Season"', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();

    await addTeams([
      ['Season teams', 'Riverside FC'],
      ['Other teams', 'Riverside FC'],
    ]);

    const table = screen.getByRole('table', { name: 'Teams' });
    const [, , joining] = within(table).getAllByRole('row');
    expect(within(joining).getByText('Riverside FC (Northtown)')).toBeInTheDocument();
    expect(within(joining).getByText('Joins the Season')).toBeInTheDocument();
    expect(within(joining).queryByText('RIV')).toBeNull();
  });

  it('shows a Season team with its roster values', async () => {
    setLeagueDraft(
      {
        ...emptyLeagueDraft(),
        step: 'teams',
        teams: [instance({ blueprintUuid: UNION, name: 'Old name', trigram: '' })],
      },
      SEASON
    );
    render(<LeagueSetupScreen seasonUuid={SEASON} />);

    const table = screen.getByRole('table', { name: 'Teams' });
    expect(within(table).getByText('Union Leste')).toBeInTheDocument();
    expect(within(table).getByText('UNI')).toBeInTheDocument();
    expect(within(table).queryByText('Old name')).toBeNull();
  });

  it('edits a Season team in the "Edit Season team" drawer, and the Season changes at once', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();
    await addTeams([['Season teams', 'Riverside FC']]);

    await userEvent.click(screen.getByRole('button', { name: 'Edit Riverside FC' }));
    const drawer = screen.getByRole('dialog', { name: 'Edit Season team' });
    expect(
      within(drawer).getByText(
        'The change reaches every league of this Season: Primeira Divisão.'
      )
    ).toBeInTheDocument();
    const name = within(drawer).getByLabelText('Team name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Riverside AC');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    expect(season().teams[0].name).toBe('Riverside AC');
    expect(season().content.lastModifiedByInstallation).toBe(INSTALLATION);
  });

  it('edits a joining team in the "Edit team" drawer, with the join note', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();
    await addTeams([['Other teams', 'Dragões do Sul']]);

    await userEvent.click(screen.getByRole('button', { name: 'Edit Dragões do Sul' }));

    const drawer = screen.getByRole('dialog', { name: 'Edit team' });
    expect(
      within(drawer).getByText(
        'Dragões do Sul joins Liga Norte 2026-27 when you create the league. This OVR and Tier become its Season base.'
      )
    ).toBeInTheDocument();
  });

  it('groups the Switch dialog the same way', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();
    await addTeams([['Season teams', 'Riverside FC']]);

    await userEvent.click(screen.getByRole('button', { name: 'Switch Riverside FC' }));

    const dialog = screen.getByRole('dialog', { name: 'Switch team' });
    expect(namesInGroup(dialog, 'Season teams')).toEqual(['Union Leste']);
    expect(namesInGroup(dialog, 'Other teams')).toEqual([
      'Dragões do Sul',
      'Riverside FC',
    ]);
  });

  it('loads the Season teams only with "Load them all"', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();

    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));

    const rows = within(screen.getByRole('table', { name: 'Teams' })).getAllByRole(
      'row'
    );
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('Riverside FC')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Union Leste')).toBeInTheDocument();
  });

  it('creates the league in the Season, and goes to the Season view', async () => {
    setLeagueDraft({
      ...emptyLeagueDraft(),
      details: { ...emptyLeagueDraft().details, name: 'Keep me' },
    });
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await goToTeamsStep();
    await addTeams([
      ['Season teams', 'Union Leste'],
      ['Other teams', 'Dragões do Sul'],
    ]);
    await userEvent.click(screen.getByText('Next: Review →'));

    await userEvent.click(screen.getByText('Create league'));

    const [, cup] = season().content.leagues;
    expect(cup.name).toBe('Taça Norte');
    expect(cup.teamUuids).toEqual([UNION, DRAGOES]);
    expect(season().teams.map((team) => team.blueprintUuid)).toEqual([
      RIVERSIDE,
      UNION,
      DRAGOES,
    ]);
    expect(useDatabaseStore.getState().leagues).toEqual({});
    expect(route).toHaveBeenCalledWith(`/seasons/${SEASON}`);
    const drafts = useLeagueDraftStore.getState();
    expect(getLeagueDraft(drafts, SEASON)).toEqual(emptyLeagueDraft());
    expect(getLeagueDraft(drafts).details.name).toBe('Keep me');
  });

  it('keeps its draft apart from the standalone draft on a nav switch', async () => {
    render(<LeagueSetupScreen seasonUuid={SEASON} />);
    await userEvent.type(screen.getByLabelText('League name'), 'Taça Norte');

    cleanup();

    const drafts = useLeagueDraftStore.getState();
    expect(getLeagueDraft(drafts, SEASON).details.name).toBe('Taça Norte');
    expect(getLeagueDraft(drafts).details.name).toBe('');
  });

  it('says so for a finished Season, and shows no wizard (US-13.9)', () => {
    openSeason(testSeason(true));
    render(<LeagueSetupScreen seasonUuid={SEASON} />);

    expect(
      screen.getByText('Liga Norte 2026-27 is finished. Reopen it to add a league.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('says so for an unknown Season', () => {
    render(<LeagueSetupScreen seasonUuid={testUuid(99)} />);

    expect(screen.getByText('Season not found.')).toBeInTheDocument();
  });
});
