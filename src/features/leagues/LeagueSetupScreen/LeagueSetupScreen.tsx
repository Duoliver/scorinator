import type { JSX } from 'preact';
import { Breadcrumbs, Tabs, type TabItem } from '@/design-system';
import { ROUTES, seasonDetailPath } from '@/app/routes';
import { DetailsStep } from '@/features/leagues/LeagueSetupScreen/steps/DetailsStep';
import { PhasesStep } from '@/features/leagues/LeagueSetupScreen/steps/PhasesStep';
import { ReviewStep } from '@/features/leagues/LeagueSetupScreen/steps/ReviewStep';
import { TeamsStep } from '@/features/leagues/LeagueSetupScreen/steps/TeamsStep';
import type LeagueSetupScreenProps from './types';
import type { WizardSeasonState } from './types';
import { useLeagueSetup } from './useLeagueSetup';
import { useWizardSeason } from './useWizardSeason';
import styles from './LeagueSetupScreen.module.css';

export type { LeagueSetupScreenProps };

/** The text of a Season that gets no wizard, or `null` when it gets one. */
function seasonNotice(state: WizardSeasonState): string | null {
  switch (state.kind) {
    case 'opening':
      return 'Opening the Season…';
    case 'not-found':
      return 'Season not found.';
    case 'error':
      return `The Season could not open: ${state.message}`;
    case 'finished':
      return `${state.label} is finished. Reopen it to add a league.`;
    default:
      return null;
  }
}

/** The four-step League Setup wizard (US-01.1). `useLeagueSetup` gives the draft,
 * the step changes, and the create. With a `seasonUuid`, the wizard makes a
 * league in that Season, under its breadcrumbs (US-13.5, Task 218). */
export function LeagueSetupScreen({ seasonUuid }: LeagueSetupScreenProps): JSX.Element {
  const seasonState = useWizardSeason(seasonUuid);
  const season = seasonState.kind === 'open' ? seasonState.season : undefined;
  const setup = useLeagueSetup(seasonUuid, season);
  const { details } = setup;
  const notice = seasonNotice(seasonState);
  const crumbs = seasonUuid !== undefined && (
    <Breadcrumbs
      items={[
        { label: 'Seasons', href: ROUTES.seasons },
        ...(seasonState.kind === 'open' || seasonState.kind === 'finished'
          ? [{ label: seasonState.label, href: seasonDetailPath(seasonUuid) }]
          : []),
        { label: 'New league' },
      ]}
    />
  );

  if (notice !== null) {
    return (
      <div class={styles.screen}>
        {crumbs}
        <p role={seasonState.kind === 'opening' ? 'status' : 'alert'}>{notice}</p>
      </div>
    );
  }

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
          firstGroupSizes={setup.groups?.map((group) => group.length)}
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
          groups={setup.groups}
          groupsAdvanceText={setup.groupsAdvanceText}
          bracketWarning={setup.bracketWarning}
          onShuffleGroups={setup.shuffleGroups}
          onMoveTeam={setup.moveTeam}
          season={setup.seasonRows}
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
          teams={setup.seasonRows?.rows ?? setup.teams}
          plans={setup.phaseList.plans}
          bracketQualifiers={setup.bracketQualifiers}
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
      {season ? (
        <div class={styles.header}>
          {crumbs}
          <h1>New league in {season.content.name}</h1>
          <p class={styles.meta}>
            The league uses the Season teams. A team that is not in the Season joins it
            when you create the league.
          </p>
        </div>
      ) : (
        <h1>League Setup</h1>
      )}

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
