export default interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  id?: string;
  min?: number;
  max?: number;
  step?: number;
}
