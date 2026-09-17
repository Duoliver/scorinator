import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { route } from 'preact-router';
import { AppShell } from './AppShell';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';

beforeEach(() => {
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
});
