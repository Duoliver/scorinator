import type { TeamRecord } from '@/features/components/types';

export default interface TeamFormDrawerProps {
  isEdit?: boolean;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}
