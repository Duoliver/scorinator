import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system';
import type { TeamFields } from '@/domain';
import type { Tier } from '@/engine/tier-ovr';

export default interface TeamFormProps {
  saveLabel: string;
  initial?: TeamFields;
  /** The slugs of the Blueprints, for the `-2` rule of a new team's slug
   * preview and of the regenerate (Task 75). The edited team's own slug
   * does not count. */
  takenSlugs?: readonly string[];
  onCancel: () => void;
  onSave: (record: TeamFields) => void;
  /** Shows "Delete team" when given (US-09.4). The caller asks first. */
  onDelete?: () => void;
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

/** The regenerate button of an edited team's slug (US-09.5). */
export interface SlugRegenerate {
  disabled: boolean;
  hint: string;
  /** The open confirm, with the slug now and the slug after, or `null`. */
  confirm: { from: string; to: string } | null;
  open: () => void;
  apply: () => void;
  cancel: () => void;
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
  /** `null` for a new team: its slug follows the name. */
  regenerate: SlugRegenerate | null;
  handleNameChange: (name: string) => void;
  handleSave: () => void;
}
