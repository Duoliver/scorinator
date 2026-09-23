export default interface InputProps {
  label?: string;
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
