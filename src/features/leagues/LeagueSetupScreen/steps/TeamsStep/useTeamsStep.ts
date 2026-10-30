import { useState } from 'preact/hooks';
import type { TeamFields } from '@/domain';
import type { TeamInstanceEdit } from './EditTeamDrawer';
import { getErrorMessage } from '@/app/getErrorMessage';
import { importSlugListTxt } from '@/app/data/slugListTxt';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { setFileStatus } from '@/app/state/fileActions';
import { addTeamBlueprint } from '@/app/state/teamBlueprintActions';
import {
  pickTeamTrigrams,
  planSlugListImport,
  teamListProblem,
} from '@/app/state/teamInstances';
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
  toCurrentItem,
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
  fixedTrigrams,
  onAddTeams,
  onRemoveTeam,
  onSwitchTeam,
  onUpdateTeam,
}: Omit<TeamsStepProps, 'onBack' | 'onNext'>): TeamsStepState {
  const blueprints = useDatabaseStore((state) => state.blueprints);
  const locationOf = useBlueprintLocation();
  const [overlay, setOverlay] = useState<TeamsStepOverlay>('none');
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [notFound, setNotFound] = useState<string[] | null>(null);
  // The team that the Switch dialog replaces (US-08.5).
  const [switchUuid, setSwitchUuid] = useState<string | null>(null);
  // The team that the Edit drawer changes (US-08.4).
  const [editUuid, setEditUuid] = useState<string | null>(null);

  const inList = new Set(teams.map((team) => team.blueprintUuid));
  const available = blueprints.filter((blueprint) => !inList.has(blueprint.uuid));
  // The live pick runs again on each render, so after each add, Switch,
  // Remove, or Edit (US-09.6).
  const picks = pickTeamTrigrams(teams, blueprints, fixedTrigrams);
  const switched = teams.find((team) => team.blueprintUuid === switchUuid);

  const edited =
    overlay === 'edit' ? teams.find((t) => t.blueprintUuid === editUuid) : undefined;
  const closeEdit = (): void => {
    setEditUuid(null);
    setOverlay('none');
  };
  const editDrawer = edited
    ? {
        team: edited,
        blueprint: blueprints.find((b) => b.uuid === edited.blueprintUuid),
        fixedTrigram: fixedTrigrams[edited.blueprintUuid],
        pickedTrigram: picks.get(edited.blueprintUuid)?.trigram ?? '',
        otherNames: teams.filter((t) => t !== edited).map((t) => t.name),
        otherFixedTrigrams: Object.entries(fixedTrigrams)
          .filter(([uuid]) => uuid !== edited.blueprintUuid)
          .map(([, trigram]) => trigram),
        onSave: (edit: TeamInstanceEdit): void => {
          onUpdateTeam(edited.blueprintUuid, edit);
          closeEdit();
        },
        onCancel: closeEdit,
      }
    : null;

  const openSwitch = (blueprintUuid: string): void => {
    setSwitchUuid(blueprintUuid);
    setOverlay('switch');
  };

  const closeSwitch = (): void => {
    setSwitchUuid(null);
    setOverlay('none');
  };

  const pickSwitch = (blueprintUuid: string): void => {
    const replacement = blueprints.find((b) => b.uuid === blueprintUuid);
    if (switchUuid !== null && replacement) onSwitchTeam(switchUuid, replacement);
    closeSwitch();
  };

  const closePicker = (): void => {
    setPickerSelected([]);
    setOverlay('none');
  };

  const confirmPicker = (): void => {
    const byUuid = new Map(blueprints.map((b) => [b.uuid, b]));
    onAddTeams(pickerSelected.flatMap((uuid) => byUuid.get(uuid) ?? []));
    closePicker();
  };

  // A team made over the add dialog joins its selection. A team made over
  // the Switch dialog replaces the team. A team made from the empty state
  // joins the list at once (US-08.1, US-08.3, US-08.5).
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
    if (overlay === 'switchTeam') {
      if (switchUuid !== null) onSwitchTeam(switchUuid, created);
      closeSwitch();
    } else if (overlay === 'pickerTeam') {
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
    columns: getTeamsStepColumns(
      locationOf,
      (uuid) => picks.get(uuid),
      (uuid) => {
        setEditUuid(uuid);
        setOverlay('edit');
      },
      openSwitch,
      onRemoveTeam
    ),
    countText: formatTeamCount(teams.length),
    canLoadAll: available.length > 0,
    canGoNext: teams.length > 0,
    warning: teams.length > 0 ? teamListProblem(teams) : null,
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
    switchCurrent:
      switched && toCurrentItem(switched, locationOf(switched.blueprintUuid)),
    closeSwitch,
    pickSwitch,
    openSwitchTeam: () => setOverlay('switchTeam'),
    editDrawer,
    closeTeamDrawer: () =>
      setOverlay(
        overlay === 'pickerTeam'
          ? 'picker'
          : overlay === 'switchTeam'
            ? 'switch'
            : 'none'
      ),
    handleTeamCreated,
    loadAll: () => onAddTeams(available),
    importSlugList,
  };
}
