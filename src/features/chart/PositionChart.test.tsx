import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { LeagueWrapper, PhaseResult } from '@/domain';
import type { PhasePlan, PlanZone } from '@/engine/phases';
import {
  groupsLeague,
  roundRobinLeague,
  scheduled,
  testUuid,
} from '@/test/databaseRecords';
import { formatOrdinal } from './helpers';
import { PositionChart } from './PositionChart';

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1565C0' },
  { name: 'FC Town', colour: '#FAFAFA' },
  { name: 'FC Rangers', colour: '#6A1B9A' },
];
const TRIGRAMS = ['UNI', 'RIV', 'TOW', 'RAN'];

/** A four-team two-way round robin, with trigrams, and the results that
 * `play` gives for the fixtures of phase 1. */
function league(
  play: (wrapper: LeagueWrapper) => PhaseResult[] = () => [],
  trigrams = TRIGRAMS
): LeagueWrapper {
  const base = roundRobinLeague(TEAMS);
  const wrapper: LeagueWrapper = {
    ...base,
    teams: base.teams.map((team, i) => ({ ...team, trigram: trigrams[i] })),
  };
  const phase = scheduled(wrapper.content.phases[0]);
  return {
    ...wrapper,
    content: { ...wrapper.content, phases: [{ ...phase, results: play(wrapper) }] },
  };
}

/** Matchday 1: the first home team wins 3-0, the second home team 1-0. */
function playMatchdayOne(wrapper: LeagueWrapper): PhaseResult[] {
  const phase = scheduled(wrapper.content.phases[0]);
  return phase.fixtures
    .filter((fixture) => fixture.matchday === 1)
    .map((fixture, i) => ({
      fixtureId: fixture.id,
      home: fixture.home,
      away: fixture.away,
      homeGoals: i === 0 ? 3 : 1,
      awayGoals: 0,
    }));
}

const trigramOf = (uuid: string): string =>
  TRIGRAMS[[1, 2, 3, 4].map((n) => testUuid(n)).indexOf(uuid)];

/** The trigrams in place order after matchday 1: the big winner, the small
 * winner, the small loser, the big loser. */
function orderAfterMatchdayOne(wrapper: LeagueWrapper): string[] {
  const [big, small] = playMatchdayOne(wrapper);
  return [big.home, small.home, small.away, big.away].map(trigramOf);
}

const lineOf = (container: Element, trigram: string): HTMLElement => {
  const uuid = testUuid(TRIGRAMS.indexOf(trigram) + 1);
  const line = container.querySelector<HTMLElement>(`[data-team="${uuid}"]`);
  if (!line) throw new Error(`No line for ${trigram}`);
  return line;
};
const ends = (container: Element): string[] =>
  [...container.querySelectorAll('[data-part="end"]')].map(
    (end) => end.textContent ?? ''
  );

