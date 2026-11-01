import type { TeamFields } from '@/domain';

export default interface TeamFormDrawerProps {
  isEdit?: boolean;
  initial?: TeamFields;
  /** The slugs of the Blueprints, for the slug preview and the regenerate. */
  takenSlugs?: readonly string[];
  onCancel: () => void;
  onSave: (record: TeamFields) => void;
  /** Shows "Delete team" when given (US-09.4). */
  onDelete?: () => void;
}
