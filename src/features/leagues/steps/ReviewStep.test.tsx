import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { ReviewStep } from './ReviewStep';

const selectedTeams = [
  { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' as const },
];

describe('ReviewStep', () => {
  it('shows the league name, config summary, and selected teams', () => {
    render(
      <ReviewStep
        name="Coastal Premier"
        homeAdvantage
        points={{ win: 3, draw: 1, loss: 0 }}
        selectedTeams={selectedTeams}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(screen.getByText('3/1/0 pts')).toBeInTheDocument();
    expect(screen.getByText('1 teams')).toBeInTheDocument();
    expect(screen.getByText('FC United')).toBeInTheDocument();
  });

  it('calls onCreate when Create league is clicked', async () => {
    const onCreate = vi.fn();
    render(
      <ReviewStep
        name="Coastal Premier"
        homeAdvantage={false}
        points={{ win: 3, draw: 1, loss: 0 }}
        selectedTeams={selectedTeams}
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
        selectedTeams={[]}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText('Create league')).toBeDisabled();
  });
});
