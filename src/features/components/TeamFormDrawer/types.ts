import type { TeamFields } from '@/domain';

export default interface TeamFormDrawerProps {
  isEdit?: boolean;
  initial?: TeamFields;
  /** The slugs of the other Blueprints, for a new team's slug preview. */
  takenSlugs?: readonly string[];
  onCancel: () => void;
  onSave: (record: TeamFields) => void;
}
