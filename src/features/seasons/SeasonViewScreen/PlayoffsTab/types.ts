/** One team of a playoff row, as the fixtures row shows a team. */
export interface PlayoffSide {
  name: string;
  /** The Location of the Blueprint, or `''`: the hint of the name. */
  location: string;
  trigram: string;
  colour: string;
  /** True for the team that lost a played playoff: it shows grey. */
  isLoser: boolean;
  /** The total of the legs, for the stacked row. Empty before the play. */
  goals: string;
}

/** One playoff of the Playoffs tab (Task 215 points 2 and 3). */
export interface PlayoffRow {
  uuid: string;
  name: string;
  /** "Two-legged · Away goals rule · Plays AET · Penalties · Home adv. on". */
  rules: string;
  team1: PlayoffSide;
  team2: PlayoffSide;
  /** "1 - 1" for a played playoff, or `undefined` before the play. */
  total: string | undefined;
  /** "1-0, 0-1* · Pens 4-3", or "" when the total says it all. */
  detail: string;
  /** Plays the playoff. `undefined` for a played playoff. */
  play: (() => void) | undefined;
}

export default interface PlayoffsTabProps {
  rows: readonly PlayoffRow[];
  /** A finished Season keeps "Play" off (US-13.9). */
  isFinished: boolean;
  /** True when a match of the list went to extra time: the list shows the
   * key of "*" (Task 220 choice 9). */
  hasAetKey: boolean;
}
