import type { SelectOption } from '@/design-system';
import type { LeagueWrapper } from '@/domain';

export default interface PositionChartProps {
  league: LeagueWrapper;
  /** The started phase to show, from 0. The current phase when not given. */
  phaseIndex?: number;
}

/** One point of a team line: its place after one matchday. */
export interface ChartPoint {
  matchday: number;
  place: number;
}

/** The line of one team (US-12.4). */
export interface ChartLine {
  team: string;
  name: string;
  /** The trigram, or the name when the team has none (choice 6). */
  label: string;
  isTrigram: boolean;
  colour: string;
  /** True for a light colour: the line gets a dark outline (choice 3). */
  outlined: boolean;
  points: ChartPoint[];
  lastPlace: number;
}

/** The hint of the point under the pointer (choice 4). */
export interface ChartHint {
  text: string;
  /** The left edge, in percent of the plot width. */
  x: number;
  /** The top, in rem from the top of the plot. */
  y: number;
}

/** What `usePositionChart` gives `PositionChart`. */
export interface PositionChartView {
  hasResults: boolean;
  /** The groups of a Groups phase, for the selector, or `undefined`. */
  groupOptions: SelectOption[] | undefined;
  selectGroup: (value: string) => void;
  /** The matchday count of the schedule: the x axis. */
  matchdays: number;
  placeCount: number;
  /** One line for each team, by its last place. */
  lines: ChartLine[];
  /** The team that stands out, or `undefined`. */
  highlight: string | undefined;
  setHighlight: (team: string | undefined) => void;
  hint: ChartHint | undefined;
  showHint: (line: ChartLine, point: ChartPoint) => void;
  hideHint: () => void;
}
