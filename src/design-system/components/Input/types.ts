import type { ComponentChildren } from 'preact';

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
  /** Content at the right side of the input box, in a square as tall as
   * the box, for example an icon button with `fill` (Task 169). The label
   * stays above the box and names the input only. */
  trailing?: ComponentChildren;
}
