export default interface TeamLabelProps {
  name: string;
  /** The Location of the Blueprint (US-09.3). `''` shows the name alone. */
  location: string;
  /** Puts the Location on the same line as the name, after a `1ch` gap, as
   * the Review list does (Task 120 review). Off: the Location goes below. */
  inline?: boolean;
}
