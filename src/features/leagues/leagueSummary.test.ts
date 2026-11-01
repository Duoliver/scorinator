import { describe, expect, it } from 'vitest';
import {
  describeLeague,
  formatHomeAdvantageLabel,
  formatLeagueName,
  formatPhaseLabel,
  formatPhasesLabel,
  formatPointsLabel,
  phaseShortName,
} from './leagueSummary';

describe('describeLeague', () => {
  it('uses the singular "team" for exactly one team', () => {
    expect(describeLeague({ teamCount: 1, homeAdvantage: true })).toBe(
      'Round robin (two-way) · 1 team · Home adv. on'
    );
  });

  it('uses the plural "teams" for any other count', () => {
    expect(describeLeague({ teamCount: 0, homeAdvantage: true })).toBe(
      'Round robin (two-way) · 0 teams · Home adv. on'
    );
  });

  it('reflects home advantage being on', () => {
    expect(describeLeague({ teamCount: 2, homeAdvantage: true })).toContain(
      'Home adv. on'
    );
  });

  it('reflects home advantage being off', () => {
    expect(describeLeague({ teamCount: 2, homeAdvantage: false })).toContain(
      'Home adv. off'
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
