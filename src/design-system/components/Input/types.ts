export default interface InputProps {
  label?: string;
  /** The accessible name of a field with no visible label, for example a
   * search field with a placeholder only. */
  'aria-label'?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  id?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
}
