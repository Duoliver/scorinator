import { describe, expect, it } from 'vitest';
import { formatTeamCount } from './formatTeamCount';

describe('formatTeamCount', () => {
  it('uses the singular for one team and the plural for any other count', () => {
    expect(formatTeamCount(1)).toBe('1 team');
    expect(formatTeamCount(0)).toBe('0 teams');
    expect(formatTeamCount(12)).toBe('12 teams');
  });
});
