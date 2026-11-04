import { describe, expect, it } from 'vitest';
import type { PhaseSummary } from '@/domain';
import type { GroupsPlan, PhasePlan } from '@/engine/phases';
import {
  describeLeague,
  formatAdvanceText,
  formatHeaderProgress,
  formatHomeAdvantageLabel,
  formatLeagueName,
  formatPhaseLabel,
  formatPhasesLabel,
  formatPointsLabel,
  formatProgressBadge,
  phaseShortName,
} from './leagueSummary';

const RR: PhaseSummary[] = [{ format: 'round-robin', legs: 'two-way' }];
const GROUPS_THEN_BRACKET: PhaseSummary[] = [
  { format: 'groups', legs: 'two-way' },
  { format: 'bracket' },
];

describe('describeLeague', () => {
  it('uses the singular "team" for exactly one team', () => {
    expect(describeLeague({ phases: RR, teamCount: 1, homeAdvantage: true })).toBe(
      'Round robin (two-way) · 1 team · Home adv. on'
    );
  });

  it('uses the plural "teams" for any other count', () => {
    expect(describeLeague({ phases: RR, teamCount: 0, homeAdvantage: true })).toBe(
      'Round robin (two-way) · 0 teams · Home adv. on'
    );
  });

  it('reflects home advantage being on', () => {
    expect(describeLeague({ phases: RR, teamCount: 2, homeAdvantage: true })).toContain(
      'Home adv. on'
    );
  });

  it('reflects home advantage being off', () => {
    expect(
      describeLeague({ phases: RR, teamCount: 2, homeAdvantage: false })
    ).toContain('Home adv. off');
  });

  it('gives the full label of a one-phase league (Task 131, US-01.2)', () => {
    expect(
      describeLeague({
        phases: [{ format: 'round-robin', legs: 'single-duels' }],
        teamCount: 8,
        homeAdvantage: true,
      })
    ).toBe('Round robin (single duels) · 8 teams · Home adv. on');
  });

  it('joins the short names of a league with several phases', () => {
    expect(
      describeLeague({
        phases: GROUPS_THEN_BRACKET,
        teamCount: 16,
        homeAdvantage: true,
      })
    ).toBe('Group Stage → Bracket · 16 teams · Home adv. on');
  });
});

describe('the progress badge (Task 131 choices 3 and 4, US-01.2)', () => {
  const during = { kind: 'phase', phase: 1, matchday: 7, matchdays: 16 } as const;

  it('gives "MD x/y" on the card during a phase', () => {
    expect(formatProgressBadge(during)).toBe('MD 7/16');
  });

  it('gives "Complete" on the card for a complete league', () => {
    expect(formatProgressBadge({ kind: 'completed' })).toBe('Complete');
  });

  it('adds the short name of the current phase in the header', () => {
    expect(formatHeaderProgress({ phases: RR, progress: during })).toBe(
      'Round robin · MD 7/16'
    );
    expect(
      formatHeaderProgress({
        phases: GROUPS_THEN_BRACKET,
        progress: { kind: 'phase', phase: 1, matchday: 6, matchdays: 6 },
      })
    ).toBe('Group Stage · MD 6/6');
  });

  it('gives the round name of a bracket on the card and in the header (US-04.14)', () => {
    const bracket = { kind: 'bracket', phase: 2, round: 8 } as const;
    expect(formatProgressBadge(bracket)).toBe('Quarter-finals');
    expect(
      formatHeaderProgress({ phases: GROUPS_THEN_BRACKET, progress: bracket })
    ).toBe('Bracket · Quarter-finals');
  });

  it('gives "Complete" in the header for a complete league', () => {
    expect(formatHeaderProgress({ phases: RR, progress: { kind: 'completed' } })).toBe(
      'Complete'
    );
  });
});

describe('formatPointsLabel', () => {
  it('lists the win, draw, and loss points', () => {
    expect(formatPointsLabel({ win: 3, draw: 1, loss: 0 })).toBe('3/1/0 pts');
  });
});

