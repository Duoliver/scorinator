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
  /** The row's place in the table, 1 upward. Always unique: roster order
   * breaks every remaining tie, so no two rows ever share a `sortOrder`. */
  sortOrder: number;
  /** The standings rank a user reads off the table. Teams level on every
   * footballing criterion (points, goal difference, goals for, head to
   * head) share one `position`, the way a real league table shows joint
   * places. */
  position: number;
  /** `position` as a string on the first row of a tied group, `'-'` on
   * the rest, so a rendered table does not repeat the same number down a
   * tied block. */
  positionText: string;
}
