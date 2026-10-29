import type { TeamFields } from '@/domain';

export default interface TeamFormDrawerProps {
  isEdit?: boolean;
  initial?: TeamFields;
  onCancel: () => void;
  onSave: (record: TeamFields) => void;
}
