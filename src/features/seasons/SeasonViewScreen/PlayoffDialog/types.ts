import type { SinglePickerProps } from '@/design-system';
import type { TeamInstance } from '@/domain';
import type { PlayoffInput } from '@/app/state/seasonPlayoffActions';
import type { TieFormat, TiebreakMethod } from '@/engine/tiebreak';
import type { ConditionLevel } from '@/engine/tier-ovr';

export default interface PlayoffDialogProps {
  /** The Season roster: a playoff team is a Season team (US-13.7). */
  teams: readonly TeamInstance[];
  /** True when another playoff of the Season has the name. */
  isTaken: (name: string) => boolean;
  onCreate: (input: PlayoffInput) => void;
  onCancel: () => void;
}

/** A team slot of the dialog: "Team 1" or "Team 2". */
export type PlayoffSlot = 1 | 2;

/** What `usePlayoffDialog` gives the dialog. */
export interface PlayoffDialogState {
  setName: (name: string) => void;
  nameError: string | null;
  /** The team in each slot, or `undefined`. */
  team1: TeamInstance | undefined;
  team2: TeamInstance | undefined;
  openPicker: (slot: PlayoffSlot) => void;
  /** Sets the condition level of a slot (US-14.3). The level stays with
   * the slot when the user picks another team (Task 229 choice 5). */
  setLevel: (slot: PlayoffSlot, level: ConditionLevel) => void;
  /** The single team picker of one slot while it is open (Task 215 point
   * 4c), or `null`. */
  picker: SinglePickerProps | null;
  format: TieFormat;
  setFormat: (format: TieFormat) => void;
  awayGoals: boolean;
  setAwayGoals: (on: boolean) => void;
  playsAet: boolean;
  setPlaysAet: (on: boolean) => void;
  method: TiebreakMethod;
  setMethod: (method: TiebreakMethod) => void;
  homeAdvantage: boolean;
  setHomeAdvantage: (on: boolean) => void;
  canCreate: boolean;
  handleCreate: (event: Event) => void;
}
