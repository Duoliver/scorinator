import type { ComponentChildren, JSX } from 'preact';

/** A hint with the team name in bold, then the Location when the team has
 * one: the hint of a trigram (Task 157 choice 2) and of a cut name (Task
 * 180). The bold name is from the Task 180 review. */
export const renderNameHint = (name: string, location: string): JSX.Element => (
  <>
    <strong>{name}</strong>
    {location && ` · ${location}`}
  </>
);

/** The hint of the name (Task 180): the name and the Location when the
 * screen cuts the name, else the Location. Empty means no hint. */
export const getNameHint = (
  name: string,
  location: string,
  cut: boolean
): ComponentChildren => (cut ? renderNameHint(name, location) : location);
