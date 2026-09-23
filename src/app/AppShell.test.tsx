import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { route } from 'preact-router';
import { AppShell } from './AppShell';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { useFileStore } from '@/app/state/fileStore';
import * as saveActions from '@/app/saveActions';
import * as leagueFile from '@/app/data/leagueFile';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';

beforeEach(() => {
  vi.restoreAllMocks();
  useFileStore.setState({ currentLeagueSlug: null, paths: {}, status: null });
  useTeamsStore.setState({ teams: [] });
  useLeagueStore.setState({ leagues: [] });
  useLeagueDraftStore.setState({
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    selectedSlugs: [],
    step: 'details',
  });
});

describe('AppShell', () => {
  it('lands on Teams by default, with Teams marked as the active nav item', () => {
    render(<AppShell />);

    expect(screen.getByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Teams' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Leagues' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('routes to the Leagues Dashboard when Leagues is clicked, and back to Teams', async () => {
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'Leagues' }));

    expect(screen.getByRole('heading', { name: 'Leagues' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leagues' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await userEvent.click(screen.getByRole('link', { name: 'Teams' }));

    expect(screen.getByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Teams' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('reaches League Setup through + New League on the Dashboard, with Leagues still marked active', async () => {
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'Leagues' }));
    await userEvent.click(screen.getByRole('link', { name: '+ New League' }));

    expect(screen.getByRole('heading', { name: 'League Setup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leagues' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it("reaches League Detail through a card's Open standings link", async () => {
    useLeagueStore.setState({
      leagues: [
        {
          slug: 'coastal-premier',
          name: 'Coastal Premier',
          homeAdvantage: true,
          points: DEFAULT_POINTS_CONFIG,
          teams: [],
          fixtures: [],
          byes: [],
          results: [],
        },
      ],
    });
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'Leagues' }));
    await userEvent.click(screen.getByRole('link', { name: 'Open standings' }));

    expect(screen.getByRole('heading', { name: 'Coastal Premier' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leagues' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('keeps an in-progress League Setup draft when the user switches away and back', async () => {
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'Leagues' }));
    await userEvent.click(screen.getByRole('link', { name: '+ New League' }));
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');

    await userEvent.click(screen.getByRole('link', { name: 'Teams' }));
    await userEvent.click(screen.getByRole('link', { name: 'Leagues' }));
    await userEvent.click(screen.getByRole('link', { name: '+ New League' }));

    expect(screen.getByLabelText('League name')).toHaveValue('Coastal Premier');
  });

  it('routes to the Playground when Playground is clicked (dev-only nav item)', async () => {
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'Playground' }));

    expect(
      screen.getByRole('heading', { name: 'Design system + engine playground' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Playground' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('routes to League Detail for a league slug, with Leagues marked active', async () => {
    useLeagueStore.setState({
      leagues: [
        {
          slug: 'coastal-premier',
          name: 'Coastal Premier',
          homeAdvantage: true,
          points: DEFAULT_POINTS_CONFIG,
          teams: [],
          fixtures: [],
          byes: [],
          results: [],
        },
      ],
    });
    render(<AppShell />);

    route('/leagues/coastal-premier');

    expect(
      await screen.findByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leagues' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('routes to the File screen when File is clicked, with File marked active', async () => {
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'File' }));

    expect(screen.getByRole('heading', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'File' })).toHaveAttribute('aria-current', 'page');
  });

  describe('Ctrl+S', () => {
    const pressCtrlS = (init: KeyboardEventInit = {}): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
        ...init,
      });
      act(() => {
        window.dispatchEvent(event);
      });
      return event;
    };

    it('saves the current league, from any screen, and blocks the browser default', () => {
      const save = vi.spyOn(saveActions, 'saveCurrentLeague').mockResolvedValue();
      render(<AppShell />);

      const event = pressCtrlS();

      expect(save).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(true);
    });

    it('also works with the Meta key, for macOS', () => {
      const save = vi.spyOn(saveActions, 'saveCurrentLeague').mockResolvedValue();
      render(<AppShell />);

      pressCtrlS({ ctrlKey: false, metaKey: true });

      expect(save).toHaveBeenCalledOnce();
    });

    it('ignores other keys, and Ctrl+Shift+S', () => {
      const save = vi.spyOn(saveActions, 'saveCurrentLeague').mockResolvedValue();
      render(<AppShell />);

      pressCtrlS({ key: 'a' });
      pressCtrlS({ shiftKey: true });
      pressCtrlS({ ctrlKey: false });

      expect(save).not.toHaveBeenCalled();
    });

    it('ignores a held key, but still blocks the browser default', () => {
      const save = vi.spyOn(saveActions, 'saveCurrentLeague').mockResolvedValue();
      render(<AppShell />);

      const event = pressCtrlS({ repeat: true });

      expect(save).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it('tells the user to open or create a league when there is none', async () => {
      render(<AppShell />);

      pressCtrlS();

      expect(
        await screen.findByText('No league to save. Open or create a league first.')
      ).toBeInTheDocument();
    });

    it('saves the current league to its file and reports the path', async () => {
      useLeagueStore.setState({
        leagues: [
          {
            slug: 'coastal-premier',
            name: 'Coastal Premier',
            homeAdvantage: false,
            points: DEFAULT_POINTS_CONFIG,
            teams: [],
            fixtures: [],
            byes: [],
            results: [],
          },
        ],
      });
      useFileStore.setState({ currentLeagueSlug: 'coastal-premier' });
      vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue('/saves/coastal.json');
      render(<AppShell />);

      pressCtrlS();

      expect(
        await screen.findByText('Saved Coastal Premier to /saves/coastal.json')
      ).toBeInTheDocument();
    });
  });

  describe('status line', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows the latest save or load result in the sidebar', () => {
      render(<AppShell />);

      act(() => useFileStore.getState().setStatus({ tone: 'info', message: 'Saved it.' }));

      expect(screen.getByRole('status')).toHaveTextContent('Saved it.');
    });

    it('clears itself after a few seconds', () => {
      vi.useFakeTimers();
      render(<AppShell />);

      act(() => useFileStore.getState().setStatus({ tone: 'info', message: 'Saved it.' }));
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(useFileStore.getState().status).toBeNull();
    });

    it('shows once on the File screen, not in the sidebar too', async () => {
      render(<AppShell />);
      await userEvent.click(screen.getByRole('link', { name: 'File' }));

      act(() => useFileStore.getState().setStatus({ tone: 'info', message: 'Saved it.' }));

      expect(screen.getAllByRole('status')).toHaveLength(1);
    });
  });
});
