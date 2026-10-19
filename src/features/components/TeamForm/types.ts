import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system/field';
import type { TeamRecord } from '@/domain';
import type { Tier } from '@/engine/tier-ovr';

export default interface TeamFormProps {
  saveLabel: string;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}

/** The value each field starts with: the team's own value when editing,
 * or else the default for a new team. */
export interface TeamFormStartValues {
  name: string | undefined;
  slug: string | undefined;
  colour: string;
  tier: Tier;
}

/** What `useTeamForm` gives `TeamForm`. */
export interface TeamFormState {
  nameRef: RefObject<FieldHandle<string>>;
  slugRef: RefObject<FieldHandle<string>>;
  colourRef: RefObject<FieldHandle<string>>;
  tierRef: RefObject<FieldHandle<string>>;
  startValues: TeamFormStartValues;
  error: string | null;
  handleNameChange: (name: string) => void;
  handleSave: () => void;
}
