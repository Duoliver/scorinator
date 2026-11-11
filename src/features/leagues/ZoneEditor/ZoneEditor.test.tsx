import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { GroupsPlan, PlanZone, RoundRobinPlan } from '@/engine/phases';
import { ZoneEditor } from './ZoneEditor';

const groupsBestM: GroupsPlan = {
  format: 'groups',
  legs: 'two-way',
  grouping: { by: 'size', size: 4 },
  advance: { top: 2, bestOfNext: 4 },
};
const lastRoundRobin: RoundRobinPlan = { format: 'round-robin', legs: 'two-way' };

const row = (name: string): HTMLElement =>
  screen.getByRole('group', { name: `${name} zone` });
const lastZones = (onChange: ReturnType<typeof vi.fn>): PlanZone[] =>
  onChange.mock.calls[onChange.mock.calls.length - 1][0];

describe('ZoneEditor (Task 189, US-12.5)', () => {
  it('has one row for each colour, in the order green, blue, yellow, red', () => {
    render(<ZoneEditor plan={lastRoundRobin} onChange={vi.fn()} />);
    expect(
      screen
        .getAllByRole('group', { name: / zone$/ })
        .map((g) => g.getAttribute('aria-label'))
    ).toEqual(['Green zone', 'Blue zone', 'Yellow zone', 'Red zone']);
  });

  it('shows an automatic zone with its places as text, always on, with its label', () => {
    render(<ZoneEditor plan={groupsBestM} onChange={vi.fn()} />);
    expect(
      within(row('Green')).getByText('Places 1–2 · from the advancement')
    ).toBeInTheDocument();
    expect(within(row('Green')).queryByRole('switch')).not.toBeInTheDocument();
    expect(within(row('Green')).getByLabelText('Label')).toHaveValue('Qualify');
    expect(
      within(row('Yellow')).getByText('Place 3 · from the advancement')
    ).toBeInTheDocument();
    expect(within(row('Yellow')).getByLabelText('Label')).toHaveValue(
      'Best 4 of place 3'
    );
  });

  it('shows a free zone that is off with only its switch', () => {
    render(<ZoneEditor plan={lastRoundRobin} onChange={vi.fn()} />);
    expect(within(row('Blue')).getByRole('switch', { name: 'Blue' })).not.toBeChecked();
    expect(within(row('Blue')).queryByLabelText('From')).not.toBeInTheDocument();
  });

  it('gives a free zone when it is on, with its places and label', async () => {
    const onChange = vi.fn();
    render(<ZoneEditor plan={lastRoundRobin} onChange={onChange} />);
    await userEvent.click(within(row('Red')).getByRole('switch', { name: 'Red' }));
    await userEvent.type(within(row('Red')).getByLabelText('From'), '18');
    await userEvent.type(within(row('Red')).getByLabelText('To'), '20');
    await userEvent.type(within(row('Red')).getByLabelText('Label'), 'Relegation');
    expect(lastZones(onChange)).toEqual([
      { colour: 'red', places: { from: 18, to: 20 }, label: 'Relegation' },
    ]);
    await userEvent.click(within(row('Red')).getByRole('switch', { name: 'Red' }));
    expect(lastZones(onChange)).toEqual([]);
  });

  it('stores an automatic zone only when its label is not the default (choice 3)', async () => {
    const onChange = vi.fn();
    render(<ZoneEditor plan={groupsBestM} onChange={onChange} />);
    const label = within(row('Green')).getByLabelText('Label');
    await userEvent.clear(label);
    await userEvent.type(label, 'Knockout');
    expect(lastZones(onChange)).toEqual([{ colour: 'green', label: 'Knockout' }]);
    await userEvent.clear(label);
    await userEvent.type(label, 'Qualify');
    expect(lastZones(onChange)).toEqual([]);
  });

  it('starts from the stored zones of the plan', () => {
    const plan: GroupsPlan = {
      ...groupsBestM,
      zones: [
        { colour: 'green', label: '' },
        { colour: 'red', places: { from: 4, to: 4 }, label: 'Out' },
      ],
    };
    render(<ZoneEditor plan={plan} onChange={vi.fn()} />);
    expect(within(row('Green')).getByLabelText('Label')).toHaveValue('');
    expect(within(row('Red')).getByRole('switch', { name: 'Red' })).toBeChecked();
    expect(within(row('Red')).getByLabelText('From')).toHaveValue(4);
    expect(within(row('Red')).getByLabelText('Label')).toHaveValue('Out');
  });

  it('shows each zone problem under the rows', async () => {
    render(<ZoneEditor plan={groupsBestM} onChange={vi.fn()} />);
    await userEvent.click(within(row('Blue')).getByRole('switch', { name: 'Blue' }));
    expect(
      screen.getByText(
        'The blue zone needs whole places from 1, with "To" not before "From".'
      )
    ).toBeInTheDocument();
    await userEvent.type(within(row('Blue')).getByLabelText('From'), '2');
    await userEvent.type(within(row('Blue')).getByLabelText('To'), '2');
    expect(
      screen.getByText('The green zone and the blue zone share a place.')
    ).toBeInTheDocument();
    await userEvent.type(within(row('Blue')).getByLabelText('Label'), 'x'.repeat(25));
    expect(
      screen.getByText('The blue zone label is longer than 24 characters.')
    ).toBeInTheDocument();
  });

  it('makes From and To number fields from place 1, and the Up arrow changes the zone (Task 191)', async () => {
    const onChange = vi.fn();
    render(<ZoneEditor plan={lastRoundRobin} onChange={onChange} />);
    await userEvent.click(within(row('Red')).getByRole('switch', { name: 'Red' }));
    for (const name of ['From', 'To']) {
      const field = within(row('Red')).getByLabelText(name);
      expect(field).toHaveAttribute('type', 'number');
      expect(field).toHaveAttribute('min', '1');
      expect(field).not.toHaveAttribute('max');
    }
    const from = within(row('Red')).getByLabelText('From') as HTMLInputElement;
    const to = within(row('Red')).getByLabelText('To') as HTMLInputElement;
    // What the browser does on the Up arrow of an empty number field.
    from.stepUp();
    fireEvent.input(from);
    to.stepUp();
    fireEvent.input(to);
    expect(lastZones(onChange)).toEqual([
      { colour: 'red', places: { from: 1, to: 1 }, label: '' },
    ]);
  });
});
