export interface SelectOption {
  label: string;
  value: string;
}

export default interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
}
