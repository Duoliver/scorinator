import type { TeamRecord } from '../types';

export default interface TeamFormProps {
  title: string;
  saveLabel: string;
  initial?: TeamRecord;
  onCancel: () => void;
  onSave: (record: TeamRecord) => void;
}
