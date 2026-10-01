import { describe, expect, it, vi } from 'vitest';
import {
  leagueToSaved,
  loadLeagueFile,
  saveLeagueFile,
  saveLeagueFileAs,
  savedToLeague,
} from './leagueFile';
import { parseLeague, serializeLeague, type SavedLeague } from '@/adapters/json-io';
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
  { slug: 'fc-unrelated', name: 'FC Unrelated', colour: '#000000', tier: 'A' },
];

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [
    { slug: 'fc-united', ovr: 72 },
    { slug: 'fc-rivals', ovr: 61 },
  ],
  fixtures: [
    { matchday: 1, home: 'fc-united', away: 'fc-rivals' },
    { matchday: 2, home: 'fc-rivals', away: 'fc-united' },
  ],
  byes: [],
  results: [{ matchday: 1, home: 'fc-united', away: 'fc-rivals', homeGoals: 2, awayGoals: 1 }],
  ...overrides,
});

/** A valid save file, edited one field at a time by the validation tests. */
const saved = (overrides: Partial<SavedLeague> = {}): SavedLeague => ({
  ...leagueToSaved(league(), roster),
  ...overrides,
});

describe('leagueToSaved', () => {
  it('joins each league team with its roster entry, and keeps the rolled OVR', () => {
    const result = leagueToSaved(league(), roster);

    expect(result.formatVersion).toBe(1);
    expect(result.league).toEqual({
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
    });
    expect(result.teams).toEqual([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B', ovr: 72 },
      { slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5', tier: 'C', ovr: 61 },
    ]);
    expect(result.results).toEqual(league().results);
  });

  it('saves only the teams in the league, not the whole roster', () => {
    const slugs = leagueToSaved(league(), roster).teams.map((team) => team.slug);
    expect(slugs).not.toContain('fc-unrelated');
  });

  it('throws a readable error for a league team missing from the roster', () => {
    expect(() => leagueToSaved(league(), roster.slice(0, 1))).toThrow(/fc-rivals/);
  });
});

describe('savedToLeague', () => {
  it('rebuilds the league and the roster teams, with the slug taken from the name', () => {
    const { league: rebuilt, teams } = savedToLeague(saved());

    expect(rebuilt).toEqual(league());
    expect(teams).toEqual(roster.slice(0, 2));
  });

  it('round-trips through serialize and parse', () => {
    const text = serializeLeague(leagueToSaved(league(), roster));
    expect(savedToLeague(parseLeague(text)).league).toEqual(league());
  });

  it('accepts a league with no results yet', () => {
    expect(() => savedToLeague(saved({ results: [] }))).not.toThrow();
  });

  it('throws for a fixture naming a team that is not in the file', () => {
    const bad = saved({ fixtures: [{ matchday: 1, home: 'fc-united', away: 'ghost-fc' }] });
    expect(() => savedToLeague(bad)).toThrow(/ghost-fc/);
  });

  it('throws for a bye naming a team that is not in the file', () => {
    const bad = saved({ byes: [{ matchday: 1, team: 'ghost-fc' }] });
    expect(() => savedToLeague(bad)).toThrow(/ghost-fc/);
  });

  it('throws for a result naming a team that is not in the file', () => {
    const bad = saved({
      results: [{ matchday: 1, home: 'ghost-fc', away: 'fc-rivals', homeGoals: 0, awayGoals: 0 }],
    });
    expect(() => savedToLeague(bad)).toThrow(/ghost-fc/);
  });

  it('throws for a result that matches no fixture', () => {
    const bad = saved({
      results: [{ matchday: 9, home: 'fc-united', away: 'fc-rivals', homeGoals: 1, awayGoals: 1 }],
    });
    expect(() => savedToLeague(bad)).toThrow(/no matching fixture/);
  });

  it('throws for a league name that cannot make a slug', () => {
    const bad = saved({ league: { ...saved().league, name: '!!!' } });
    expect(() => savedToLeague(bad)).toThrow(RangeError);
  });
});

describe('saveLeagueFile', () => {
  it('writes straight to a known path, without opening the dialog', async () => {
    const writeTextFile = vi.fn();
    const rename = vi.fn();
    const pickSavePath = vi.fn();
    const result = await saveLeagueFile(
      league(),
      roster,
      '/saves/coastal.json',
      fakeFs({ writeTextFile, rename }),
      fakeDialog({ pickSavePath })
    );

    expect(result).toBe('/saves/coastal.json');
    expect(pickSavePath).not.toHaveBeenCalled();
    expect(rename).toHaveBeenCalledWith(expect.stringContaining('/saves/coastal.json.tmp-'), '/saves/coastal.json');
    const [, contents] = writeTextFile.mock.calls[0]!;
    expect(parseLeague(contents as string).league.name).toBe('Coastal Premier');
  });

  it('opens the dialog with <slug>.json as the default name when no path is known', async () => {
    const pickSavePath = vi.fn().mockResolvedValue('/picked.json');
    const result = await saveLeagueFile(league(), roster, null, fakeFs(), fakeDialog({ pickSavePath }));

    expect(result).toBe('/picked.json');
    expect(pickSavePath).toHaveBeenCalledWith('coastal-premier.json', undefined);
  });

  it('returns null and writes nothing when the user cancels the dialog', async () => {
    const writeTextFile = vi.fn();
    const result = await saveLeagueFile(
      league(),
      roster,
      null,
      fakeFs({ writeTextFile }),
      fakeDialog({ pickSavePath: vi.fn().mockResolvedValue(null) })
    );

    expect(result).toBeNull();
    expect(writeTextFile).not.toHaveBeenCalled();
  });
});

describe('saveLeagueFileAs', () => {
  it('always opens the dialog, starting from the known path', async () => {
    const pickSavePath = vi.fn().mockResolvedValue('/elsewhere.json');
    const result = await saveLeagueFileAs(
      league(),
      roster,
      '/saves/coastal.json',
      fakeFs(),
      fakeDialog({ pickSavePath })
    );

    expect(result).toBe('/elsewhere.json');
    expect(pickSavePath).toHaveBeenCalledWith('/saves/coastal.json', undefined);
  });

  it('falls back to <slug>.json when no path is known yet', async () => {
    const pickSavePath = vi.fn().mockResolvedValue(null);
    await saveLeagueFileAs(league(), roster, null, fakeFs(), fakeDialog({ pickSavePath }));
    expect(pickSavePath).toHaveBeenCalledWith('coastal-premier.json', undefined);
  });
});

describe('loadLeagueFile', () => {
  it('returns null when the user cancels the open dialog', async () => {
    const result = await loadLeagueFile(
      fakeFs(),
      fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue(null) })
    );
    expect(result).toBeNull();
  });

  it('reads, parses, and rebuilds the chosen file, and returns its path', async () => {
    const text = serializeLeague(leagueToSaved(league(), roster));
    const result = await loadLeagueFile(
      fakeFs({ readTextFile: vi.fn().mockResolvedValue(text) }),
      fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue('/saves/coastal.json') })
    );

    expect(result).toEqual({
      path: '/saves/coastal.json',
      league: league(),
      teams: roster.slice(0, 2),
    });
  });

  it('propagates a parse error for a file that is not a league save', async () => {
    await expect(
      loadLeagueFile(
        fakeFs({ readTextFile: vi.fn().mockResolvedValue('not json') }),
        fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue('/bad.json') })
      )
    ).rejects.toThrow();
  });

  it('propagates a cross-reference error for a well-formed but inconsistent file', async () => {
    const bad = serializeLeague(
      saved({ fixtures: [{ matchday: 1, home: 'fc-united', away: 'ghost-fc' }] })
    );
    await expect(
      loadLeagueFile(
        fakeFs({ readTextFile: vi.fn().mockResolvedValue(bad) }),
        fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue('/bad.json') })
      )
    ).rejects.toThrow(/ghost-fc/);
  });
});
