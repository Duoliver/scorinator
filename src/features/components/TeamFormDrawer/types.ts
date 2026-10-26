import type { TeamRecord } from '@/domain';

export default interface TeamFormDrawerProps {
  isEdit?: boolean;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}
