export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export default interface SegmentedControlProps<T extends string> {
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
}
