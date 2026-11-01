import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { FileScreen } from './FileScreen';
import * as csvIO from '@/app/data/teamsCsv';
import * as jsonIO from '@/app/data/teamsJson';
import * as resultsTxtIO from '@/app/data/resultsTxt';
import { serializeLeagueWrapper } from '@/app/data/databaseFile';
import { useFileStore } from '@/app/state/fileStore';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { LeagueWrapper } from '@/domain';
import {
  LEAGUE,
  OTHER_LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  teamFields,
} from '@/test/databaseRecords';
import { useDatabaseStore } from '@/app/state/databaseStore';

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
];

const coastal = (): LeagueWrapper => roundRobinLeague(TEAMS);
const inland = (): LeagueWrapper =>
  roundRobinLeague(TEAMS, { uuid: OTHER_LEAGUE, name: 'Inland Cup' });

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([]);
  useFileStore.setState({ status: null });
});

describe('FileScreen', () => {
  it('shows the team cards and Export results, and no league save or load (Task 161)', () => {
    render(<FileScreen />);

    for (const title of ['Import teams', 'Export teams', 'Export results']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    for (const title of ['Save league', 'Load league']) {
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
    }
  });

  it('describes the team CSV with the MVP1 columns, and no City', () => {
    render(<FileScreen />);
    expect(screen.getByText(/Slug, Name, Colour, Tier/)).toBeInTheDocument();
    expect(screen.queryByText(/City/)).not.toBeInTheDocument();
  });

  describe('Import and export teams', () => {
    it('imports teams from CSV into the Blueprints', async () => {
      vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import CSV...' }));
      const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
      expect(dialog).toHaveAccessibleDescription('1 new, 0 updated. Continue?');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

      expect(
        await screen.findByText('Imported 1 team: 1 new, 0 updated.')
      ).toBeInTheDocument();
      expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
    });

    it('shows an error and does not change the roster when the CSV import fails', async () => {
      vi.spyOn(csvIO, 'importTeamsCsv').mockRejectedValue(
        new Error('Team CSV is missing required column "Tier".')
      );
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import CSV...' }));

      expect(await screen.findByText(/missing required column/)).toBeInTheDocument();
      expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([]);
    });

    it('imports teams from JSON into the Blueprints', async () => {
      vi.spyOn(jsonIO, 'importTeamsJson').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import JSON...' }));
      const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
      expect(dialog).toHaveAccessibleDescription('1 new, 0 updated. Continue?');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

      expect(
        await screen.findByText('Imported 1 team: 1 new, 0 updated.')
      ).toBeInTheDocument();
      expect(useDatabaseStore.getState().blueprints).toHaveLength(1);
    });

    it('shows an error and does not change the roster when the JSON import fails', async () => {
      vi.spyOn(jsonIO, 'importTeamsJson').mockRejectedValue(
        new Error('Team JSON entry 1 has an invalid tier.')
      );
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import JSON...' }));

      expect(await screen.findByText(/invalid tier/)).toBeInTheDocument();
      expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([]);
    });

    it('changes nothing on Cancel in the import confirm', async () => {
      vi.spyOn(jsonIO, 'importTeamsJson').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import JSON...' }));
      const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(
        screen.queryByRole('dialog', { name: 'Import teams?' })
      ).not.toBeInTheDocument();
      expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([]);
      expect(useFileStore.getState().status).toBeNull();
    });

    it('does not change the roster when the import dialog is canceled', async () => {
      vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue(null);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import CSV...' }));

      expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([]);
      expect(useFileStore.getState().status).toBeNull();
    });

    it('exports the Blueprints to CSV', async () => {
      const exportSpy = vi
        .spyOn(csvIO, 'exportTeamsCsv')
        .mockResolvedValue('/teams.csv');
      openTestDatabase([
        { slug: 'ashfield-town', name: 'Ashfield Town', colour: '', tier: 'C' },
      ]);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export CSV...' }));

      expect(teamFields(exportSpy.mock.calls[0][0])).toEqual([
        { slug: 'ashfield-town', name: 'Ashfield Town', colour: '', tier: 'C' },
      ]);
      expect(await screen.findByText('Saved to /teams.csv')).toBeInTheDocument();
    });

    it('says so when the export dialog is canceled', async () => {
      vi.spyOn(csvIO, 'exportTeamsCsv').mockResolvedValue(null);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export CSV...' }));

      expect(await screen.findByText('Export canceled.')).toBeInTheDocument();
    });
  });

  describe('Export results', () => {
    it('disables the button, with a hint, when there are no leagues', () => {
      render(<FileScreen />);

      expect(screen.getByRole('button', { name: 'Export TXT...' })).toBeDisabled();
      expect(screen.getByText('No leagues to export yet.')).toBeInTheDocument();
    });

    it('exports the first league by default', async () => {
      const exportSpy = vi
        .spyOn(resultsTxtIO, 'exportResultsTxt')
        .mockResolvedValue('/r.txt');
      const first = openTestLeague(coastal());
      openTestLeague(inland());
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export TXT...' }));

      expect(
        await screen.findByText('Exported Coastal Premier results to /r.txt')
      ).toBeInTheDocument();
      expect(exportSpy.mock.calls[0][0]).toBe(first);
    });

    it('exports the league picked in the selector', async () => {
      const exportSpy = vi
        .spyOn(resultsTxtIO, 'exportResultsTxt')
        .mockResolvedValue('/r.txt');
      openTestLeague(coastal());
      const other = openTestLeague(inland());
      render(<FileScreen />);

      await userEvent.selectOptions(
        screen.getByLabelText('League to export'),
        OTHER_LEAGUE
      );
      await userEvent.click(screen.getByRole('button', { name: 'Export TXT...' }));

      expect(
        await screen.findByText('Exported Inland Cup results to /r.txt')
      ).toBeInTheDocument();
      expect(exportSpy.mock.calls[0][0]).toBe(other);
    });

    it('reads a league that is not open yet from the database before the export', async () => {
      const exportSpy = vi
        .spyOn(resultsTxtIO, 'exportResultsTxt')
        .mockResolvedValue('/r.txt');
      const memory = openTestDatabase([]);
      const wrapper = coastal();
      memory.files.wrappers[LEAGUE] = serializeLeagueWrapper(wrapper);
      const row = summarizeLeague(wrapper);
      useDatabaseStore.setState({ rows: [row], savedRows: [row] });
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export TXT...' }));

      await screen.findByText('Exported Coastal Premier results to /r.txt');
      expect(exportSpy.mock.calls[0][0]).toEqual(wrapper);
      expect(useDatabaseStore.getState().leagues[LEAGUE]).toEqual(wrapper);
    });

    it('says so when the dialog is canceled', async () => {
      vi.spyOn(resultsTxtIO, 'exportResultsTxt').mockResolvedValue(null);
      openTestLeague(coastal());
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export TXT...' }));

      expect(await screen.findByText('Export canceled.')).toBeInTheDocument();
    });

    it('shows the error when the export fails', async () => {
      vi.spyOn(resultsTxtIO, 'exportResultsTxt').mockRejectedValue(
        new Error('Disk is full.')
      );
      openTestLeague(coastal());
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export TXT...' }));

      expect(await screen.findByText('Disk is full.')).toBeInTheDocument();
      expect(useFileStore.getState().status?.tone).toBe('error');
    });
  });
});
