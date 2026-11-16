/** One option. A value can be a number, such as a condition level (Task
 * 227). */
export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  /** The name of an option that shows an icon, such as "↗": a screen reader
   * reads it, and the mouse tooltip shows it. */
  ariaLabel?: string;
}

export default interface SegmentedControlProps<T extends string | number> {
  /** The name of the choice, for example "Tie format". It shows above the
   * options, and it names the radio group for a screen reader. */
  label: string;
  options: SegmentedOption<T>[];
  /** The option that is selected on mount. Uncontrolled: the control owns
   * the value, and a caller reads or writes it through the ref. */
  defaultValue: T;
  /** Called when the user selects another option, by a click or a key. Not
   * called by `ref.setValue`. */
  onChange?: (value: T) => void;
  /** Hides the label from view, for a row that shows its own label, such as
   * a conflict row (US-11.2). The group keeps the label as its name. */
  hideLabel?: boolean;
  /** Turns every option off. */
  disabled?: boolean;
  /** Text before the first option and after the last one, such as "Crisis"
   * and "Peak". A screen reader skips it: the option names say it. */
  startLabel?: string;
  endLabel?: string;
  /** Shows square options for one icon character each, such as the level
   * icons of the condition (US-14.1). */
  iconOptions?: boolean;
}
