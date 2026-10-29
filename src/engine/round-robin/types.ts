export interface Fixture<TeamId> {
  matchday: number;
  home: TeamId;
  away: TeamId;
}

/** The fields that identify one round-robin match. A result carries them
 * too, so a result finds its fixture by them.
 *
 * @deprecated MVP1 triple. A v2 result names its fixture by `fixtureId`
 * (`PhaseFixture`). Task 109 removes it.
 */
export type MatchIdentity<TeamId> = Pick<Fixture<TeamId>, 'matchday' | 'home' | 'away'>;

export interface Bye<TeamId> {
  matchday: number;
  team: TeamId;
}

export interface RoundRobinSchedule<TeamId> {
  fixtures: Fixture<TeamId>[];
  byes: Bye<TeamId>[];
}

/** A round-robin fixture with its stable id (Task 77). A result names its
 * fixture by this id, so the id must never change after the phase starts.
 * `assignFixtureIds` gives the ids. */
export interface PhaseFixture<TeamId> extends Fixture<TeamId> {
  id: string;
}

/** The place of one fixture in a league, for `fixtureId`. Each number counts
 * from 1. A phase with no groups uses group 1. */
export interface FixturePosition {
  phase: number;
  group: number;
  matchday: number;
  match: number;
}
