import { describe, expectTypeOf, it } from 'vitest';
import type { BracketTieResult } from '@/engine/bracket';
import type { PhaseFixture } from '@/engine/round-robin';
import type { MatchResult } from '@/engine/standings';
import type { TieResult, TieRules } from '@/engine/tiebreak';
import type { Tier } from '@/engine/tier-ovr';
import type {
  BracketPhase,
  League,
  LeagueProgress,
  LeagueWrapper,
  Manifest,
  Phase,
  PhaseFormat,
  PhaseSummary,
  PhaseResult,
  Playoff,
  ScheduledPhase,
  Season,
  SeasonLeague,
  SeasonSummary,
  SeasonWrapper,
  Provenance,
  TeamBlueprint,
  TeamInstance,
  WrapperSummary,
} from './index';

// Compile-time checks only: `npm run type-check` fails when a rule breaks.
// At run time each `it` passes with no work.

describe('TeamBlueprint (US-09.1, US-09.3, US-09.6, US-11.1)', () => {
  it('has a permanent uuid and the provenance fields', () => {
    expectTypeOf<TeamBlueprint['uuid']>().toEqualTypeOf<string>();
    expectTypeOf<TeamBlueprint>().toExtend<Provenance>();
  });

  it('has a location string and an ordered trigram list', () => {
    expectTypeOf<TeamBlueprint['location']>().toEqualTypeOf<string>();
    expectTypeOf<TeamBlueprint['trigrams']>().toEqualTypeOf<string[]>();
  });

  it('has a base tier', () => {
    expectTypeOf<TeamBlueprint['tier']>().toEqualTypeOf<Tier>();
  });

  it('has no City and no Crest (Task 74)', () => {
    expectTypeOf<TeamBlueprint>().not.toHaveProperty('city');
    expectTypeOf<TeamBlueprint>().not.toHaveProperty('crest');
  });
});

describe('TeamInstance (US-09.2)', () => {
  it('has no uuid of its own, only the uuid of its Blueprint', () => {
    expectTypeOf<TeamInstance>().not.toHaveProperty('uuid');
    expectTypeOf<TeamInstance['blueprintUuid']>().toEqualTypeOf<string>();
  });

  it('holds its own copy of the name, colour, slug, and tier, and a rolled ovr', () => {
    expectTypeOf<TeamInstance['name']>().toEqualTypeOf<string>();
    expectTypeOf<TeamInstance['colour']>().toEqualTypeOf<string>();
    expectTypeOf<TeamInstance['slug']>().toEqualTypeOf<string>();
    expectTypeOf<TeamInstance['tier']>().toEqualTypeOf<Tier>();
    expectTypeOf<TeamInstance['ovr']>().toEqualTypeOf<number>();
  });

  it('does not copy the location, and has no provenance', () => {
    expectTypeOf<TeamInstance>().not.toHaveProperty('location');
    expectTypeOf<TeamInstance>().not.toHaveProperty('createdByInstallation');
  });
});

describe('League (US-11.1, US-01.1)', () => {
  it('has a permanent uuid and the provenance fields, and no slug', () => {
    expectTypeOf<League['uuid']>().toEqualTypeOf<string>();
    expectTypeOf<League>().toExtend<Provenance>();
    expectTypeOf<League>().not.toHaveProperty('slug');
  });

  it('holds a list of phases', () => {
    expectTypeOf<League['phases']>().toEqualTypeOf<Phase[]>();
  });

  it('keeps no teams: the wrapper holds the Instances', () => {
    expectTypeOf<League>().not.toHaveProperty('teams');
  });
});

describe('Phase (Task 77)', () => {
  it('names its format', () => {
    expectTypeOf<Phase['format']>().toEqualTypeOf<PhaseFormat>();
  });

  it('holds fixtures with ids, and results that name a team by a uuid string', () => {
    expectTypeOf<ScheduledPhase['fixtures']>().toEqualTypeOf<PhaseFixture<string>[]>();
    expectTypeOf<ScheduledPhase['results']>().toEqualTypeOf<PhaseResult[]>();
  });

  it('a bracket phase holds its seeds, its bye teams, and its tie results (Task 139)', () => {
    expectTypeOf<BracketPhase['seeds']>().toEqualTypeOf<string[]>();
    expectTypeOf<BracketPhase['byeTeams']>().toEqualTypeOf<string[]>();
    expectTypeOf<BracketPhase['results']>().toEqualTypeOf<BracketTieResult<string>[]>();
  });

  it('gives each result a fixtureId, not a matchday', () => {
    expectTypeOf<PhaseResult['fixtureId']>().toEqualTypeOf<string>();
    expectTypeOf<PhaseResult>().not.toHaveProperty('matchday');
    expectTypeOf<PhaseResult>().toExtend<MatchResult<string>>();
  });
});

describe('LeagueWrapper (PERSISTENCE.md §2a)', () => {
  it('holds the Instances and one League', () => {
    expectTypeOf<LeagueWrapper['teams']>().toEqualTypeOf<TeamInstance[]>();
    expectTypeOf<LeagueWrapper['content']>().toEqualTypeOf<League>();
    expectTypeOf<LeagueWrapper['uuid']>().toEqualTypeOf<string>();
  });
});

