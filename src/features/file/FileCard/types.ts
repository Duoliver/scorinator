import type { ComponentChildren } from 'preact';

export default interface FileCardProps {
  title: string;
  description: string;
  /** The card's buttons and controls, laid out on the right of the text. */
  children?: ComponentChildren;
  /** Full-width content under the text and controls, such as a confirm step. */
  footer?: ComponentChildren;
}
