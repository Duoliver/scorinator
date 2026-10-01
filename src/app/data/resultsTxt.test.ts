import { describe, expect, it, vi } from 'vitest';
import { exportResultsTxt } from './resultsTxt';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';

function fakeFs(overrides: Partial<FileSystem> = {}): FileSystem {
  return {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function fakeDialog(overrides: Partial<SaveFileDialog> = {}): SaveFileDialog {
  return {
    pickSavePath: vi.fn(),
    pickOpenPath: vi.fn(),
    ...overrides,
  };
}

const roster: TeamRecord[] = [
  { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
  { slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5', tier: 'C' },
];

const league: LeagueRecord = {
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [
    { slug: 'fc-united', ovr: 70 },
    { slug: 'fc-rivals', ovr: 65 },
  ],
  fixtures: [{ matchday: 1, home: 'fc-united', away: 'fc-rivals' }],
  byes: [],
  results: [
    { matchday: 1, home: 'fc-united', away: 'fc-rivals', homeGoals: 2, awayGoals: 1 },
  ],
};

describe('exportResultsTxt', () => {
  it('returns null and writes nothing when the user cancels the dialog', async () => {
    const writeTextFile = vi.fn();
    const dialog = fakeDialog({ pickSavePath: vi.fn().mockResolvedValue(null) });

    const result = await exportResultsTxt(
      league,
      roster,
      fakeFs({ writeTextFile }),
      dialog
    );

    expect(result).toBeNull();
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('writes the summary to the chosen path, with team names and not slugs', async () => {
    const writeTextFile = vi.fn();
    const dialog = fakeDialog({
      pickSavePath: vi.fn().mockResolvedValue('/results.txt'),
    });

    const result = await exportResultsTxt(
      league,
      roster,
      fakeFs({ writeTextFile }),
      dialog
    );

    expect(result).toBe('/results.txt');
    expect(writeTextFile).toHaveBeenCalled();
    const [, contents] = writeTextFile.mock.calls[0];
    expect(contents).toContain('Coastal Premier');
    expect(contents).toContain('STANDINGS');
    expect(contents).toContain('FC United  2 - 1  FC Rivals');
    expect(contents).not.toContain('fc-united');
  });

  it('opens the save dialog filtered to .txt, named after the league', async () => {
    const pickSavePath = vi.fn().mockResolvedValue(null);

    await exportResultsTxt(league, roster, fakeFs(), fakeDialog({ pickSavePath }));

    expect(pickSavePath).toHaveBeenCalledWith('coastal-premier-results.txt', [
      { name: 'Text file', extensions: ['txt'] },
    ]);
  });

  it('throws before it opens the dialog when a league team is not in the roster', async () => {
    const pickSavePath = vi.fn();

    await expect(
      exportResultsTxt(league, [roster[0]], fakeFs(), fakeDialog({ pickSavePath }))
    ).rejects.toThrow(/not in the team roster/);
    expect(pickSavePath).not.toHaveBeenCalled();
  });
});
