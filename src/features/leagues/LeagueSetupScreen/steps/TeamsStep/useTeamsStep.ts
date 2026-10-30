import { useState } from 'preact/hooks';
import type { TeamFields } from '@/domain';
import { getErrorMessage } from '@/app/getErrorMessage';
import { importSlugListTxt } from '@/app/data/slugListTxt';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { setFileStatus } from '@/app/state/fileActions';
import { addTeamBlueprint } from '@/app/state/teamBlueprintActions';
import { planSlugListImport } from '@/app/state/teamInstances';
import { formatTeamCount } from '@/features/components';
import { settingsChipLabels } from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import { useBlueprintLocation } from '@/features/leagues/LeagueSetupScreen/useBlueprintLocation';
import { formatLeagueName } from '@/features/leagues/leagueSummary';
import type TeamsStepProps from './types';
import type { TeamsStepOverlay, TeamsStepState } from './types';
import {
  NO_SLUGS,
  describeSlugListImport,
  getTeamsStepColumns,
  pickerConfirmLabel,
  toPickerItem,
} from './helpers';

/** The Teams step (Task 120): the team list, the add dialog, "Load them
 * all", the empty states, and "Import slug list". An available Blueprint
 * has no Instance in the list. */
export function useTeamsStep({
  name,
  homeAdvantage,
  points,
  teams,
  onAddTeams,
  onRemoveTeam,
}: Omit<TeamsStepProps, 'onBack' | 'onNext'>): TeamsStepState {
  const blueprints = useDatabaseStore((state) => state.blueprints);
  const locationOf = useBlueprintLocation();
  const [overlay, setOverlay] = useState<TeamsStepOverlay>('none');
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [notFound, setNotFound] = useState<string[] | null>(null);

  const inList = new Set(teams.map((team) => team.blueprintUuid));
  const available = blueprints.filter((blueprint) => !inList.has(blueprint.uuid));

  const closePicker = (): void => {
    setPickerSelected([]);
    setOverlay('none');
  };

  const confirmPicker = (): void => {
    const byUuid = new Map(blueprints.map((b) => [b.uuid, b]));
    onAddTeams(pickerSelected.flatMap((uuid) => byUuid.get(uuid) ?? []));
    closePicker();
  };

  // A team made over the add dialog joins its selection. A team made from
  // the empty state joins the list at once (US-08.1, US-08.3).
  const handleTeamCreated = ({
    name: teamName,
    colour,
    tier,
    location,
    trigrams,
  }: TeamFields): void => {
    const created = addTeamBlueprint({
      name: teamName,
      colour,
      tier,
      location,
      trigrams,
    });
    if (overlay === 'pickerTeam') {
      setPickerSelected((current) => [...current, created.uuid]);
      setOverlay('picker');
    } else {
      onAddTeams([created]);
      setOverlay('none');
    }
  };

  const importSlugList = async (): Promise<void> => {
    try {
      const slugs = await importSlugListTxt();
      if (slugs === null) return;
      if (slugs.length === 0) {
        setFileStatus({ tone: 'error', message: NO_SLUGS });
        return;
      }
      const plan = planSlugListImport(slugs, blueprints, teams);
      onAddTeams(plan.add);
      setFileStatus({
        tone: 'info',
        message: describeSlugListImport(plan.add.length, plan.alreadyInList),
      });
      setNotFound(plan.notFound.length > 0 ? plan.notFound : null);
    } catch (error) {
      setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    }
  };

  return {
    leagueName: formatLeagueName(name),
    chipLabels: settingsChipLabels(homeAdvantage, points),
    hasNoBlueprints: blueprints.length === 0,
    columns: getTeamsStepColumns(locationOf, onRemoveTeam),
    countText: formatTeamCount(teams.length),
    canLoadAll: available.length > 0,
    canGoNext: teams.length > 0,
    notFound,
    closeNotFound: () => setNotFound(null),
    overlay,
    pickerItems: available.map(toPickerItem),
    pickerSelected,
    setPickerSelected,
    pickerConfirmLabel: pickerConfirmLabel(pickerSelected.length),
    takenSlugs: blueprints.map((blueprint) => blueprint.slug),
    openPicker: () => setOverlay('picker'),
    closePicker,
    confirmPicker,
    openFirstTeam: () => setOverlay('firstTeam'),
    openPickerTeam: () => setOverlay('pickerTeam'),
    closeTeamDrawer: () => setOverlay(overlay === 'pickerTeam' ? 'picker' : 'none'),
    handleTeamCreated,
    loadAll: () => onAddTeams(available),
    importSlugList,
  };
}
