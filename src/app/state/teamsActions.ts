import type { TeamRecord } from '@/features/components';
import { useTeamsStore } from './teamsStore';

export function addTeam(team: TeamRecord): void {
  useTeamsStore.setState((state) => ({ teams: [...state.teams, team] }));
}

export function updateTeam(index: number, team: TeamRecord): void {
  useTeamsStore.setState((state) => {
    const next = [...state.teams];
    next[index] = team;
    return { teams: next };
  });
}

export function setTeams(teams: TeamRecord[]): void {
  useTeamsStore.setState({ teams });
}
