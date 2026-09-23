import type { TeamRecord } from '@/features/components/types';

export default interface TeamFormProps {
  saveLabel: string;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}
