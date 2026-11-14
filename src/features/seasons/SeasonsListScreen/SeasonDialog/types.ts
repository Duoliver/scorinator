/** The name and the year that the dialog gives on a submit, trimmed. */
export interface SeasonNameValues {
  name: string;
  year: string;
}

/** The create and rename dialog of a Season (Task 212). */
export default interface SeasonDialogProps {
  title: string;
  description: string;
  submitLabel: string;
  initialName: string;
  initialYear: string;
  isTaken: (name: string, year: string) => boolean;
  onSubmit: (values: SeasonNameValues) => void;
  onCancel: () => void;
}

/** What `useSeasonDialog` gives the dialog. */
export interface SeasonDialogState {
  setName: (name: string) => void;
  setYear: (year: string) => void;
  canSubmit: boolean;
  error: string | null;
  handleSubmit: (event: Event) => void;
}
