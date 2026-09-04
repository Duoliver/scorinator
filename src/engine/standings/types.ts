export interface PointsConfig {
  win: number;
  draw: number;
  loss: number;
}

export interface MatchResult<TeamId> {
  home: TeamId;
  away: TeamId;
  homeGoals: number;
  awayGoals: number;
}

export interface StandingsRow<TeamId> {
  team: TeamId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
