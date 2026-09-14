import type { TeamRecord } from '@/features/components/types';

export default interface TeamFormProps {
  title: string;
  saveLabel: string;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}
