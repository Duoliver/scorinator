import { useRef, useState } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import type { TeamFields } from '@/domain';
import { formatTeamCount } from '@/features/components';
import { settingsChipLabels } from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import { formatLeagueName } from '@/features/leagues/leagueSummary';
import { addTeamBlueprint } from '@/app/state/teamBlueprintActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { filterTeamsByName, getTeamsStepColumns } from './helpers';
import type TeamsStepProps from './types';
import type { TeamsStepState } from './types';

export function useTeamsStep({
  name,
  homeAdvantage,
  points,
  selectedSlugs,
  onToggleTeam,
  onSelectAll,
  onClearSelection,
  onTeamCreated,
}: Omit<TeamsStepProps, 'onBack' | 'onNext'>): TeamsStepState {
  const teams = useDatabaseStore((state) => state.blueprints);
  const [query, setQuery] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const checkboxHandles = useRef(new Map<string, FieldHandle<boolean>>());

  const visibleTeams = filterTeamsByName(teams, query);
  const visibleSlugs = visibleTeams.map((team) => team.slug);
  const allVisibleSelected =
    visibleSlugs.length > 0 &&
    visibleSlugs.every((slug) => selectedSlugs.includes(slug));

  const setVisibleChecked = (checked: boolean): void => {
    visibleSlugs.forEach((slug) =>
      checkboxHandles.current.get(slug)?.setValue(checked)
    );
  };

  const handleSelectionButton = (): void => {
    if (allVisibleSelected) {
      onClearSelection(visibleSlugs);
      setVisibleChecked(false);
    } else {
      onSelectAll(visibleSlugs);
      setVisibleChecked(true);
    }
  };

  const registerCheckbox =
    (slug: string) =>
    (handle: FieldHandle<boolean> | null): void => {
      if (handle) checkboxHandles.current.set(slug, handle);
      else checkboxHandles.current.delete(slug);
    };

  // The Blueprint gets a unique slug (Task 75), which can differ from the
  // form preview, so the selection takes the slug of the new Blueprint.
  const handleTeamCreated = ({ name, colour, tier }: TeamFields): void => {
    const created = addTeamBlueprint({ name, colour, tier });
    onTeamCreated(created.slug);
    setShowCreateTeam(false);
  };

  return {
    leagueName: formatLeagueName(name),
    chipLabels: settingsChipLabels(homeAdvantage, points),
    handleSearchChange: setQuery,
    rows: visibleTeams,
    columns: getTeamsStepColumns(selectedSlugs, onToggleTeam, registerCheckbox),
    selectedCountText: `${formatTeamCount(selectedSlugs.length)} selected`,
    allVisibleSelected,
    hasVisibleTeams: visibleSlugs.length > 0,
    handleSelectionButton,
    canGoNext: selectedSlugs.length > 0,
    showCreateTeam,
    openCreateTeam: () => setShowCreateTeam(true),
    closeCreateTeam: () => setShowCreateTeam(false),
    handleTeamCreated,
  };
}
