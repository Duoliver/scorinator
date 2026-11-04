import type { ConfirmDialogProps } from '@/design-system';
import type { LeagueWrapper } from '@/domain';

export default interface SeedListProps {
  league: LeagueWrapper;
  /** The bracket phase, from 0. */
  phaseIndex: number;
}

/** One row of the Seed List (US-04.2, US-04.10). `tag` is "" for a
 * first-phase bracket. */
export interface SeedRow {
  key: string;
  seed: number;
  name: string;
  colour: string;
  tag: string;
  hasBye: boolean;
  starDisabled: boolean;
}

/** What `useSeedList` gives `SeedList`. */
export interface SeedListState {
  rows: SeedRow[];
  /** False for a first-phase bracket: no tag column (choice 3). */
  hasTags: boolean;
  text: string;
  /** "1 / 2 byes assigned", or `undefined` with no byes. */
  count?: string;
  toggleBye: (teamId: string) => void;
  /** The bye change confirm, while it is open (choice 5). */
  confirm: ConfirmDialogProps | null;
}
