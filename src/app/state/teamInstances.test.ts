import { describe, expect, it } from 'vitest';
import type { TeamInstance } from '@/domain';
import { createSeededRng } from '@/engine/rng';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import { blueprint, HARBORVIEW, instance, SALT_MARSH } from '@/test/databaseRecords';
import {
  newTeamInstances,
  pickTeamTrigrams,
  planSlugListImport,
  teamListProblem,
} from './teamInstances';

const TOWN = '00000000-0000-4000-8000-0000000000a3';
const saltMarsh = blueprint({ location: 'Ashfield' });
const harborview = blueprint({
  uuid: HARBORVIEW,
  slug: 'harborview-sc',
  name: 'Harborview SC',
  tier: 'C',
});
const town = blueprint({ uuid: TOWN, slug: 'old-town', name: 'Old Town', tier: 'F' });

describe('newTeamInstances (Task 81, US-08.1)', () => {
  it('copies the name, colour, slug, and Tier, keeps the Blueprint UUID, and has no location', () => {
    const [made] = newTeamInstances([saltMarsh], createSeededRng(1));
    expect(made).toMatchObject({
      blueprintUuid: SALT_MARSH,
      slug: 'salt-marsh-united',
      name: 'Salt Marsh United',
      colour: '#1565C0',
      tier: 'B',
    });
    expect(made).not.toHaveProperty('location');
    expect(made.trigram).toBe('');
  });

  it('rolls each OVR inside the Tier range, in the given order', () => {
    for (let seed = 0; seed < 50; seed++) {
      const made = newTeamInstances(
        [saltMarsh, harborview, town],
        createSeededRng(seed)
      );
      expect(made.map((team) => team.blueprintUuid)).toEqual([
        SALT_MARSH,
        HARBORVIEW,
        TOWN,
      ]);
      for (const team of made) {
        expect(team.ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES[team.tier].min);
        expect(team.ovr).toBeLessThanOrEqual(TIER_OVR_RANGES[team.tier].max);
      }
    }
  });

  it('gives the same OVRs for the same seed', () => {
    const a = newTeamInstances([saltMarsh, town], createSeededRng(7));
    const b = newTeamInstances([saltMarsh, town], createSeededRng(7));
    expect(a).toEqual(b);
  });
});

describe('planSlugListImport (US-08.7)', () => {
  const blueprints = [saltMarsh, harborview, town];

  it('finds the Blueprints of the slugs, in file order, with no regard to case', () => {
    const plan = planSlugListImport(['OLD-TOWN', 'Salt-Marsh-United'], blueprints, []);
    expect(plan.add.map((b) => b.uuid)).toEqual([TOWN, SALT_MARSH]);
    expect(plan.alreadyInList).toBe(0);
    expect(plan.notFound).toEqual([]);
  });

  it('counts a slug of the list and a second copy in the file as already in the list', () => {
    const list = [instance()];
    const plan = planSlugListImport(
      ['salt-marsh-united', 'old-town', 'OLD-TOWN', 'old-town'],
      blueprints,
      list
    );
    expect(plan.add.map((b) => b.uuid)).toEqual([TOWN]);
    expect(plan.alreadyInList).toBe(3);
  });

  it('lists the slugs it does not find, as typed, once each, and still adds the found ones', () => {
    const plan = planSlugListImport(
      ['north-fc', 'harborview-sc', 'Rivertown', 'north-fc'],
      blueprints,
      []
    );
    expect(plan.add.map((b) => b.uuid)).toEqual([HARBORVIEW]);
    expect(plan.notFound).toEqual(['north-fc', 'Rivertown']);
  });

  it('matches an Instance in the list by its Blueprint UUID, not by its slug', () => {
    // A regenerated Blueprint slug: the Instance keeps the old copy (US-09.2).
    const list = [instance({ slug: 'old-slug' })];
    const plan = planSlugListImport(['salt-marsh-united'], blueprints, list);
    expect(plan.add).toEqual([]);
    expect(plan.alreadyInList).toBe(1);
  });
});

describe('pickTeamTrigrams (US-09.6, Task 121)', () => {
  const ash = blueprint({
    uuid: SALT_MARSH,
    name: 'Ashfield',
    trigrams: ['ASH'],
    tier: 'C',
  });
  const ashton = blueprint({
    uuid: HARBORVIEW,
    name: 'Ashton',
    trigrams: ['ASH', 'AST'],
    tier: 'C',
  });
  const team = (b: typeof ash, ovr: number): TeamInstance =>
    instance({ blueprintUuid: b.uuid, name: b.name, tier: b.tier, ovr });

  it('lets the higher OVR pick first, from the Blueprint trigrams', () => {
    const picks = pickTeamTrigrams(
      [team(ash, 61), team(ashton, 65)],
      [ash, ashton],
      {}
    );
    expect(picks.get(HARBORVIEW)).toEqual({ trigram: 'ASH', fallback: false });
    expect(picks.get(SALT_MARSH)).toEqual({ trigram: 'AS2', fallback: true });
  });

  it('lets the team added first pick first on a full tie (choice 3)', () => {
    const picks = pickTeamTrigrams(
      [team(ash, 64), team(ashton, 64)],
      [ash, ashton],
      {}
    );
    expect(picks.get(SALT_MARSH)?.trigram).toBe('ASH');
    expect(picks.get(HARBORVIEW)?.trigram).toBe('AST');
  });

  it('takes a fixed trigram first', () => {
    const picks = pickTeamTrigrams([team(ash, 61), team(ashton, 65)], [ash, ashton], {
      [SALT_MARSH]: 'ASH',
    });
    expect(picks.get(SALT_MARSH)?.trigram).toBe('ASH');
    expect(picks.get(HARBORVIEW)?.trigram).toBe('AST');
  });

  it('uses the trigram made from the name for a deleted Blueprint', () => {
    const picks = pickTeamTrigrams([team(ash, 61)], [], {});
    expect(picks.get(SALT_MARSH)?.trigram).toBe('ASH');
  });
});

describe('teamListProblem (US-08.6, US-08.8, Task 121)', () => {
  it('needs at least 2 teams', () => {
    expect(teamListProblem([])).toBe('The league needs at least 2 teams to start.');
    expect(teamListProblem([instance()])).toBe(
      'The league needs at least 2 teams to start.'
    );
  });

  it('refuses two teams with the same name, with no regard to case', () => {
    const list = [
      instance({ name: 'Ashfield' }),
      instance({ blueprintUuid: HARBORVIEW, name: 'Old Town' }),
      instance({ blueprintUuid: TOWN, name: 'ASHFIELD ' }),
    ];
    expect(teamListProblem(list)).toBe(
      'Two teams have the name Ashfield. Edit one of them.'
    );
  });

  it('gives null for a list that can start', () => {
    expect(
      teamListProblem([
        instance(),
        instance({ blueprintUuid: HARBORVIEW, name: 'Old Town' }),
      ])
    ).toBeNull();
  });
});
