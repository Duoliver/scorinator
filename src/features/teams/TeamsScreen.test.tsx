import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamsScreen } from './TeamsScreen';
import * as teamsFile from '@/app/data/teamsFile';
import { useFileStore } from '@/app/state/fileStore';
import { openTestDatabase } from '@/test/databaseRecords';
import { useDatabaseStore } from '@/app/state/databaseStore';

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([]);
  useFileStore.setState({ status: null });
});

describe('TeamsScreen', () => {
  it('renders an empty roster with a team count of 0', () => {
    render(<TeamsScreen />);
    expect(screen.getByText('0 teams')).toBeInTheDocument();
  });

  it('creates a team through the New team drawer and lists it', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Salt Marsh United');
    await userEvent.click(screen.getByText('Create team'));

    expect(screen.getByText('Salt Marsh United')).toBeInTheDocument();
    expect(screen.getByText('salt-marsh-united')).toBeInTheDocument();
    expect(screen.getByText('1 team')).toBeInTheDocument();
  });

  it('closes the drawer without saving on Cancel', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Redbrick Athletic')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Team name')).not.toBeInTheDocument();
  });

  it('edits an existing team in place', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Northgate FC');
    await userEvent.click(screen.getByText('Create team'));

    await userEvent.click(screen.getByText('Edit'));
    const nameField = screen.getByLabelText('Team name');
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Northgate United');
    await userEvent.click(screen.getByText('Save changes'));

    expect(screen.getByText('1 team')).toBeInTheDocument();
    expect(screen.getByText('Northgate United')).toBeInTheDocument();
    expect(screen.queryByText('Northgate FC')).not.toBeInTheDocument();
  });

  it('has no import or export buttons — those live on the File screen', () => {
    render(<TeamsScreen />);

    expect(screen.queryByText('Import CSV...')).not.toBeInTheDocument();
    expect(screen.queryByText('Import JSON...')).not.toBeInTheDocument();
    expect(screen.queryByText('Export CSV...')).not.toBeInTheDocument();
    expect(screen.getByText('+ New team')).toBeInTheDocument();
  });

  it('opens the right team when a row other than the first is edited', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Team One');
    await userEvent.click(screen.getByText('Create team'));
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Team Two');
    await userEvent.click(screen.getByText('Create team'));

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(2);
    await userEvent.click(editButtons[1]);
    expect(screen.getByLabelText('Team name')).toHaveValue('Team Two');
  });
  describe('the Location and Trigrams columns (Task 119)', () => {
    beforeEach(() => {
      openTestDatabase([
        {
          slug: 'ashfield-rovers',
          name: 'Ashfield Rovers',
          colour: '#E53935',
          tier: 'B',
          location: 'Ashfield',
          trigrams: ['ASH', 'AFC'],
        },
        { slug: 'harborview-sc', name: 'Harborview SC', colour: '#1565C0', tier: 'C' },
      ]);
    });

    it('shows the columns in order: Name, Location, Trigrams, Tier, Slug', () => {
      render(<TeamsScreen />);
      const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
      expect(headers.filter((text) => text !== '')).toEqual([
        'Name',
        'Location',
        'Trigrams',
        'Tier',
        'Slug',
      ]);
    });

    it('shows the location, or "—" for an empty one', () => {
      render(<TeamsScreen />);
      const [ashfield, harborview] = screen.getAllByRole('row').slice(1);
      expect(ashfield).toHaveTextContent('Ashfield');
      expect(harborview).toHaveTextContent('—');
    });

    it('shows the trigrams split by a dot, or the name trigram for an empty list', () => {
      render(<TeamsScreen />);
      expect(screen.getByText('ASH · AFC')).toBeInTheDocument();
      expect(screen.getByText('HAR')).toBeInTheDocument();
    });
  });

  describe('the drawer fields (Task 119)', () => {
    it('creates a team with a location and trigrams', async () => {
      render(<TeamsScreen />);
      await userEvent.click(screen.getByText('+ New team'));
      await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield Rovers');
      await userEvent.type(screen.getByLabelText('Location (optional)'), 'Ashfield');
      await userEvent.type(screen.getByLabelText('Trigrams (optional)'), 'ash afc');
      await userEvent.click(screen.getByText('Create team'));

      expect(useDatabaseStore.getState().blueprints[0]).toMatchObject({
        location: 'Ashfield',
        trigrams: ['ASH', 'AFC'],
      });
      expect(screen.getByText('ASH · AFC')).toBeInTheDocument();
    });

    it('edits the location and the trigrams of a team', async () => {
      openTestDatabase([
        {
          slug: 'ashfield-rovers',
          name: 'Ashfield Rovers',
          colour: '#E53935',
          tier: 'B',
          location: 'Ashfield',
          trigrams: ['ASH'],
        },
      ]);
      render(<TeamsScreen />);
      await userEvent.click(screen.getByText('Edit'));
      await userEvent.clear(screen.getByLabelText('Location (optional)'));
      await userEvent.clear(screen.getByLabelText('Trigrams (optional)'));
      await userEvent.type(screen.getByLabelText('Trigrams (optional)'), 'ARO');
      await userEvent.click(screen.getByText('Save changes'));

      expect(useDatabaseStore.getState().blueprints[0]).toMatchObject({
        location: '',
        trigrams: ['ARO'],
      });
    });

    it('previews a slug with the -2 rule for a second team with the same name', async () => {
      openTestDatabase([
        {
          slug: 'salt-marsh-united',
          name: 'Salt Marsh United',
          colour: '#fff',
          tier: 'C',
        },
      ]);
      render(<TeamsScreen />);
      await userEvent.click(screen.getByText('+ New team'));
      await userEvent.type(screen.getByLabelText('Team name'), 'Salt Marsh United');
      expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue(
        'salt-marsh-united-2'
      );
    });
  });

  describe('Import teams', () => {
    it('shows an Import teams button', () => {
      render(<TeamsScreen />);
      expect(
        screen.getByRole('button', { name: 'Import teams...' })
      ).toBeInTheDocument();
    });

    it('imports teams from one CSV-or-JSON dialog and lists them', async () => {
      const importer = vi.spyOn(teamsFile, 'importTeamsFile').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
        { slug: 'harborview-sc', name: 'Harborview SC', colour: '#1E88E5', tier: 'A' },
      ]);
      render(<TeamsScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import teams...' }));

      expect(importer).toHaveBeenCalledTimes(1);
      expect(await screen.findByText('FC United')).toBeInTheDocument();
      expect(screen.getByText('Harborview SC')).toBeInTheDocument();
      expect(screen.getByText('2 teams')).toBeInTheDocument();
      expect(useFileStore.getState().status).toEqual({
        tone: 'info',
        message: 'Imported 2 teams: 2 new, 0 updated.',
      });
    });

    it('changes nothing when the dialog is canceled', async () => {
      vi.spyOn(teamsFile, 'importTeamsFile').mockResolvedValue(null);
      render(<TeamsScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import teams...' }));

      expect(screen.getByText('0 teams')).toBeInTheDocument();
      expect(useFileStore.getState().status).toBeNull();
    });

    it('reports an import error in the status line', async () => {
      vi.spyOn(teamsFile, 'importTeamsFile').mockRejectedValue(
        new Error('Row 2: Tier is required.')
      );
      render(<TeamsScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Import teams...' }));

      expect(useFileStore.getState().status).toEqual({
        tone: 'error',
        message: 'Row 2: Tier is required.',
      });
      expect(screen.getByText('0 teams')).toBeInTheDocument();
    });
  });
});
