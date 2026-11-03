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
  /** The on-screen keyboard: `numeric` for a whole-number field that keeps
   * its text, as the wizard phase fields (Task 129). */
  inputMode?: 'numeric';
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