describe('formatHomeAdvantageLabel', () => {
  it('says on or off', () => {
    expect(formatHomeAdvantageLabel(true)).toBe('Home adv. on');
    expect(formatHomeAdvantageLabel(false)).toBe('Home adv. off');
  });
});

describe('formatLeagueName', () => {
  it('keeps a real name', () => {
    expect(formatLeagueName('Coastal Premier')).toBe('Coastal Premier');
  });

  it('gives a placeholder for a blank or whitespace-only name', () => {
    expect(formatLeagueName('')).toBe('Untitled league');
    expect(formatLeagueName('   ')).toBe('Untitled league');
  });
});

describe('phase labels (Task 129, US-01.2)', () => {
  it('gives the five full labels', () => {
    expect(formatPhaseLabel({ format: 'round-robin', legs: 'two-way' })).toBe(
      'Round robin (two-way)'
    );
    expect(formatPhaseLabel({ format: 'round-robin', legs: 'single-duels' })).toBe(
      'Round robin (single duels)'
    );
    expect(formatPhaseLabel({ format: 'groups', legs: 'two-way' })).toBe(
      'Groups round robin (two-way)'
    );
    expect(formatPhaseLabel({ format: 'groups', legs: 'single-duels' })).toBe(
      'Groups round robin (single duels)'
    );
    expect(formatPhaseLabel({ format: 'bracket' })).toBe('Bracket');
  });

  it('gives the short name of each format family', () => {
    expect(phaseShortName({ format: 'round-robin', legs: 'single-duels' })).toBe(
      'Round robin'
    );
    expect(phaseShortName({ format: 'groups', legs: 'two-way' })).toBe('Group Stage');
    expect(phaseShortName({ format: 'bracket' })).toBe('Bracket');
  });

  it('gives the full label of one phase, or the short names joined with an arrow', () => {
    expect(formatPhasesLabel([{ format: 'round-robin', legs: 'two-way' }])).toBe(
      'Round robin (two-way)'
    );
    expect(
      formatPhasesLabel([{ format: 'groups', legs: 'two-way' }, { format: 'bracket' }])
    ).toBe('Group Stage → Bracket');
  });
});

const bySize = (top?: number, bestOfNext = 0): GroupsPlan => ({
  format: 'groups',
  legs: 'two-way',
  grouping: { by: 'size', size: 4 },
  ...(top === undefined ? {} : { advance: { top, bestOfNext } }),
});
const rr: PhasePlan = { format: 'round-robin', legs: 'two-way' };

describe('formatAdvanceText (Task 130 choice 5, Tasks 131 and 132)', () => {
  it('names the next phase by its short name', () => {
    expect(formatAdvanceText([bySize(2), { format: 'bracket' }])).toBe(
      'Top 2 of each group advance to the Bracket.'
    );
    expect(formatAdvanceText([bySize(1), rr])).toBe(
      'Top 1 of each group advance to the Round robin.'
    );
  });

  it('adds the best M', () => {
    expect(formatAdvanceText([bySize(2, 4), { format: 'bracket' }])).toBe(
      'Top 2 of each group and the best 4 of place 3 advance to the Bracket.'
    );
  });

  it('gives nothing for the last phase', () => {
    expect(formatAdvanceText([bySize()])).toBeUndefined();
    expect(formatAdvanceText([rr])).toBeUndefined();
  });

  it('gives the round-robin line (US-07.2)', () => {
    expect(
      formatAdvanceText([
        { format: 'round-robin', legs: 'two-way', advance: { top: 4 } },
        { format: 'bracket' },
      ])
    ).toBe('Top 4 advance to the Bracket.');
  });

  it('reads the phase at the given index', () => {
    const plans: PhasePlan[] = [
      { format: 'round-robin', legs: 'two-way', advance: { top: 8 } },
      bySize(2),
      { format: 'bracket' },
    ];
    expect(formatAdvanceText(plans, 1)).toBe(
      'Top 2 of each group advance to the Bracket.'
    );
    expect(formatAdvanceText(plans, 0)).toBe('Top 8 advance to the Group Stage.');
    expect(formatAdvanceText(plans, 2)).toBeUndefined();
  });
});