describe('PositionChart (Task 156, US-12.4)', () => {
  it('shows the empty text with no result yet', () => {
    render(<PositionChart league={league()} />);
    expect(
      screen.getByText('The chart shows after the first result.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('draws one line for each team, with its trigram at the end, by its last place', () => {
    const wrapper = league(playMatchdayOne);
    const { container } = render(<PositionChart league={wrapper} />);
    expect(screen.getByRole('img', { name: 'Position chart' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-team]')).toHaveLength(4);
    expect(ends(container)).toEqual(orderAfterMatchdayOne(wrapper));
  });

  it('shows the places 1 to N and each matchday of the phase on the axes', () => {
    const { container } = render(<PositionChart league={league(playMatchdayOne)} />);
    const places = [...container.querySelectorAll('[data-part="place"]')];
    expect(places.map((place) => place.textContent)).toEqual(['1', '2', '3', '4']);
    const matchdays = [...container.querySelectorAll('[data-part="matchday"]')];
    expect(matchdays.map((md) => md.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    // The matchday numbers are an HTML footer under the plot, not SVG text
    // among the team lines (Task 156 review).
    expect(container.querySelector('svg [data-part="matchday"]')).toBeNull();
    expect(screen.getByRole('img').nextElementSibling).toHaveAttribute(
      'data-part',
      'matchdays'
    );
  });

  it('has one point for each team on each matchday with a result only', () => {
    const { container } = render(<PositionChart league={league(playMatchdayOne)} />);
    expect(container.querySelectorAll('circle')).toHaveLength(4);
  });

  it('shows a hint on the hover of a point', () => {
    const wrapper = league(playMatchdayOne);
    const { container } = render(<PositionChart league={wrapper} />);
    const [leader] = orderAfterMatchdayOne(wrapper);
    const point = lineOf(container, leader).querySelector('circle');
    if (!point) throw new Error('No point');
    fireEvent.mouseEnter(point);
    expect(screen.getByRole('tooltip')).toHaveTextContent(`${leader} · MD 1 · 1st`);
    fireEvent.mouseLeave(point);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('lists each team in the legend, by its last place', () => {
    const wrapper = league(playMatchdayOne);
    render(<PositionChart league={wrapper} />);
    const legend = screen.getByRole('list', { name: 'Teams' });
    expect(
      within(legend)
        .getAllByRole('button')
        .map((button) => button.textContent?.slice(0, 3))
    ).toEqual(orderAfterMatchdayOne(wrapper));
  });

  it('makes a team stand out on focus of its legend item, and the others fade', async () => {
    const { container } = render(<PositionChart league={league(playMatchdayOne)} />);
    await userEvent.tab();
    const [first] = within(screen.getByRole('list', { name: 'Teams' })).getAllByRole(
      'button'
    );
    expect(first).toHaveFocus();
    const trigram = first.textContent?.slice(0, 3) ?? '';
    expect(lineOf(container, trigram)).toHaveAttribute('data-state', 'active');
    const others = TRIGRAMS.filter((t) => t !== trigram);
    for (const other of others) {
      expect(lineOf(container, other)).toHaveAttribute('data-state', 'faded');
    }
    // The focus leaves the legend: no team stands out.
    await userEvent.click(document.body);
    expect(lineOf(container, trigram)).not.toHaveAttribute('data-state');
  });

  it('makes a team stand out on hover of its line or its legend item', () => {
    const { container } = render(<PositionChart league={league(playMatchdayOne)} />);
    fireEvent.mouseEnter(lineOf(container, 'RIV'));
    expect(lineOf(container, 'RIV')).toHaveAttribute('data-state', 'active');
    fireEvent.mouseLeave(lineOf(container, 'RIV'));
    expect(lineOf(container, 'RIV')).not.toHaveAttribute('data-state');
    fireEvent.mouseEnter(screen.getByRole('button', { name: /FC Rangers/ }));
    expect(lineOf(container, 'RAN')).toHaveAttribute('data-state', 'active');
  });

  it('gives a light team colour a dark outline (choice 3)', () => {
    const { container } = render(<PositionChart league={league(playMatchdayOne)} />);
    expect(lineOf(container, 'TOW')).toHaveAttribute('data-outlined', 'true');
    expect(lineOf(container, 'RIV')).not.toHaveAttribute('data-outlined');
  });

  it('shows the team name for a missing trigram (choice 6)', () => {
    const { container } = render(
      <PositionChart league={league(playMatchdayOne, ['UNI', 'RIV', 'TOW', ''])} />
    );
    expect(ends(container)).toContain('FC Rangers');
  });

  it('has a Group selector in a Groups phase, and shows the teams of the chosen group', async () => {
    const drawn = groupsLeague(TEAMS, [
      [1, 2],
      [3, 4],
    ]);
    const phase = scheduled(drawn.content.phases[0]);
    const results = phase.fixtures.map((f) => ({
      fixtureId: f.id,
      home: f.home,
      away: f.away,
      homeGoals: 1,
      awayGoals: 0,
    }));
    const wrapper: LeagueWrapper = {
      ...drawn,
      content: { ...drawn.content, phases: [{ ...phase, results }] },
    };
    const { container } = render(<PositionChart league={wrapper} />);
    expect(screen.getByLabelText('Group')).toHaveValue('0');
    expect(
      [...container.querySelectorAll('[data-team]')].map((g) =>
        g.getAttribute('data-team')
      )
    ).toEqual(expect.arrayContaining([testUuid(1), testUuid(2)]));
    expect(container.querySelectorAll('[data-team]')).toHaveLength(2);

    await userEvent.selectOptions(screen.getByLabelText('Group'), '1');
    expect(container.querySelector(`[data-team="${testUuid(3)}"]`)).not.toBeNull();
    expect(container.querySelector(`[data-team="${testUuid(1)}"]`)).toBeNull();
  });
});

describe('PositionChart: zones (Task 190, US-12.5)', () => {
  /** The league after matchday 1, with these zones on its one plan. */
  const zoned = (zones: PlanZone[]): LeagueWrapper => {
    const wrapper = league(playMatchdayOne);
    const plans: PhasePlan[] = [{ format: 'round-robin', legs: 'two-way', zones }];
    return { ...wrapper, content: { ...wrapper.content, plans } };
  };
  const bands = (container: Element): (string | null)[] =>
    [...container.querySelectorAll('[data-part="band"]')].map((band) =>
      band.getAttribute('data-zone')
    );
  const placeZones = (container: Element): (string | null)[] =>
    [...container.querySelectorAll('[data-part="place"]')].map((place) =>
      place.getAttribute('data-zone')
    );

  it('draws a band for each zone, behind the team lines', () => {
    const { container } = render(
      <PositionChart
        league={zoned([
          { colour: 'red', places: { from: 3, to: 4 }, label: 'Out' },
          { colour: 'blue', places: { from: 1, to: 1 }, label: '' },
        ])}
      />
    );
    expect(bands(container)).toEqual(['blue', 'red']);
    const band = container.querySelector('[data-part="band"]');
    const line = container.querySelector('[data-team]');
    if (!band || !line) throw new Error('No band or line');
    expect(
      band.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('gives the place numbers of a zone its tone', () => {
    const { container } = render(
      <PositionChart
        league={zoned([
          { colour: 'red', places: { from: 3, to: 4 }, label: 'Out' },
          { colour: 'blue', places: { from: 1, to: 1 }, label: '' },
        ])}
      />
    );
    expect(placeZones(container)).toEqual(['blue', null, 'red', 'red']);
  });

  it('shows the zone legend under the chart', () => {
    render(
      <PositionChart
        league={zoned([
          { colour: 'red', places: { from: 3, to: 4 }, label: 'Out' },
          { colour: 'blue', places: { from: 1, to: 1 }, label: '' },
        ])}
      />
    );
    const legend = screen.getByRole('list', { name: 'Zones' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Place 1', 'Out']);
  });

  it('leaves out a zone below the last place, and cuts a zone at the last place', () => {
    const { container } = render(
      <PositionChart
        league={zoned([
          { colour: 'red', places: { from: 18, to: 20 }, label: '' },
          { colour: 'blue', places: { from: 3, to: 10 }, label: '' },
        ])}
      />
    );
    expect(bands(container)).toEqual(['blue']);
    expect(placeZones(container)).toEqual([null, null, 'blue', 'blue']);
    expect(screen.getByRole('list', { name: 'Zones' })).toHaveTextContent(
      'Places 3–10'
    );
    expect(screen.getByRole('list', { name: 'Zones' })).not.toHaveTextContent('18');
  });

  it('shows no zone and no zone legend with no zones', () => {
    const { container } = render(<PositionChart league={league(playMatchdayOne)} />);
    expect(bands(container)).toEqual([]);
    expect(screen.queryByRole('list', { name: 'Zones' })).not.toBeInTheDocument();
  });

  it('keeps the yellow band of a complete Groups phase (choice 1)', () => {
    const SIX = [
      ...TEAMS,
      { name: 'FC Dunes', colour: '#00838F' },
      { name: 'FC Vale', colour: '#2E7D32' },
    ];
    const drawn = groupsLeague(
      SIX,
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      [
        {
          format: 'groups',
          legs: 'two-way',
          grouping: { by: 'count', count: 2 },
          advance: { top: 1, bestOfNext: 1 },
        },
        { format: 'bracket' },
      ]
    );
    const phase = scheduled(drawn.content.phases[0]);
    const results = phase.fixtures.map((f) => ({
      fixtureId: f.id,
      home: f.home,
      away: f.away,
      homeGoals: 1,
      awayGoals: 0,
    }));
    const complete: LeagueWrapper = {
      ...drawn,
      content: { ...drawn.content, phases: [{ ...phase, results }] },
    };
    const { container } = render(<PositionChart league={complete} />);
    expect(bands(container)).toEqual(['green', 'yellow']);
    expect(screen.getByRole('list', { name: 'Zones' })).toHaveTextContent(
      'Best 1 of place 2'
    );
  });
});

describe('formatOrdinal (choice 8)', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
  ])('gives %i as %s', (place, text) => {
    expect(formatOrdinal(place)).toBe(text);
  });
});
