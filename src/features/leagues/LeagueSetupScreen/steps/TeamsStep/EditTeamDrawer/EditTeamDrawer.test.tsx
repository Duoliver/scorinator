import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { createSeededRng } from '@/engine/rng';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import { blueprint, instance } from '@/test/databaseRecords';
import { EditTeamDrawer } from './EditTeamDrawer';
import type { EditTeamDrawerProps } from './EditTeamDrawer';

// The Instance was renamed and recoloured in the wizard: its Blueprint
// still has the first name, the first colour, and Tier B.
const team = instance({ name: 'Salt Marsh FC', colour: '#E53935', tier: 'B', ovr: 74 });
const original = blueprint({ location: 'Ashfield' });

function renderDrawer(props: Partial<EditTeamDrawerProps> = {}): {
  onSave: ReturnType<typeof vi.fn>;
} {
  const onSave = vi.fn();
  render(
    <EditTeamDrawer
      team={team}
      blueprint={original}
      fixedTrigram={undefined}
      pickedTrigram="SMU"
      otherNames={['Harborview SC']}
      otherFixedTrigrams={['HAR']}
      rng={createSeededRng(1)}
      onSave={onSave}
      onCancel={vi.fn()}
      {...props}
    />
  );
  return { onSave };
}

const field = (label: string | RegExp): HTMLElement => screen.getByLabelText(label);
const save = (): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('EditTeamDrawer (US-08.4, Task 172)', () => {
  it('has the title, and the Original state of the Blueprint, read only', () => {
    renderDrawer();
    expect(
      screen.getByRole('dialog', { name: 'Edit team for this league' })
    ).toBeInTheDocument();
    const block = screen.getByRole('region', { name: 'Original state' });
    expect(block).toHaveTextContent('Salt Marsh United');
    expect(block).toHaveTextContent('salt-marsh-united');
    expect(block).toHaveTextContent('B');
    expect(block).toHaveTextContent('Ashfield');
  });

  it('says so for a deleted Blueprint, and turns off Reset', () => {
    renderDrawer({ blueprint: undefined });
    expect(screen.getByRole('region', { name: 'Original state' })).toHaveTextContent(
      'The team was deleted from the Teams module.'
    );
    expect(screen.getByRole('button', { name: 'Reset to original' })).toBeDisabled();
  });

  it('starts from the Instance: name, colour, Tier, OVR, slug, and the trigram', () => {
    renderDrawer({ fixedTrigram: 'SMF' });
    expect(field('Team name')).toHaveValue('Salt Marsh FC');
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
    expect(field('Tier')).toHaveValue('B');
    expect(field('OVR (70 to 79)')).toHaveValue(74);
    expect(field('Slug')).toHaveValue('salt-marsh-united');
    expect(field('Slug')).toHaveAttribute('readonly');
    expect(field('Trigram (optional)')).toHaveValue('SMF');
  });

  it('shows the picked trigram as the placeholder of an empty Trigram field', () => {
    renderDrawer();
    expect(field('Trigram (optional)')).toHaveAttribute('placeholder', 'SMU');
  });

  it('rolls a new OVR from the new Tier at once, and shows the new range', async () => {
    renderDrawer();
    await userEvent.selectOptions(field('Tier'), 'S');
    const ovr = Number((field('OVR (90 to 99)') as HTMLInputElement).value);
    expect(ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.S.min);
    expect(ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.S.max);
  });

  it('saves the changes of the Instance and the fixed trigram', async () => {
    const { onSave } = renderDrawer();
    await userEvent.clear(field('Team name'));
    await userEvent.type(field('Team name'), 'Saltby Town');
    await userEvent.click(screen.getByRole('radio', { name: 'Navy' }));
    await userEvent.clear(field('OVR (70 to 79)'));
    await userEvent.type(field('OVR (70 to 79)'), '71');
    await userEvent.type(field('Trigram (optional)'), 'sbt');
    await save();
    expect(onSave).toHaveBeenCalledWith({
      name: 'Saltby Town',
      colour: '#1A237E',
      tier: 'B',
      ovr: 71,
      fixedTrigram: 'SBT',
    });
  });

  it('saves no fixed trigram for an empty field', async () => {
    const { onSave } = renderDrawer({ fixedTrigram: 'SMF' });
    await userEvent.clear(field('Trigram (optional)'));
    await save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ fixedTrigram: null })
    );
  });

  it.each([
    [
      'an OVR outside the Tier range',
      'OVR (70 to 79)',
      '80',
      'Use a whole number from 70 to 79.',
    ],
    ['a decimal OVR', 'OVR (70 to 79)', '72.5', 'Use a whole number from 70 to 79.'],
    ['a bad trigram', 'Trigram (optional)', 'AS', 'Use 3 letters or digits.'],
    [
      'a trigram another team has fixed',
      'Trigram (optional)',
      'har',
      'Another team has this trigram fixed.',
    ],
  ])('refuses %s, with the reason', async (_case, label, typed, message) => {
    const { onSave } = renderDrawer();
    await userEvent.clear(field(label));
    await userEvent.type(field(label), typed);
    await save();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('refuses the name of another team of the list, with no regard to case', async () => {
    const { onSave } = renderDrawer();
    await userEvent.clear(field('Team name'));
    await userEvent.type(field('Team name'), 'harborview sc');
    await save();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Another team of this league has this name.'
    );
  });

  it('refuses a name with no letter or number', async () => {
    const { onSave } = renderDrawer();
    await userEvent.clear(field('Team name'));
    await userEvent.type(field('Team name'), '!!!');
    await save();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a team name/i);
  });

  it('puts back the Blueprint name, colour, and Tier, rolls a new OVR, and clears the trigram', async () => {
    const { onSave } = renderDrawer({ fixedTrigram: 'SMF' });
    await userEvent.click(screen.getByRole('button', { name: 'Reset to original' }));
    expect(field('Team name')).toHaveValue('Salt Marsh United');
    expect(field('Trigram (optional)')).toHaveValue('');
    await save();
    const [changes] = onSave.mock.calls[0];
    expect(changes).toMatchObject({
      name: 'Salt Marsh United',
      colour: '#1565C0',
      tier: 'B',
      fixedTrigram: null,
    });
    expect(changes.ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.B.min);
    expect(changes.ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.B.max);
  });

  it('calls onCancel on Cancel', async () => {
    const onCancel = vi.fn();
    renderDrawer({ onCancel });
    const dialog = screen.getByRole('dialog', { name: 'Edit team for this league' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
