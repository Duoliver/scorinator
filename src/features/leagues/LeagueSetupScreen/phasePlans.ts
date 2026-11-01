import type { PhasePlan } from '@/engine/phases';
import { formatPhaseLabel } from '@/features/leagues/leagueSummary';

/**
 * The phase chain of the League Setup wizard (Task 129): pure edits of a
 * plan list. Each edit gives a new list, and keeps the advancement rule:
 * each phase but the last has an advancement, and the last has none
 * (US-01.4). A phase that stops being the last gets Top 2 (choice 5).
 */

/** The value of each format option of the format field (US-01.2). */
export type PhaseFormatKey = 'rr2' | 'rr1' | 'grp2' | 'grp1' | 'bracket';

export const DEFAULT_PHASE_PLANS: readonly PhasePlan[] = [
  { format: 'round-robin', legs: 'two-way' },
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
  if (plan.format === 'bracket') return 'bracket';
  const legs = plan.legs === 'two-way' ? '2' : '1';
  return plan.format === 'groups' ? `grp${legs}` : `rr${legs}`;
}

/** The top N of a plan, or `undefined` for a plan with no advancement. */
function topOf(plan: PhasePlan): number | undefined {
  return plan.format === 'bracket' ? undefined : plan.advance?.top;
}

/** The plan with an advancement of `top`, or with none. A bracket never
 * has one. A Groups phase keeps its best M. */
function withTop(plan: PhasePlan, top: number | undefined): PhasePlan {
  if (plan.format === 'bracket') return plan;
  if (plan.format === 'round-robin') {
    const { advance: _dropped, ...rest } = plan;
    return top === undefined ? rest : { ...rest, advance: { top } };
  }
  const { advance, ...rest } = plan;
  return top === undefined
    ? rest
    : { ...rest, advance: { top, bestOfNext: advance?.bestOfNext ?? 0 } };
}

/** Each phase but the last keeps or gets an advancement. The last has none. */
function normalized(plans: readonly PhasePlan[]): PhasePlan[] {
  return plans.map((plan, index) =>
    index === plans.length - 1
      ? withTop(plan, undefined)
      : withTop(plan, topOf(plan) ?? DEFAULT_TOP)
  );
}

/** "+ Add phase" is off after a bracket (US-01.3). */
export function canAddPhase(plans: readonly PhasePlan[]): boolean {
  return plans[plans.length - 1]?.format !== 'bracket';
}

/** Adds a two-way round robin at the end (choice 5). */
export function addPhase(plans: readonly PhasePlan[]): PhasePlan[] {
  return normalized([...plans, { format: 'round-robin', legs: 'two-way' }]);
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
  return moved.every((plan, i) => plan.format !== 'bracket' || i === moved.length - 1);
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
 * keeps its group setting. */
export function setPhaseFormat(
  plans: readonly PhasePlan[],
  index: number,
  key: PhaseFormatKey
): PhasePlan[] {
  const old = plans[index];
  const top = topOf(old);
  let plan: PhasePlan;
  if (key === 'bracket') {
    plan = { format: 'bracket' };
  } else {
    const legs = key.endsWith('2') ? 'two-way' : 'single-duels';
    plan = key.startsWith('grp')
      ? {
          format: 'groups',
          legs,
          grouping:
            old.format === 'groups'
              ? { ...old.grouping }
              : { by: 'size', size: DEFAULT_GROUP_SIZE },
        }
      : { format: 'round-robin', legs };
  }
  return normalized(plans.map((p, i) => (i === index ? withTop(plan, top) : p)));
}

function editGroups(
  plans: readonly PhasePlan[],
  index: number,
  edit: (plan: Extract<PhasePlan, { format: 'groups' }>) => PhasePlan
): PhasePlan[] {
  return plans.map((plan, i) =>
    i === index && plan.format === 'groups' ? edit(plan) : plan
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
      by === 'size'
        ? { by: 'size', size: DEFAULT_GROUP_SIZE }
        : { by: 'count', count: DEFAULT_GROUP_COUNT },
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
      plan.grouping.by === 'size'
        ? { by: 'size', size: value }
        : { by: 'count', count: value },
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
    plan.advance ? { ...plan, advance: { ...plan.advance, bestOfNext } } : plan
  );
}

/** A number field value (choice 4): a whole number of 0 or more, or `NaN`.
 * The fit check reports a `NaN` (Task 177). */
export function parseWholeNumber(text: string): number {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** A bracket phase keeps "Create league" off until M4 (choice 2). */
export function hasBracketPhase(plans: readonly PhasePlan[]): boolean {
  return plans.some((plan) => plan.format === 'bracket');
}

/** The Review text of one phase: the full label, the group setting, and
 * the advancement. */
export function describePhasePlan(plan: PhasePlan): string {
  const parts = [formatPhaseLabel(plan)];
  if (plan.format === 'groups') {
    const { grouping } = plan;
    parts.push(
      grouping.by === 'size' ? `size ${grouping.size}` : `${grouping.count} groups`
    );
    if (plan.advance) {
      parts.push(`Top ${plan.advance.top} advance per group`);
      if (plan.advance.bestOfNext > 0) {
        parts.push(`best ${plan.advance.bestOfNext} of place ${plan.advance.top + 1}`);
      }
    }
  } else if (plan.format === 'round-robin' && plan.advance) {
    parts.push(`Top ${plan.advance.top} advance`);
  }
  return parts.join(' · ');
}
