import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamForm } from './TeamForm';
import { DEFAULT_TEAM_COLOUR, TEAM_PALETTE } from '@/design-system';
import type { TeamFields } from '@/domain';

const LOCATION = 'Location (optional)';
const TRIGRAMS = 'Trigrams (optional)';

function renderCreate(onSave = vi.fn(), takenSlugs: string[] = []): void {
  render(
    <TeamForm
      saveLabel="Create team"
      takenSlugs={takenSlugs}
      onCancel={vi.fn()}
      onSave={onSave}
    />
  );
}

describe('TeamForm', () => {
  it('renders the given save label and every field', () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Create team')).toBeInTheDocument();
    expect(screen.getByLabelText('Team name')).toBeInTheDocument();
    expect(screen.getByLabelText('Slug (auto-generated)')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Colour' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tier')).toBeInTheDocument();
  });

  it('shows one swatch for each palette colour', () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(TEAM_PALETTE.length);
  });

  it('selects the default colour for a new team', () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    const defaultName = TEAM_PALETTE.find(
      ({ hex }) => hex === DEFAULT_TEAM_COLOUR
    )?.name;
    expect(screen.getByRole('radio', { name: defaultName })).toBeChecked();
  });

  it('auto-fills the slug as the user types a name', async () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'Salt Marsh United');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue(
      'salt-marsh-united'
    );
  });

  it('pre-fills every field from `initial` when editing', () => {
    const initial: TeamFields = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '#E53935',
      tier: 'B',
      location: 'Unity',
      trigrams: ['FCU', 'UNI'],
    };
    render(
      <TeamForm
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Team name')).toHaveValue('FC United');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue('fc-united');
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
    expect(screen.getByLabelText('Tier')).toHaveValue('B');
    expect(screen.getByLabelText('Location (optional)')).toHaveValue('Unity');
    expect(screen.getByLabelText('Trigrams (optional)')).toHaveValue('FCU UNI');
  });

  it('clears the slug for a name with no letter or number', async () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'FC');
    await userEvent.clear(screen.getByLabelText('Team name'));
    await userEvent.type(screen.getByLabelText('Team name'), '!!!');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue('');
  });

  it('calls onSave with the assembled record on Save', async () => {
    const onSave = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByRole('radio', { name: 'Gold' }));
    await userEvent.selectOptions(screen.getByLabelText('Tier'), 'A');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith({
      slug: 'harborview-sc',
      name: 'Harborview SC',
      // Read from the palette, so a palette change needs no test change.
      colour: TEAM_PALETTE.find((entry) => entry.name === 'Gold')?.hex,
      tier: 'A',
      location: '',
      trigrams: [],
    });
  });

  it('saves the default colour when the user picks none', async () => {
    const onSave = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ colour: DEFAULT_TEAM_COLOUR })
    );
  });

  it('keeps a colour that is not in the palette when the user picks none', async () => {
    const onSave = vi.fn();
    const initial: TeamFields = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '#123456',
      tier: 'B',
      location: '',
      trigrams: [],
    };
    render(
      <TeamForm
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={onSave}
      />
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
    }
    await userEvent.click(screen.getByText('Save changes'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ colour: '#123456' }));
  });

  it('keeps an empty colour from an import when the user picks none', async () => {
    const onSave = vi.fn();
    const initial: TeamFields = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '',
      tier: 'B',
      location: '',
      trigrams: [],
    };
    render(
      <TeamForm
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={onSave}
      />
    );
    await userEvent.click(screen.getByText('Save changes'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ colour: '' }));
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={onCancel} onSave={vi.fn()} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a validation error and does not save when the name is blank', async () => {
    const onSave = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a team name/i)).toBeInTheDocument();
  });

  it('removes the validation error after a valid save', async () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    await userEvent.click(screen.getByText('Create team'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByText('Create team'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('TeamForm, the Location and Trigrams fields (Task 119)', () => {
  it('shows the fields in order: name, slug, location, trigrams, colour, tier', () => {
    renderCreate();
    const fields = [
      screen.getByLabelText('Team name'),
      screen.getByLabelText('Slug (auto-generated)'),
      screen.getByLabelText(LOCATION),
      screen.getByLabelText(TRIGRAMS),
      screen.getByRole('radiogroup', { name: 'Colour' }),
      screen.getByLabelText('Tier'),
    ];
    for (let i = 0; i < fields.length - 1; i++) {
      expect(
        fields[i].compareDocumentPosition(fields[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it('saves the trimmed location and the trigrams in upper case', async () => {
    const onSave = vi.fn();
    renderCreate(onSave);
    await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield Rovers');
    await userEvent.type(screen.getByLabelText(LOCATION), '  Ashfield  ');
    await userEvent.type(screen.getByLabelText(TRIGRAMS), 'ash  AFC ');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Ashfield', trigrams: ['ASH', 'AFC'] })
    );
  });

  it('saves a location of 40 characters', async () => {
    const onSave = vi.fn();
    renderCreate(onSave);
    await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield Rovers');
    await userEvent.type(screen.getByLabelText(LOCATION), 'x'.repeat(40));
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'x'.repeat(40) })
    );
  });

  it('shows an error and saves nothing for a location over 40 characters', async () => {
    const onSave = vi.fn();
    renderCreate(onSave);
    await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield Rovers');
    await userEvent.type(screen.getByLabelText(LOCATION), 'x'.repeat(41));
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Use 40 characters at most.');
  });

  it.each([
    ['ASH AS', '"AS" is not a trigram. Use 3 letters or digits.'],
    ['ASH afc ash', '"ASH" is in the list twice.'],
    ['AAA BBB CCC DDD EEE FFF', 'Use 5 trigrams at most.'],
  ])(
    'shows an error and saves nothing for the trigrams "%s"',
    async (typed, message) => {
      const onSave = vi.fn();
      renderCreate(onSave);
      await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield Rovers');
      await userEvent.type(screen.getByLabelText(TRIGRAMS), typed);
      await userEvent.click(screen.getByText('Create team'));
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(message);
    }
  );

  it('shows the trigram made from the name as the placeholder, as the user types', async () => {
    renderCreate();
    expect(screen.getByLabelText(TRIGRAMS)).toHaveAttribute(
      'placeholder',
      'e.g. ASH AFC'
    );
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    expect(screen.getByLabelText(TRIGRAMS)).toHaveAttribute('placeholder', 'HAR');
  });

  it('keeps the typed values when the placeholder changes', async () => {
    renderCreate();
    await userEvent.type(screen.getByLabelText(LOCATION), 'Harborview');
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    expect(screen.getByLabelText(LOCATION)).toHaveValue('Harborview');
    expect(screen.getByLabelText('Team name')).toHaveValue('Harborview SC');
  });
});

describe('TeamForm, the slug (US-09.5, Task 75)', () => {
  it('previews the slug with the -2 rule for a new team', async () => {
    renderCreate(vi.fn(), ['ashfield', 'ashfield-2']);
    await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue('ashfield-3');
  });

  it('keeps the slug of an edited team when the name changes', async () => {
    render(
      <TeamForm
        saveLabel="Save changes"
        initial={{
          slug: 'ashfield',
          name: 'Ashfield',
          colour: '#E53935',
          tier: 'B',
          location: '',
          trigrams: [],
        }}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    await userEvent.type(screen.getByLabelText('Team name'), ' Rovers');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue('ashfield');
  });
});
