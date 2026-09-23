import type { ComponentChildren } from 'preact';

export default interface FileCardProps {
  title: string;
  description: string;
  /** The card's buttons and controls, laid out on the right of the text. */
  children?: ComponentChildren;
  /** A field the user fills in before the controls act, such as a league
   * selector. When set, the field and the controls share a row under the
   * text, and the field takes the free width. */
  input?: ComponentChildren;
  /** Full-width content under the text and controls, such as a confirm step. */
  footer?: ComponentChildren;
}