describe('Manifest (Task 76)', () => {
  it('holds the installation uuid, the Blueprints, and one summary row for each wrapper', () => {
    expectTypeOf<Manifest['installationUuid']>().toEqualTypeOf<string>();
    expectTypeOf<Manifest['blueprints']>().toEqualTypeOf<TeamBlueprint[]>();
    expectTypeOf<Manifest['wrappers']>().toEqualTypeOf<WrapperSummary[]>();
  });

  it('holds one summary row for each Season, apart from the league rows (Task 209)', () => {
    expectTypeOf<Manifest['seasons']>().toEqualTypeOf<SeasonSummary[]>();
  });

  it('gives each summary row the card fields and the progress (Task 76 d)', () => {
    expectTypeOf<WrapperSummary['contentType']>().toEqualTypeOf<'league'>();
    expectTypeOf<WrapperSummary['teamCount']>().toEqualTypeOf<number>();
    expectTypeOf<WrapperSummary['phases']>().toEqualTypeOf<PhaseSummary[]>();
    expectTypeOf<WrapperSummary['progress']>().toEqualTypeOf<LeagueProgress>();
  });

  it('shows progress as a phase with its matchday, a bracket round, or completed', () => {
    expectTypeOf<LeagueProgress['kind']>().toEqualTypeOf<
      'phase' | 'bracket' | 'completed'
    >();
    expectTypeOf<Extract<LeagueProgress, { kind: 'phase' }>>().toEqualTypeOf<{
      kind: 'phase';
      phase: number;
      matchday: number;
      matchdays: number;
    }>();
  });
});

describe('Season (US-13.1, US-13.9, US-11.1, Task 207)', () => {
  it('has a permanent uuid and the provenance fields', () => {
    expectTypeOf<Season['uuid']>().toEqualTypeOf<string>();
    expectTypeOf<Season>().toExtend<Provenance>();
  });

  it('has a name and a free-text year, which together are unique (Task 209)', () => {
    expectTypeOf<Season['name']>().toEqualTypeOf<string>();
    expectTypeOf<Season['year']>().toEqualTypeOf<string>();
  });

  it('is finished or not, by a manual action (US-13.9)', () => {
    expectTypeOf<Season['finished']>().toEqualTypeOf<boolean>();
  });

  it('holds its leagues and its playoffs (US-13.5, US-13.7)', () => {
    expectTypeOf<Season['leagues']>().toEqualTypeOf<SeasonLeague[]>();
    expectTypeOf<Season['playoffs']>().toEqualTypeOf<Playoff[]>();
  });

  it('has no roster of its own: the wrapper holds the Season teams', () => {
    expectTypeOf<Season>().not.toHaveProperty('teams');
  });
});

describe('SeasonLeague (US-13.5, US-13.6, Task 207 choice 3)', () => {
  it('is a full league', () => {
    expectTypeOf<SeasonLeague>().toExtend<League>();
  });

  it('names its teams by their Blueprint uuids, so a team can play in two leagues', () => {
    expectTypeOf<SeasonLeague['teamUuids']>().toEqualTypeOf<string[]>();
  });
});

describe('Playoff (US-13.7, Task 207 choice 4)', () => {
  it('has a uuid and a name', () => {
    expectTypeOf<Playoff['uuid']>().toEqualTypeOf<string>();
    expectTypeOf<Playoff['name']>().toEqualTypeOf<string>();
  });

  it('names the home team and the away team by their Blueprint uuids', () => {
    expectTypeOf<Playoff['homeUuid']>().toEqualTypeOf<string>();
    expectTypeOf<Playoff['awayUuid']>().toEqualTypeOf<string>();
  });

  it('has the format options of a bracket tie', () => {
    expectTypeOf<Playoff['rules']>().toEqualTypeOf<TieRules>();
  });

  it('has a result only after the play', () => {
    expectTypeOf<Playoff['result']>().toEqualTypeOf<TieResult<string> | undefined>();
  });
});

describe('SeasonWrapper (PERSISTENCE.md §2a)', () => {
  it('holds the Season roster as its Instances, and one Season', () => {
    expectTypeOf<SeasonWrapper['teams']>().toEqualTypeOf<TeamInstance[]>();
    expectTypeOf<SeasonWrapper['content']>().toEqualTypeOf<Season>();
    expectTypeOf<SeasonWrapper['uuid']>().toEqualTypeOf<string>();
  });
});

describe('SeasonSummary (Task 207 choice 5)', () => {
  it('gives the fields of a Season card', () => {
    expectTypeOf<SeasonSummary['uuid']>().toEqualTypeOf<string>();
    expectTypeOf<SeasonSummary['name']>().toEqualTypeOf<string>();
    expectTypeOf<SeasonSummary['year']>().toEqualTypeOf<string>();
    expectTypeOf<SeasonSummary['finished']>().toEqualTypeOf<boolean>();
    expectTypeOf<SeasonSummary['leagueCount']>().toEqualTypeOf<number>();
    expectTypeOf<SeasonSummary['teamCount']>().toEqualTypeOf<number>();
    expectTypeOf<SeasonSummary['playoffCount']>().toEqualTypeOf<number>();
  });
});
