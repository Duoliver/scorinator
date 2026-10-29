import { describe, expectTypeOf, it } from 'vitest';
import type { Fixture } from '@/engine/round-robin';
import type { MatchResult } from '@/engine/standings';
import type { Tier } from '@/engine/tier-ovr';
import type {
  League,
  LeagueProgress,
  LeagueWrapper,
  Manifest,
  Phase,
  PhaseFormat,
  PhaseResult,
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

  it('holds fixtures and results that name a team by a uuid string', () => {
    expectTypeOf<Phase['fixtures']>().toEqualTypeOf<Fixture<string>[]>();
    expectTypeOf<Phase['results']>().toEqualTypeOf<PhaseResult[]>();
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

  it('gives each summary row the card fields and the progress (Task 76 d)', () => {
    expectTypeOf<WrapperSummary['contentType']>().toEqualTypeOf<'league'>();
    expectTypeOf<WrapperSummary['teamCount']>().toEqualTypeOf<number>();
    expectTypeOf<WrapperSummary['phaseFormats']>().toEqualTypeOf<PhaseFormat[]>();
    expectTypeOf<WrapperSummary['progress']>().toEqualTypeOf<LeagueProgress>();
  });

  it('shows progress as a phase with its matchday, or completed', () => {
    expectTypeOf<LeagueProgress['kind']>().toEqualTypeOf<'phase' | 'completed'>();
    expectTypeOf<Extract<LeagueProgress, { kind: 'phase' }>>().toEqualTypeOf<{
      kind: 'phase';
      phase: number;
      matchday: number;
      matchdays: number;
    }>();
  });
});
