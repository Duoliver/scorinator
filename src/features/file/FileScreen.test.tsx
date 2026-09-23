import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { FileScreen } from './FileScreen';
import * as saveActions from '@/app/saveActions';
import * as leagueFile from '@/app/data/leagueFile';
import * as csvIO from '@/app/data/teamsCsv';
import * as jsonIO from '@/app/data/teamsJson';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [
    { slug: 'fc-united', ovr: 70 },
    { slug: 'fc-rivals', ovr: 65 },
  ],
  fixtures: [{ matchday: 1, home: 'fc-united', away: 'fc-rivals' }],
  byes: [],
  results: [],
  ...overrides,
});

const teams: TeamRecord[] = [
  { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
  { slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5', tier: 'C' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  useTeamsStore.setState({ teams: [] });
  useLeagueStore.setState({ leagues: [] });
  useFileStore.setState({ currentLeagueSlug: null, paths: {}, status: null });
});

describe('FileScreen', () => {
  it('shows the five cards from the design reference', () => {
    render(<FileScreen />);

    for (const title of [
      'Save league',
      'Load league',
      'Import teams',
      'Export teams',
      'Export results',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('describes the team CSV with the MVP1 columns, and no City', () => {
    render(<FileScreen />);
    expect(screen.getByText(/Slug, Name, Colour, Tier/)).toBeInTheDocument();
    expect(screen.queryByText(/City/)).not.toBeInTheDocument();
  });

  describe('Save league', () => {
    it('disables Save and Save as, with a hint, when there are no leagues', () => {
      render(<FileScreen />);

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save as...' })).toBeDisabled();
      expect(screen.getByText('No leagues to save yet.')).toBeInTheDocument();
    });

    it('saves the current league by default', async () => {
      const save = vi.spyOn(saveActions, 'saveLeagueBySlug').mockResolvedValue();
      useLeagueStore.setState({
        leagues: [league({ slug: 'inland-cup', name: 'Inland Cup' }), league()],
      });
      useFileStore.setState({ currentLeagueSlug: 'coastal-premier' });
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(save).toHaveBeenCalledWith('coastal-premier');
    });

    it('saves the league picked in the selector', async () => {
      const save = vi.spyOn(saveActions, 'saveLeagueBySlug').mockResolvedValue();
      useLeagueStore.setState({
        leagues: [league({ slug: 'inland-cup', name: 'Inland Cup' }), league()],
      });
      useFileStore.setState({ currentLeagueSlug: 'coastal-premier' });
      render(<FileScreen />);

      await userEvent.selectOptions(screen.getByLabelText('League'), 'inland-cup');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(save).toHaveBeenCalledWith('inland-cup');
    });

    it('falls back to the first league when there is no current one', async () => {
      const save = vi.spyOn(saveActions, 'saveLeagueBySlug').mockResolvedValue();
      useLeagueStore.setState({ leagues: [league()] });
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(save).toHaveBeenCalledWith('coastal-premier');
    });

    it('Save as asks for a new file', async () => {
      const save = vi.spyOn(saveActions, 'saveLeagueBySlug').mockResolvedValue();
      useLeagueStore.setState({ leagues: [league()] });
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Save as...' }));

      expect(save).toHaveBeenCalledWith('coastal-premier', { saveAs: true });
    });

    it('shows the status the save left in the file store', () => {
      useFileStore.setState({
        status: { tone: 'info', message: 'Saved Coastal Premier to /saves/coastal.json' },
      });
      render(<FileScreen />);

      expect(screen.getByRole('status')).toHaveTextContent(
        'Saved Coastal Premier to /saves/coastal.json'
      );
    });
  });

  describe('Load league', () => {
    it('adds a loaded league, merges its teams into the roster, and remembers the path', async () => {
      vi.spyOn(leagueFile, 'loadLeagueFile').mockResolvedValue({
        path: '/saves/coastal.json',
        league: league(),
        teams,
      });
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load...' }));

      expect(await screen.findByText('Loaded Coastal Premier from /saves/coastal.json')).toBeInTheDocument();
      expect(useLeagueStore.getState().leagues).toEqual([league()]);
      expect(useTeamsStore.getState().teams).toEqual(teams);
      expect(useFileStore.getState().paths['coastal-premier']).toBe('/saves/coastal.json');
      expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
    });

    it('changes nothing when the user cancels the open dialog', async () => {
      vi.spyOn(leagueFile, 'loadLeagueFile').mockResolvedValue(null);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load...' }));

      expect(useLeagueStore.getState().leagues).toEqual([]);
      expect(useFileStore.getState().status).toBeNull();
    });

    describe('when a league with the same slug is already open', () => {
      const played = league({
        results: [{ matchday: 1, home: 'fc-united', away: 'fc-rivals', homeGoals: 3, awayGoals: 0 }],
      });

      beforeEach(async () => {
        useLeagueStore.setState({ leagues: [league()] });
        vi.spyOn(leagueFile, 'loadLeagueFile').mockResolvedValue({
          path: '/saves/coastal.json',
          league: played,
          teams,
        });
        render(<FileScreen />);
        await userEvent.click(screen.getByRole('button', { name: 'Load...' }));
      });

      it('asks before replacing, and changes nothing yet', async () => {
        expect(await screen.findByText(/Replace "Coastal Premier"\?/)).toBeInTheDocument();
        expect(useLeagueStore.getState().leagues).toEqual([league()]);
      });

      it('replaces the open league on Replace', async () => {
        await userEvent.click(await screen.findByRole('button', { name: 'Replace' }));

        expect(useLeagueStore.getState().leagues).toEqual([played]);
        expect(useFileStore.getState().paths['coastal-premier']).toBe('/saves/coastal.json');
        expect(screen.queryByText(/Replace "Coastal Premier"\?/)).not.toBeInTheDocument();
      });

      it('keeps the open league on Cancel', async () => {
        await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        expect(useLeagueStore.getState().leagues).toEqual([league()]);
        expect(useFileStore.getState().paths).toEqual({});
        expect(screen.queryByText(/Replace "Coastal Premier"\?/)).not.toBeInTheDocument();
      });
    });

    it('shows an error and changes nothing when the file is not a valid save', async () => {
      vi.spyOn(leagueFile, 'loadLeagueFile').mockRejectedValue(
        new Error('Invalid save file: a fixture on matchday 1 names team "ghost-fc".')
      );
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load...' }));

      expect(await screen.findByText(/names team "ghost-fc"/)).toBeInTheDocument();
      expect(useLeagueStore.getState().leagues).toEqual([]);
      expect(useTeamsStore.getState().teams).toEqual([]);
    });
  });

  describe('Import and export teams', () => {
    it('imports teams from CSV and merges them into the roster', async () => {
      vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue([
        { slug: '', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import CSV...' }));

      expect(await screen.findByText('Imported 1 team.')).toBeInTheDocument();
      expect(useTeamsStore.getState().teams).toEqual([
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
      expect(useTeamsStore.getState().teams).toEqual([]);
    });

    it('imports teams from JSON and merges them into the roster', async () => {
      vi.spyOn(jsonIO, 'importTeamsJson').mockResolvedValue([
        { slug: '', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import JSON...' }));

      expect(await screen.findByText('Imported 1 team.')).toBeInTheDocument();
      expect(useTeamsStore.getState().teams).toHaveLength(1);
    });

    it('shows an error and does not change the roster when the JSON import fails', async () => {
      vi.spyOn(jsonIO, 'importTeamsJson').mockRejectedValue(
        new Error('Team JSON entry 1 has an invalid tier.')
      );
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import JSON...' }));

      expect(await screen.findByText(/invalid tier/)).toBeInTheDocument();
      expect(useTeamsStore.getState().teams).toEqual([]);
    });

    it('does not change the roster when the import dialog is canceled', async () => {
      vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue(null);
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import CSV...' }));

      expect(useTeamsStore.getState().teams).toEqual([]);
      expect(useFileStore.getState().status).toBeNull();
    });

    it('exports the current roster to CSV', async () => {
      const exportSpy = vi.spyOn(csvIO, 'exportTeamsCsv').mockResolvedValue('/teams.csv');
      useTeamsStore.setState({
        teams: [{ slug: 'ashfield-town', name: 'Ashfield Town', colour: '', tier: 'C' }],
      });
      render(<FileScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Export CSV...' }));

      expect(exportSpy).toHaveBeenCalledWith([
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
    it('is not available yet: a disabled button and a Coming soon note', () => {
      render(<FileScreen />);

      expect(screen.getByRole('button', { name: 'Export results...' })).toBeDisabled();
      expect(screen.getByText('Coming soon.')).toBeInTheDocument();
    });
  });
});
