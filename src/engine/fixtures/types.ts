export interface Fixture<TeamId> {
  matchday: number;
  home: TeamId;
  away: TeamId;
}

export interface Bye<TeamId> {
  matchday: number;
  team: TeamId;
}

export interface RoundRobinSchedule<TeamId> {
  fixtures: Fixture<TeamId>[];
  byes: Bye<TeamId>[];
}
