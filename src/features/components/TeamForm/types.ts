import type { TeamRecord } from '@/domain';

export default interface TeamFormProps {
  saveLabel: string;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}
