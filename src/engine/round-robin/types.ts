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

/** How the user sets a Groups phase (US-02.1): by the group size, a
 * maximum, or by the group count. */
export type GroupSetting =
  { by: 'size'; size: number } | { by: 'count'; count: number };

/** The `by` of a `GroupSetting` (Task 184). */
export const GroupBy = { SIZE: 'size', COUNT: 'count' } as const;
export type GroupBy = (typeof GroupBy)[keyof typeof GroupBy];
