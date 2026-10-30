import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import type { Rng } from '@/engine/rng';
import type { Tier } from '@/engine/tier-ovr';

/** What a Save of the Edit drawer changes (US-08.4). `fixedTrigram` is
 * `null` for an empty field: the team takes the live pick (US-09.6). */
export interface TeamInstanceEdit {
  name: string;
  colour: string;
  tier: Tier;
  ovr: number;
  fixedTrigram: string | null;
}

export default interface EditTeamDrawerProps {
  team: TeamInstance;
  /** The Blueprint of the team, or `undefined` when it was deleted. */
  blueprint: TeamBlueprint | undefined;
  fixedTrigram: string | undefined;
  /** The trigram the team gets now, as the placeholder of an empty field. */
  pickedTrigram: string;
  /** The names of the other teams of the list. */
  otherNames: readonly string[];
  /** The trigrams that the other teams of the list have fixed. */
  otherFixedTrigrams: readonly string[];
  /** The source of a new OVR roll. A fresh one when not given. */
  rng?: Rng;
  onSave: (changes: TeamInstanceEdit) => void;
  onCancel: () => void;
}

/** The errors at "Save", one for each field that has one. */
export interface EditTeamErrors {
  name: string | null;
  ovr: string | null;
  trigram: string | null;
}

/** What `useEditTeam` gives `EditTeamDrawer`. */
export interface EditTeamState {
  nameRef: RefObject<FieldHandle<string>>;
  colourRef: RefObject<FieldHandle<string>>;
  tierRef: RefObject<FieldHandle<string>>;
  ovrRef: RefObject<FieldHandle<string>>;
  trigramRef: RefObject<FieldHandle<string>>;
  /** The OVR field label, with the range of the Tier now in the field. */
  ovrLabel: string;
  errors: EditTeamErrors;
  canReset: boolean;
  handleTierChange: (tier: string) => void;
  handleReset: () => void;
  handleSave: () => void;
}
