import type { BracketPlanRules } from '@/engine/bracket';
import {
  bracketRulesOf,
  fitZones,
  type PhasePlan,
  type PlanZone,
  PhaseFormat,
  Legs,
} from '@/engine/phases';
import { formatPhaseLabel } from '@/features/leagues/leagueSummary';
import { GroupBy } from '@/engine/round-robin';
import { TieFormat, TiebreakMethod } from '@/engine/tiebreak';

/**
 * The phase chain of the League Setup wizard (Task 129): pure edits of a
 * plan list. Each edit gives a new list, and keeps the advancement rule:
 * each phase but the last has an advancement, and the last has none
 * (US-01.4). A phase that stops being the last gets Top 2 (choice 5). Each
 * edit also keeps only the zones that fit each plan (`fitZones`, Task 189).
 */

/** The value of each format option of the format field (US-01.2). */
export type PhaseFormatKey = 'rr2' | 'rr1' | 'grp2' | 'grp1' | 'bracket';

export const DEFAULT_PHASE_PLANS: readonly PhasePlan[] = [
  { format: PhaseFormat.ROUND_ROBIN, legs: Legs.TWO_WAY },
];

const DEFAULT_TOP = 2;
const DEFAULT_GROUP_SIZE = 4;
const DEFAULT_GROUP_COUNT = 2;

export const FORMAT_OPTIONS: readonly { value: PhaseFormatKey; label: string }[] = [
  { value: 'rr2', label: 'Round robin (two-way)' },
  { value: 'rr1', label: 'Round robin (single duels)' },
  { value: 'grp2', label: 'Groups round robin (two-way)' },
  { value: 'grp1', label: 'Groups round robin (single duels)' },
  { value: 'bracket', label: 'Bracket' },
];

export function formatKeyOf(plan: PhasePlan): PhaseFormatKey {
  if (plan.format === PhaseFormat.BRACKET) return 'bracket';
  const legs = plan.legs === Legs.TWO_WAY ? '2' : '1';
  return plan.format === PhaseFormat.GROUPS ? `grp${legs}` : `rr${legs}`;
}

/** The top N of a plan, or `undefined` for a plan with no advancement. */
function topOf(plan: PhasePlan): number | undefined {
  return plan.format === PhaseFormat.BRACKET ? undefined : plan.advance?.top;
}

/** The plan with an advancement of `top`, or with none. A bracket never
 * has one. A Groups phase keeps its best M. */
function withTop(plan: PhasePlan, top: number | undefined): PhasePlan {
  if (plan.format === PhaseFormat.BRACKET) return plan;
  if (plan.format === PhaseFormat.ROUND_ROBIN) {
    const { advance: _dropped, ...rest } = plan;
    return top === undefined ? rest : { ...rest, advance: { top } };
  }
  const { advance, ...rest } = plan;
  return top === undefined
    ? rest
    : { ...rest, advance: { top, bestOfNext: advance?.bestOfNext ?? 0 } };
}

/** The plan with only the zones that fit it (Task 189 choice 4). */
const withFitZones = (plan: PhasePlan): PhasePlan =>
  plan.format === PhaseFormat.BRACKET ? plan : fitZones(plan);

/** Each phase but the last keeps or gets an advancement. The last has none. */
function normalized(plans: readonly PhasePlan[]): PhasePlan[] {
  return plans.map((plan, index) =>
    withFitZones(
      index === plans.length - 1
        ? withTop(plan, undefined)
        : withTop(plan, topOf(plan) ?? DEFAULT_TOP)
    )
  );
}

/** "+ Add phase" is off after a bracket (US-01.3). */
export function canAddPhase(plans: readonly PhasePlan[]): boolean {
  return plans[plans.length - 1]?.format !== PhaseFormat.BRACKET;
}

/** Adds a two-way round robin at the end (choice 5). */
export function addPhase(plans: readonly PhasePlan[]): PhasePlan[] {
  return normalized([
    ...plans,
    { format: PhaseFormat.ROUND_ROBIN, legs: Legs.TWO_WAY },
  ]);
}

export function removePhase(plans: readonly PhasePlan[], index: number): PhasePlan[] {
  return normalized(plans.filter((_, i) => i !== index));
}

/** A move is off past the ends, and when it puts a bracket before another
 * phase (US-01.3). */
export function canMovePhase(
  plans: readonly PhasePlan[],
  index: number,
  step: -1 | 1
): boolean {
  const other = index + step;
  if (other < 0 || other >= plans.length) return false;
  const moved = movePhase(plans, index, step);
  return moved.every(
    (plan, i) => plan.format !== PhaseFormat.BRACKET || i === moved.length - 1
  );
}

export function movePhase(
  plans: readonly PhasePlan[],
  index: number,
  step: -1 | 1
): PhasePlan[] {
  const moved = [...plans];
  [moved[index], moved[index + step]] = [moved[index + step], moved[index]];
  return normalized(moved);
}

/** Changes the format of one phase, in its place (US-01.2). The top N
 * stays. A new Groups phase gets size 4. A legs change of a Groups phase
 * keeps its group setting. The zones stay, except on a Bracket (Task 189). */
export function setPhaseFormat(
  plans: readonly PhasePlan[],
  index: number,
  key: PhaseFormatKey
): PhasePlan[] {
  const old = plans[index];
  const top = topOf(old);
  let plan: PhasePlan;
  if (key === 'bracket') {
    plan = { format: PhaseFormat.BRACKET };
  } else {
    const legs = key.endsWith('2') ? Legs.TWO_WAY : Legs.SINGLE_DUELS;
    plan = key.startsWith('grp')
      ? {
          format: PhaseFormat.GROUPS,
          legs,
          grouping:
            old.format === PhaseFormat.GROUPS
              ? { ...old.grouping }
              : { by: GroupBy.SIZE, size: DEFAULT_GROUP_SIZE },
        }
      : { format: PhaseFormat.ROUND_ROBIN, legs };
    if (old.format !== PhaseFormat.BRACKET && old.zones)
      plan = { ...plan, zones: old.zones };
  }
  return normalized(plans.map((p, i) => (i === index ? withTop(plan, top) : p)));
}

