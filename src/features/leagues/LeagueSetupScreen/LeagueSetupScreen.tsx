import type { JSX } from 'preact';
import { Tabs, type TabItem } from '@/design-system';
import { DetailsStep } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import { ReviewStep } from '@/features/leagues/LeagueSetupScreen/steps/ReviewStep';
import { TeamsStep } from '@/features/leagues/LeagueSetupScreen/steps/TeamsStep';
import { useLeagueSetup } from './useLeagueSetup';
import styles from './LeagueSetupScreen.module.css';

/** The three-step League Setup wizard. `useLeagueSetup` gives the draft,
 * the step changes, and the create. */
export function LeagueSetupScreen(): JSX.Element {
  const setup = useLeagueSetup();
  const { details } = setup;

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: '1 · Details',
      content: (
        <DetailsStep
          initial={details}
          takenSlugs={setup.takenSlugs}
          onNext={setup.goToTeams}
          ref={setup.detailsStepRef}
        />
      ),
    },
    {
      id: 'teams',
      label: '2 · Teams',
      content: (
        <TeamsStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          selectedSlugs={setup.selectedSlugs}
          onToggleTeam={setup.toggleTeam}
          onSelectAll={setup.selectAllTeams}
          onClearSelection={setup.clearSelection}
          onTeamCreated={setup.selectTeam}
          onBack={setup.goToDetails}
          onNext={setup.goToReview}
        />
      ),
    },
    {
      id: 'review',
      label: '3 · Review',
      content: (
        <ReviewStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          selectedTeams={setup.selectedTeams}
          onBack={setup.goToTeams}
          onCreate={setup.handleCreate}
        />
      ),
    },
  ];

  return (
    <div class={styles.screen}>
      <h1>League Setup</h1>

      <Tabs
        tabs={tabs}
        defaultTab={setup.step}
        onChange={setup.handleTabChange}
        ref={setup.stepsRef}
        fullWidth
        scrollToTopOnChange
      />

      {setup.status && <span class={styles.status}>{setup.status}</span>}
    </div>
  );
}
LeagueSetupScreen.displayName = 'LeagueSetupScreen';
