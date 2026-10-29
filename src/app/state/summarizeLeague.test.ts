import { describe, expect, it } from 'vitest';
import {
  HARBORVIEW,
  LEAGUE,
  leagueWrapper,
  result,
  SALT_MARSH,
} from '@/test/databaseRecords';
import { summarizeLeague } from './summarizeLeague';

describe('summarizeLeague (Task 76 d)', () => {
  it('gives the card fields of the league', () => {
    expect(summarizeLeague(leagueWrapper())).toEqual({
      uuid: LEAGUE,
      contentType: 'league',
      name: 'Coastal Premier',
      teamCount: 2,
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      phaseFormats: ['round-robin'],
      progress: { kind: 'phase', phase: 1, matchday: 1, matchdays: 2 },
    });
  });

  it('gives the lowest matchday with an unplayed fixture', () => {
    const wrapper = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);
    expect(summarizeLeague(wrapper).progress).toEqual({
      kind: 'phase',
      phase: 1,
      matchday: 2,
      matchdays: 2,
    });
  });

  it('gives a skipped earlier matchday', () => {
    const wrapper = leagueWrapper([result('p1.g1.md2.m1', HARBORVIEW, SALT_MARSH)]);
    expect(summarizeLeague(wrapper).progress).toMatchObject({ matchday: 1 });
  });

  it('gives completed when the current phase has no unplayed fixture', () => {
    const wrapper = leagueWrapper([
      result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
      result('p1.g1.md2.m1', HARBORVIEW, SALT_MARSH),
    ]);
    expect(summarizeLeague(wrapper).progress).toEqual({ kind: 'completed' });
  });

  it('reads the last phase as the current phase (M1 rule)', () => {
    const wrapper = leagueWrapper();
    const played = {
      ...wrapper.content.phases[0],
      results: [
        result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
        result('p1.g1.md2.m1', HARBORVIEW, SALT_MARSH),
      ],
    };
    const second = {
      ...wrapper.content.phases[0],
      fixtures: wrapper.content.phases[0].fixtures.map((f) => ({
        ...f,
        id: f.id.replace('p1', 'p2'),
      })),
    };
    const twoPhases = {
      ...wrapper,
      content: { ...wrapper.content, phases: [played, second] },
    };
    expect(summarizeLeague(twoPhases)).toMatchObject({
      phaseFormats: ['round-robin', 'round-robin'],
      progress: { kind: 'phase', phase: 2, matchday: 1, matchdays: 2 },
    });
  });

  it('gives completed for a league with no phase or no fixture', () => {
    const wrapper = leagueWrapper();
    const noPhase = { ...wrapper, content: { ...wrapper.content, phases: [] } };
    expect(summarizeLeague(noPhase).progress).toEqual({ kind: 'completed' });
    const empty = {
      ...wrapper,
      content: {
        ...wrapper.content,
        phases: [{ ...wrapper.content.phases[0], fixtures: [] }],
      },
    };
    expect(summarizeLeague(empty).progress).toEqual({ kind: 'completed' });
  });
});
