/** The hint of a trigram that shows in place of the name (Task 157 choice
 * 2): the name, and the Location when the team has one. */
export const getTrigramHint = (name: string, location: string): string =>
  location ? `${name} · ${location}` : name;
