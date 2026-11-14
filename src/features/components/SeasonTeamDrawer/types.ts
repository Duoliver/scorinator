import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system';
import type { TeamInstance } from '@/domain';
import type { SeasonTeamChanges } from '@/app/state/seasonActions';
import type { Rng } from '@/engine/rng';

/** The edit drawer of one Season team (US-13.4, Task 213 choice 6). */
export default interface SeasonTeamDrawerProps {
  team: TeamInstance;
  leagueNames: readonly string[];
  otherNames: readonly string[];
  otherTrigrams: readonly string[];
  rng?: Rng;
  onSave: (changes: Required<SeasonTeamChanges>) => void;
  onCancel: () => void;
}

/** The field problems of the drawer, one for each field, or `null`. */
export interface SeasonTeamErrors {
  name: string | null;
  ovr: string | null;
  trigram: string | null;
}

/** What `useSeasonTeamDrawer` gives the drawer. */
export interface SeasonTeamDrawerState {
  nameRef: RefObject<FieldHandle<string>>;
  colourRef: RefObject<FieldHandle<string>>;
  tierRef: RefObject<FieldHandle<string>>;
  ovrRef: RefObject<FieldHandle<string>>;
  trigramRef: RefObject<FieldHandle<string>>;
  ovrLabel: string;
  note: string;
  errors: SeasonTeamErrors;
  handleTierChange: (value: string) => void;
  handleSave: () => void;
}
