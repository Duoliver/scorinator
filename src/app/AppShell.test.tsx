import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';

beforeEach(() => {
  useTeamsStore.setState({ teams: [] });
  useLeagueStore.setState({ leagues: [] });
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

  it('routes to League Setup when Leagues is clicked, and back to Teams', async () => {
    render(<AppShell />);

    await userEvent.click(screen.getByRole('link', { name: 'Leagues' }));

    expect(screen.getByRole('heading', { name: 'League Setup' })).toBeInTheDocument();
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
});
