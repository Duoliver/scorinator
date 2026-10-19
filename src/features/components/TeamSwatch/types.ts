/** A dense row, such as a match row, needs a smaller swatch than a list of
 * teams. */
export type TeamSwatchSize = 'sm' | 'md' | 'lg';

export default interface TeamSwatchProps {
  /** A hex colour. A blank one shows as transparent, for example for a
   * league team that is no longer in the roster. */
  colour: string;
  size?: TeamSwatchSize;
  /** A class of the screen, for a layout rule that only that screen needs. */
  class?: string;
}
