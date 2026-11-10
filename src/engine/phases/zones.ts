import {
  type GroupsPlan,
  type PhaseZone,
  type PlanZone,
  type RoundRobinPlan,
  ZoneColour,
  type ZoneProblem,
  PhaseFormat,
} from './types';

/** A plan with a table, so a plan that can have zones (US-12.5). */
export type ZonePlan = RoundRobinPlan | GroupsPlan;

/** The longest zone label (US-12.5). */
export const ZONE_LABEL_MAX = 24;

/** The zones that follow the advancement, with their default labels
 * (US-12.5). Only a phase that is not the last has an advancement
 * (`checkPhaseChain`), so a last phase has none. A yellow zone is automatic
 * only with a best M. With no best M, yellow is free (Task 155). */
export function getAutomaticZones(plan: ZonePlan): PhaseZone[] {
  if (!plan.advance) return [];
  const { top } = plan.advance;
  const zones: PhaseZone[] = [
    { colour: ZoneColour.GREEN, from: 1, to: top, label: 'Qualify', automatic: true },
  ];
  const bestOfNext = plan.format === PhaseFormat.GROUPS ? plan.advance.bestOfNext : 0;
  if (bestOfNext > 0) {
    zones.push({
      colour: ZoneColour.YELLOW,
      from: top + 1,
      to: top + 1,
      label: `Best ${bestOfNext} of place ${top + 1}`,
      automatic: true,
    });
  }
  return zones;
}

/**
 * The zones of one phase, in place order (US-12.5): the automatic green
 * and yellow zones, with a stored label in place of the default, and the
 * free zones with their stored places. A stored free zone with no places
 * has no place to show, so it is left out. `checkZones` reports it.
 */
export function getPhaseZones(plan: ZonePlan): PhaseZone[] {
  const stored = plan.zones ?? [];
  const automatic = getAutomaticZones(plan).map((zone) => {
    const own = stored.find((candidate) => candidate.colour === zone.colour);
    return own ? { ...zone, label: own.label } : zone;
  });
  const automaticColours = new Set(automatic.map((zone) => zone.colour));
  const free = stored.flatMap((zone): PhaseZone[] =>
    automaticColours.has(zone.colour) || !zone.places
      ? []
      : [
          {
            colour: zone.colour,
            from: zone.places.from,
            to: zone.places.to,
            label: zone.label,
            automatic: false,
          },
        ]
  );
  return [...automatic, ...free].sort((a, b) => a.from - b.from);
}

/**
 * The plan with only the stored zones that fit its kind of zone (Task 189
 * choice 4): an automatic colour keeps only a label, and a free colour
 * keeps only a zone with places. A wizard change of the format, the order,
 * or the best M can change the kind of green and yellow. A plan with no
 * zone list stays as it is.
 */
export function fitZones<Plan extends ZonePlan>(plan: Plan): Plan {
  if (!plan.zones) return plan;
  const automatic = new Set(getAutomaticZones(plan).map((zone) => zone.colour));
  const zones = plan.zones.filter((zone) =>
    automatic.has(zone.colour) ? !zone.places : Boolean(zone.places)
  );
  return zones.length === plan.zones.length ? plan : { ...plan, zones };
}

function hasValidPlaces(zone: PlanZone): boolean {
  if (!zone.places) return true;
  const { from, to } = zone.places;
  return Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to >= from;
}

/**
 * The problems of the stored zones of one plan (US-12.5): a colour used
 * twice, a label longer than `ZONE_LABEL_MAX`, places on an automatic
 * zone, a free zone with no places, a range that is not valid, and two
 * zones that share a place. An empty list means the zones are valid.
 */
export function checkZones(plan: ZonePlan): ZoneProblem[] {
  const problems: ZoneProblem[] = [];
  const stored = plan.zones ?? [];
  const automaticColours = new Set(getAutomaticZones(plan).map((zone) => zone.colour));
  const seen = new Set<ZoneColour>();
  const badColours = new Set<ZoneColour>();

  for (const zone of stored) {
    const { colour } = zone;
    if (seen.has(colour)) problems.push({ code: 'repeated-colour', colour });
    seen.add(colour);
    if (zone.label.length > ZONE_LABEL_MAX)
      problems.push({ code: 'label-too-long', colour });
    if (automaticColours.has(colour)) {
      if (zone.places) problems.push({ code: 'places-on-automatic', colour });
    } else if (!zone.places) {
      problems.push({ code: 'missing-places', colour });
    } else if (!hasValidPlaces(zone)) {
      problems.push({ code: 'bad-places', colour });
      badColours.add(colour);
    }
  }

  const zones = getPhaseZones(plan).filter((zone) => !badColours.has(zone.colour));
  zones.forEach((zone, i) => {
    for (const later of zones.slice(i + 1)) {
      if (later.from <= zone.to) {
        problems.push({ code: 'shared-place', colours: [zone.colour, later.colour] });
      }
    }
  });
  return problems;
}

/**
 * The zone colour of each team, by its place in its table (US-12.5). A
 * place is the row number, from 1 (Task 155 choice 5). In a Groups phase,
 * each group table uses the same zones. A team out of every zone has no
 * entry.
 *
 * `qualifiers` is for a complete phase: the teams that go on
 * (`pickQualifiers`). Then the automatic yellow rows of the best M turn
 * green, and the other rows of that place lose the yellow (US-07.2).
 */
export function getZoneColours<TeamId>(
  zones: readonly PhaseZone[],
  tables: readonly (readonly TeamId[])[],
  qualifiers?: ReadonlySet<TeamId>
): Map<TeamId, ZoneColour> {
  const colours = new Map<TeamId, ZoneColour>();
  for (const table of tables) {
    table.forEach((team, index) => {
      const place = index + 1;
      const zone = zones.find(
        (candidate) => candidate.from <= place && place <= candidate.to
      );
      if (!zone) return;
      if (qualifiers && zone.automatic && zone.colour === ZoneColour.YELLOW) {
        if (qualifiers.has(team)) colours.set(team, ZoneColour.GREEN);
        return;
      }
      colours.set(team, zone.colour);
    });
  }
  return colours;
}
