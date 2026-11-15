import type { ResumeTone } from './helpers';

/** One row of a Resume card, ready to show. */
export interface ResumeCardRow {
  key: string;
  place: string;
  name: string;
  /** The Location of the Blueprint, or `''`: the hint of the name. */
  location: string;
  label: string;
  tone: ResumeTone | undefined;
}

/** One league of the Resume tab (US-13.8, Task 221). */
export interface ResumeCard {
  uuid: string;
  name: string;
  /** The progress badge of the league card (choice 6). */
  progress: string;
  isComplete: boolean;
  href: string;
  rows: ResumeCardRow[];
  /** "No results yet." or "No winner yet.", in place of the rows. */
  note: string | undefined;
}

export default interface ResumeTabProps {
  cards: readonly ResumeCard[];
}
