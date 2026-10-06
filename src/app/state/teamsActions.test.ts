import { beforeEach, describe, expect, it } from 'vitest';
import { addTeam, setTeams, updateTeam } from './teamsActions';
import { useTeamsStore } from './teamsStore';
import type { TeamRecord } from '@/features/components';

const team = (overrides: Partial<TeamRecord> = {}): TeamRecord => ({
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  ...overrides,
});

beforeEach(() => {
  useTeamsStore.setState({ teams: [] });
});

describe('useTeamsStore', () => {
  it('starts with an empty roster', () => {
    expect(useTeamsStore.getState().teams).toEqual([]);
  });

  it('addTeam appends to the roster', () => {
    addTeam(team());
    expect(useTeamsStore.getState().teams).toEqual([team()]);
  });

  it('updateTeam replaces the team at the given index', () => {
    addTeam(team({ slug: 'team-one', name: 'Team One' }));
    addTeam(team({ slug: 'team-two', name: 'Team Two' }));
    updateTeam(1, team({ slug: 'team-two', name: 'Team 2' }));

    expect(useTeamsStore.getState().teams.map((t) => t.name)).toEqual([
      'Team One',
      'Team 2',
    ]);
  });

  it('setTeams replaces the whole roster', () => {
    addTeam(team());
    setTeams([team({ slug: 'other', name: 'Other FC' })]);

    expect(useTeamsStore.getState().teams).toEqual([
      team({ slug: 'other', name: 'Other FC' }),
    ]);
  });
});
