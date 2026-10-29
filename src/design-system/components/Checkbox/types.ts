import type { ComponentChildren } from 'preact';

export default interface CheckboxProps {
  /** Text, or richer content such as a name with a tag (Task 113). */
  label: ComponentChildren;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** The label fills its row, with padding and a hover colour, so a click
   * anywhere on the row toggles the box (Task 113). */
  fullWidth?: boolean;
  id?: string;
}