function editGroups(
  plans: readonly PhasePlan[],
  index: number,
  edit: (plan: Extract<PhasePlan, { format: 'groups' }>) => PhasePlan
): PhasePlan[] {
  return plans.map((plan, i) =>
    i === index && plan.format === PhaseFormat.GROUPS ? edit(plan) : plan
  );
}

/** "Set by" (US-02.1). A switch gives the default number of the mode:
 * size 4 or count 2. */
export function setGroupBy(
  plans: readonly PhasePlan[],
  index: number,
  by: 'size' | 'count'
): PhasePlan[] {
  return editGroups(plans, index, (plan) => ({
    ...plan,
    grouping:
      by === GroupBy.SIZE
        ? { by: GroupBy.SIZE, size: DEFAULT_GROUP_SIZE }
        : { by: GroupBy.COUNT, count: DEFAULT_GROUP_COUNT },
  }));
}

/** The group size or count, in the current "Set by" mode. */
export function setGroupNumber(
  plans: readonly PhasePlan[],
  index: number,
  value: number
): PhasePlan[] {
  return editGroups(plans, index, (plan) => ({
    ...plan,
    grouping:
      plan.grouping.by === GroupBy.SIZE
        ? { by: GroupBy.SIZE, size: value }
        : { by: GroupBy.COUNT, count: value },
  }));
}

export function setTop(
  plans: readonly PhasePlan[],
  index: number,
  top: number
): PhasePlan[] {
  return plans.map((plan, i) =>
    i === index && topOf(plan) !== undefined ? withTop(plan, top) : plan
  );
}

export function setBestOfNext(
  plans: readonly PhasePlan[],
  index: number,
  bestOfNext: number
): PhasePlan[] {
  return editGroups(plans, index, (plan) =>
    plan.advance
      ? withFitZones({ ...plan, advance: { ...plan.advance, bestOfNext } })
      : plan
  );
}

/** The zones of one round-robin or Groups phase (US-12.5, Task 189). */
export function setPhaseZones(
  plans: readonly PhasePlan[],
  index: number,
  zones: PlanZone[]
): PhasePlan[] {
  return plans.map((plan, i) =>
    i === index && plan.format !== PhaseFormat.BRACKET ? { ...plan, zones } : plan
  );
}

/** A number field value (choice 4): a whole number of 0 or more, or `NaN`.
 * The fit check reports a `NaN` (Task 177). */
export function parseWholeNumber(text: string): number {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** The Review text of one phase: the full label, the group setting, and
 * the advancement. A bracket lists its settings (Task 140 choice 6): the
 * tie format, the away goals of two legs, AET, the method, the
 * single-match final of two legs, and the third place. `qualifiers` is the
 * bracket team count when known: below 4 there is no third-place tie. */
export function describePhasePlan(plan: PhasePlan, qualifiers?: number): string {
  const parts = [formatPhaseLabel(plan)];
  if (plan.format === PhaseFormat.BRACKET) {
    parts.push(...describeBracketRules(bracketRulesOf(plan), qualifiers));
  } else if (plan.format === PhaseFormat.GROUPS) {
    const { grouping } = plan;
    parts.push(
      grouping.by === GroupBy.SIZE
        ? `size ${grouping.size}`
        : `${grouping.count} groups`
    );
    if (plan.advance) {
      parts.push(`Top ${plan.advance.top} advance per group`);
      if (plan.advance.bestOfNext > 0) {
        parts.push(`best ${plan.advance.bestOfNext} of place ${plan.advance.top + 1}`);
      }
    }
  } else if (plan.advance) {
    parts.push(`Top ${plan.advance.top} advance`);
  }
  return parts.join(' · ');
}

function describeBracketRules(rules: BracketPlanRules, qualifiers?: number): string[] {
  const twoLegged = rules.format === TieFormat.TWO_LEGGED;
  const parts = [twoLegged ? 'Two-legged' : 'Single match'];
  if (twoLegged) parts.push(`away goals ${rules.awayGoals ? 'on' : 'off'}`);
  parts.push(`AET ${rules.playsAet ? 'on' : 'off'}`);
  parts.push(
    rules.method === TiebreakMethod.PENALTIES ? 'Penalties' : 'Replay→Coin toss'
  );
  if (twoLegged && rules.singleMatchFinal) parts.push('Single-match final');
  if (rules.thirdPlace && canHaveThirdPlace(qualifiers)) parts.push('Third place');
  return parts;
}

/** A third-place tie needs 4 qualifiers or more (US-04.12 row 2, Task 137
 * choice 3). With an unknown count, it can. */
export function canHaveThirdPlace(qualifiers?: number): boolean {
  return qualifiers === undefined || qualifiers >= 4;
}

/**
 * Changes the bracket settings of one plan (Task 140 choice 2): the plan
 * gets its full `rules`, the current ones (or the defaults) with the change.
 * A round-robin or Groups plan does not change. The input does not change.
 */
export function setBracketRules(
  plans: readonly PhasePlan[],
  index: number,
  change: Partial<BracketPlanRules>
): PhasePlan[] {
  return plans.map((plan, i) =>
    i === index && plan.format === PhaseFormat.BRACKET
      ? { format: PhaseFormat.BRACKET, rules: { ...bracketRulesOf(plan), ...change } }
      : plan
  );
}
