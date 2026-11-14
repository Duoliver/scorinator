/** A name that ends in a number in brackets, such as "Liga (2)". */
const NUMBER_SUFFIX = /^(.*\S) \((\d+)\)$/;

/** Two names match when they are the same after a trim, in any case, as
 * the MVP2 name checks do. An accent still counts. A file check uses the
 * same key, so the app and its files agree on a clash (Task 209). */
export function getNameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Gives `name` back when no taken name matches it. Otherwise it gives the
 * first free "Name (n)", so an import never shows two entities with one
 * name (US-13.11, US-15.5, US-16.1). The count starts at 2. A name that
 * ends in a number already counts up from that number: "Liga (2)" gives
 * "Liga (3)", not "Liga (2) (2)" (Task 208 choice 3).
 */
export function getNumberedName(name: string, taken: Iterable<string>): string {
  const keys = new Set([...taken].map(getNameKey));
  if (!keys.has(getNameKey(name))) return name;

  const match = NUMBER_SUFFIX.exec(name.trim());
  const base = match ? match[1] : name.trim();
  let number = match ? Number(match[2]) + 1 : 2;
  while (keys.has(getNameKey(`${base} (${number})`))) number++;
  return `${base} (${number})`;
}

/** A team that joins a Season. `lot` is the fixed lot of Task 78 for the
 * Season and the team, the last resort at the same OVR. */
export interface JoinNameTeam<TeamId> {
  id: TeamId;
  name: string;
  location: string;
  ovr: number;
  lot: number;
}

/**
 * Gives each joining team a name that no Season team has (US-13.4). The
 * roster teams joined first, so they keep their names. In the join, the
 * higher OVR keeps its name, then the lower lot. A team that must change
 * gets its Location in brackets, or the first free number when it has no
 * Location or that name is taken too (Task 208 choice 5).
 */
export function pickJoinNames<TeamId>(
  taken: Iterable<string>,
  teams: readonly JoinNameTeam<TeamId>[]
): Map<TeamId, string> {
  const takenNames = [...taken];
  const keys = new Set(takenNames.map(getNameKey));
  const order = [...teams].sort((a, b) => b.ovr - a.ovr || a.lot - b.lot);
  const names = new Map<TeamId, string>();

  for (const team of order) {
    let name = team.name;
    if (keys.has(getNameKey(name))) {
      const location = team.location.trim();
      const withLocation = `${team.name} (${location})`;
      name =
        location !== '' && !keys.has(getNameKey(withLocation))
          ? withLocation
          : getNumberedName(team.name, takenNames);
    }
    keys.add(getNameKey(name));
    takenNames.push(name);
    names.set(team.id, name);
  }

  return names;
}
