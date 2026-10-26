export interface Fixture<TeamId> {
  matchday: number;
  home: TeamId;
  away: TeamId;
}

/** The fields that identify one round-robin match. A result carries them
 * too, so a result finds its fixture by them. */
export type MatchIdentity<TeamId> = Pick<Fixture<TeamId>, 'matchday' | 'home' | 'away'>;

export interface Bye<TeamId> {
  matchday: number;
  team: TeamId;
}

export interface RoundRobinSchedule<TeamId> {
  fixtures: Fixture<TeamId>[];
  byes: Bye<TeamId>[];
}
