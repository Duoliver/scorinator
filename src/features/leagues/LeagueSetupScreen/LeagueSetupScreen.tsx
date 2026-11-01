import type { JSX } from 'preact';
import { Tabs, type TabItem } from '@/design-system';
import { DetailsStep } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import { PhasesStep } from '@/features/leagues/LeagueSetupScreen/steps/PhasesStep';
import { ReviewStep } from '@/features/leagues/LeagueSetupScreen/steps/ReviewStep';
import { TeamsStep } from '@/features/leagues/LeagueSetupScreen/steps/TeamsStep';
import { useLeagueSetup } from './useLeagueSetup';
import styles from './LeagueSetupScreen.module.css';

/** The four-step League Setup wizard (US-01.1). `useLeagueSetup` gives the draft,
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
          onNext={setup.goToPhases}
          ref={setup.detailsStepRef}
        />
      ),
    },
    {
      id: 'phases',
      label: '2 · Phases',
      content: (
        <PhasesStep
          phaseList={setup.phaseList}
          teamCount={setup.teams.length}
          onBack={setup.goToDetails}
          onNext={setup.goToTeams}
        />
      ),
    },
    {
      id: 'teams',
      label: '3 · Teams',
      content: (
        <TeamsStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          teams={setup.teams}
          fixedTrigrams={setup.fixedTrigrams}
          onAddTeams={setup.addTeams}
          onRemoveTeam={setup.removeTeam}
          onSwitchTeam={setup.switchTeam}
          onUpdateTeam={setup.updateTeam}
          onBack={setup.goToPhases}
          onNext={setup.goToReview}
        />
      ),
    },
    {
      id: 'review',
      label: '4 · Review',
      content: (
        <ReviewStep
          name={details.name}
          homeAdvantage={details.homeAdvantage}
          points={details.points}
          teams={setup.teams}
          plans={setup.phaseList.plans}
          phaseProblems={setup.phaseProblems}
          createProblem={setup.createProblem}
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
