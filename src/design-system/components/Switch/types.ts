export default interface SwitchProps {
  label: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
  /** Turns the switch off for the user. */
  disabled?: boolean;
}
