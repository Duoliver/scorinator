import { describe, expect, it } from 'vitest';
import {
  checkZones,
  fitZones,
  getAutomaticZones,
  getPhaseZones,
  getZoneColours,
  ZONE_LABEL_MAX,
  type GroupsPlan,
  type PhaseZone,
  type PlanZone,
  type RoundRobinPlan,
} from './index';

const roundRobin = (top?: number, zones?: PlanZone[]): RoundRobinPlan => ({
  format: 'round-robin',
  legs: 'two-way',
  ...(top === undefined ? {} : { advance: { top } }),
  ...(zones ? { zones } : {}),
});

const groups = (top?: number, bestOfNext = 0, zones?: PlanZone[]): GroupsPlan => ({
  format: 'groups',
  legs: 'single-duels',
  grouping: { by: 'size', size: 4 },
  ...(top === undefined ? {} : { advance: { top, bestOfNext } }),
  ...(zones ? { zones } : {}),
});

describe('getPhaseZones (US-12.5)', () => {
  it('gives no zone to a last phase with no stored zones', () => {
    expect(getPhaseZones(roundRobin())).toEqual([]);
    expect(getPhaseZones(groups())).toEqual([]);
  });

  it('gives an automatic green zone of places 1 to N, labelled "Qualify"', () => {
    expect(getPhaseZones(roundRobin(4))).toEqual([
      { colour: 'green', from: 1, to: 4, label: 'Qualify', automatic: true },
    ]);
  });

  it('gives an automatic yellow zone at place N + 1 with a best M', () => {
    expect(getPhaseZones(groups(2, 4))).toEqual([
      { colour: 'green', from: 1, to: 2, label: 'Qualify', automatic: true },
      {
        colour: 'yellow',
        from: 3,
        to: 3,
        label: 'Best 4 of place 3',
        automatic: true,
      },
    ]);
  });

  it('gives no yellow zone to a Groups phase with no best M', () => {
    expect(getPhaseZones(groups(2, 0)).map((zone) => zone.colour)).toEqual(['green']);
  });

  it('keeps the stored label of an automatic zone, also an empty one', () => {
    const plan = groups(2, 4, [
      { colour: 'green', label: 'Knockout' },
      { colour: 'yellow', label: '' },
    ]);
    expect(getPhaseZones(plan).map((zone) => zone.label)).toEqual(['Knockout', '']);
  });

  it('keeps the automatic range when the advancement changes', () => {
    const plan = groups(3, 2, [{ colour: 'green', label: 'Through' }]);
    expect(getPhaseZones(plan)[0]).toMatchObject({ from: 1, to: 3, label: 'Through' });
    expect(getPhaseZones(plan)[1]).toMatchObject({ from: 4, to: 4 });
  });

  it('gives the free zones their stored places, in place order', () => {
    const plan = roundRobin(2, [
      { colour: 'red', places: { from: 18, to: 20 }, label: 'Relegation' },
      { colour: 'blue', places: { from: 3, to: 4 }, label: '' },
    ]);
    expect(getPhaseZones(plan)).toEqual<PhaseZone[]>([
      { colour: 'green', from: 1, to: 2, label: 'Qualify', automatic: true },
      { colour: 'blue', from: 3, to: 4, label: '', automatic: false },
      { colour: 'red', from: 18, to: 20, label: 'Relegation', automatic: false },
    ]);
  });

  it('gives all four free zones to a last phase', () => {
    const plan = roundRobin(undefined, [
      { colour: 'yellow', places: { from: 3, to: 3 }, label: '' },
      { colour: 'green', places: { from: 1, to: 2 }, label: 'Champions' },
    ]);
    expect(getPhaseZones(plan)).toEqual<PhaseZone[]>([
      { colour: 'green', from: 1, to: 2, label: 'Champions', automatic: false },
      { colour: 'yellow', from: 3, to: 3, label: '', automatic: false },
    ]);
  });

  it('gives a free yellow zone to a phase with no best M', () => {
    const plan = roundRobin(2, [
      { colour: 'yellow', places: { from: 3, to: 4 }, label: 'Play-off' },
    ]);
    expect(getPhaseZones(plan)[1]).toEqual({
      colour: 'yellow',
      from: 3,
      to: 4,
      label: 'Play-off',
      automatic: false,
    });
  });
});

