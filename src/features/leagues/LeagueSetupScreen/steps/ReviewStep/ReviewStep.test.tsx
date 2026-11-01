import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { ReviewStep } from './ReviewStep';
import { instance, openTestDatabase, testUuid } from '@/test/databaseRecords';

const teams = [
  instance({ slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' }),
];

describe('ReviewStep', () => {
  it('shows the league name, config summary, and selected teams', () => {
    render(
      <ReviewStep
        name="Coastal Premier"
        homeAdvantage
        points={{ win: 3, draw: 1, loss: 0 }}
        teams={teams}
        createProblem={null}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(screen.getByText('3/1/0 pts')).toBeInTheDocument();
    expect(screen.getByText('1 team')).toBeInTheDocument();
    expect(screen.getByText('FC United')).toBeInTheDocument();
  });

  it('calls onCreate when Create league is clicked', async () => {
    const onCreate = vi.fn();
    render(
      <ReviewStep
        name="Coastal Premier"
        homeAdvantage={false}
        points={{ win: 3, draw: 1, loss: 0 }}
        teams={teams}
        createProblem={null}
        onBack={vi.fn()}
        onCreate={onCreate}
      />
    );
    await userEvent.click(screen.getByText('Create league'));
    expect(onCreate).toHaveBeenCalled();
  });

  it('disables Create league when no teams are selected', () => {
    render(
      <ReviewStep
        name="Coastal Premier"
        homeAdvantage={false}
        points={{ win: 3, draw: 1, loss: 0 }}
        teams={[]}
        createProblem="The league needs at least 2 teams to start."
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('Create league')).toBeDisabled();
    expect(
      screen.getByText('The league needs at least 2 teams to start.')
    ).toBeInTheDocument();
  });

  it('does not disable Create league for a blank name: the Details step blocks it, and the screen reports a tab jump', () => {
    render(
      <ReviewStep
        name=""
        homeAdvantage={false}
        points={{ win: 3, draw: 1, loss: 0 }}
        teams={teams}
        createProblem={null}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('Create league')).toBeEnabled();
  });

  it('shows a placeholder title for a blank name', () => {
    render(
      <ReviewStep
        name="  "
        homeAdvantage={false}
        points={{ win: 3, draw: 1, loss: 0 }}
        teams={teams}
        createProblem={null}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Untitled league' })
    ).toBeInTheDocument();
  });

  it('shows the Location of each team from its Blueprint (US-09.3)', () => {
    openTestDatabase([
      {
        slug: 'fc-united',
        name: 'FC United',
        colour: '#E53935',
        tier: 'B',
        location: 'Unity',
      },
    ]);
    render(
      <ReviewStep
        name="Coastal Premier"
        homeAdvantage={false}
        points={{ win: 3, draw: 1, loss: 0 }}
        teams={[instance({ blueprintUuid: testUuid(1), name: 'FC United' })]}
        createProblem={null}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('FC United');
    expect(row).toHaveTextContent('Unity');
  });
});
