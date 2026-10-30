import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system';
import type { TeamFields } from '@/domain';
import type { Tier } from '@/engine/tier-ovr';

export default interface TeamFormProps {
  saveLabel: string;
  initial?: TeamFields;
  /** The slugs of the other Blueprints, for the `-2` rule of a new team's
   * slug preview (Task 75). An edit keeps its slug, so it needs none. */
  takenSlugs?: readonly string[];
  onCancel: () => void;
  onSave: (record: TeamFields) => void;
}

/** The value each field starts with: the team's own value when editing,
 * or else the default for a new team. */
export interface TeamFormStartValues {
  name: string | undefined;
  slug: string | undefined;
  colour: string;
  tier: Tier;
  location: string;
  trigrams: string;
}

/** The errors at "Save", one for each field that has one. */
export interface TeamFormErrors {
  name: string | null;
  location: string | null;
  trigrams: string | null;
}

/** What `useTeamForm` gives `TeamForm`. */
export interface TeamFormState {
  nameRef: RefObject<FieldHandle<string>>;
  slugRef: RefObject<FieldHandle<string>>;
  colourRef: RefObject<FieldHandle<string>>;
  tierRef: RefObject<FieldHandle<string>>;
  locationRef: RefObject<FieldHandle<string>>;
  trigramsRef: RefObject<FieldHandle<string>>;
  startValues: TeamFormStartValues;
  errors: TeamFormErrors;
  trigramsPlaceholder: string;
  handleNameChange: (name: string) => void;
  handleSave: () => void;
}