describe('checkZones (US-12.5)', () => {
  it('accepts a plan with no stored zones, and four valid zones', () => {
    expect(checkZones(groups(2, 4))).toEqual([]);
    expect(
      checkZones(
        groups(2, 4, [
          { colour: 'green', label: 'Qualify' },
          { colour: 'yellow', label: 'Best 4 of place 3' },
          { colour: 'blue', places: { from: 4, to: 4 }, label: '' },
          { colour: 'red', places: { from: 5, to: 6 }, label: 'Out' },
        ])
      )
    ).toEqual([]);
  });

  it('rejects a colour that is used twice', () => {
    const plan = roundRobin(undefined, [
      { colour: 'red', places: { from: 1, to: 1 }, label: '' },
      { colour: 'red', places: { from: 5, to: 5 }, label: '' },
    ]);
    expect(checkZones(plan)).toContainEqual({ code: 'repeated-colour', colour: 'red' });
  });

  it(`rejects a label longer than ${ZONE_LABEL_MAX} characters`, () => {
    const plan = roundRobin(undefined, [
      { colour: 'blue', places: { from: 1, to: 1 }, label: 'x'.repeat(25) },
    ]);
    expect(checkZones(plan)).toEqual([{ code: 'label-too-long', colour: 'blue' }]);
    const longest = roundRobin(undefined, [
      { colour: 'blue', places: { from: 1, to: 1 }, label: 'x'.repeat(24) },
    ]);
    expect(checkZones(longest)).toEqual([]);
  });

  it('rejects places on an automatic zone, and a free zone with no places', () => {
    expect(
      checkZones(
        roundRobin(2, [{ colour: 'green', places: { from: 1, to: 2 }, label: '' }])
      )
    ).toEqual([{ code: 'places-on-automatic', colour: 'green' }]);
    expect(checkZones(roundRobin(undefined, [{ colour: 'green', label: '' }]))).toEqual(
      [{ code: 'missing-places', colour: 'green' }]
    );
  });

  it('rejects a range that starts before place 1 or ends before it starts', () => {
    expect(
      checkZones(
        roundRobin(undefined, [
          { colour: 'red', places: { from: 0, to: 2 }, label: '' },
        ])
      )
    ).toEqual([{ code: 'bad-places', colour: 'red' }]);
    expect(
      checkZones(
        roundRobin(undefined, [
          { colour: 'red', places: { from: 4, to: 3 }, label: '' },
        ])
      )
    ).toEqual([{ code: 'bad-places', colour: 'red' }]);
    expect(
      checkZones(
        roundRobin(undefined, [
          { colour: 'red', places: { from: 1.5, to: 3 }, label: '' },
        ])
      )
    ).toEqual([{ code: 'bad-places', colour: 'red' }]);
  });

  it('rejects two zones that share a place, also with an automatic zone', () => {
    expect(
      checkZones(
        roundRobin(2, [{ colour: 'blue', places: { from: 2, to: 3 }, label: '' }])
      )
    ).toEqual([{ code: 'shared-place', colours: ['green', 'blue'] }]);
    expect(
      checkZones(
        roundRobin(undefined, [
          { colour: 'red', places: { from: 3, to: 5 }, label: '' },
          { colour: 'blue', places: { from: 5, to: 6 }, label: '' },
        ])
      )
    ).toEqual([{ code: 'shared-place', colours: ['red', 'blue'] }]);
  });
});

describe('getZoneColours (US-12.5, US-07.2)', () => {
  const zones = getPhaseZones(
    groups(1, 1, [{ colour: 'red', places: { from: 3, to: 3 }, label: '' }])
  );
  const tables = [
    ['a1', 'a2', 'a3'],
    ['b1', 'b2', 'b3'],
  ];

  it('gives each row the zone of its place, in each group', () => {
    expect(Object.fromEntries(getZoneColours(zones, tables))).toEqual({
      a1: 'green',
      a2: 'yellow',
      a3: 'red',
      b1: 'green',
      b2: 'yellow',
      b3: 'red',
    });
  });

  it('gives no colour to a row out of every zone', () => {
    const colours = getZoneColours(getPhaseZones(roundRobin(1)), [['x', 'y']]);
    expect(colours.get('x')).toBe('green');
    expect(colours.has('y')).toBe(false);
  });

  it('turns the best M green and clears the other yellow rows of a complete phase', () => {
    const qualifiers = new Set(['a1', 'b1', 'b2']);
    expect(Object.fromEntries(getZoneColours(zones, tables, qualifiers))).toEqual({
      a1: 'green',
      a3: 'red',
      b1: 'green',
      b2: 'green',
      b3: 'red',
    });
  });

  it('keeps a free yellow zone in a complete phase', () => {
    const free = getPhaseZones(
      roundRobin(1, [{ colour: 'yellow', places: { from: 2, to: 2 }, label: '' }])
    );
    const colours = getZoneColours(free, [['x', 'y']], new Set(['x']));
    expect(colours.get('y')).toBe('yellow');
  });
});

describe('getAutomaticZones (Task 189)', () => {
  it('gives the automatic zones with their default labels, and none for a last phase', () => {
    expect(getAutomaticZones(groups(2, 4, [{ colour: 'green', label: 'X' }]))).toEqual([
      { colour: 'green', from: 1, to: 2, label: 'Qualify', automatic: true },
      { colour: 'yellow', from: 3, to: 3, label: 'Best 4 of place 3', automatic: true },
    ]);
    expect(getAutomaticZones(roundRobin())).toEqual([]);
  });
});

describe('fitZones (Task 189 choice 4)', () => {
  it('keeps a plan with no zone list as it is', () => {
    const plan = roundRobin(2);
    expect(fitZones(plan)).toBe(plan);
  });

  it('drops the places and the label of a zone that becomes automatic', () => {
    const plan = groups(2, 1, [
      { colour: 'green', places: { from: 1, to: 1 }, label: 'Champions' },
      { colour: 'yellow', places: { from: 4, to: 4 }, label: 'Play-off' },
      { colour: 'red', places: { from: 6, to: 6 }, label: 'Out' },
    ]);
    expect(fitZones(plan).zones).toEqual([
      { colour: 'red', places: { from: 6, to: 6 }, label: 'Out' },
    ]);
  });

  it('drops an automatic label when its zone becomes free, so the free zone is off', () => {
    const plan = roundRobin(undefined, [
      { colour: 'green', label: 'Knockout' },
      { colour: 'blue', places: { from: 3, to: 3 }, label: '' },
    ]);
    expect(fitZones(plan).zones).toEqual([
      { colour: 'blue', places: { from: 3, to: 3 }, label: '' },
    ]);
  });

  it('keeps every zone that still fits', () => {
    const plan = groups(2, 4, [
      { colour: 'green', label: 'Knockout' },
      { colour: 'red', places: { from: 4, to: 4 }, label: '' },
    ]);
    expect(fitZones(plan)).toEqual(plan);
  });
});
