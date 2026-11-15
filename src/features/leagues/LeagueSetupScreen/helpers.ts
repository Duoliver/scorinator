import type { WizardSeasonState } from './types';

/** The text of a Season that gets no wizard, or `undefined` when it gets
 * one (Task 218). */
export function findSeasonNotice(state: WizardSeasonState): string | undefined {
  switch (state.kind) {
    case 'opening':
      return 'Opening the Season…';
    case 'not-found':
      return 'Season not found.';
    case 'error':
      return `The Season could not open: ${state.message}`;
    case 'finished':
      return `${state.label} is finished. Reopen it to add a league.`;
    default:
      return undefined;
  }
}
