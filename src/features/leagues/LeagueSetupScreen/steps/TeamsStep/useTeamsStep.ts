import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { TeamFields } from '@/domain';
import type { TrigramPick } from '@/engine/identity';
import type { TeamInstanceEdit } from './EditTeamDrawer';
import { getErrorMessage } from '@/app/getErrorMessage';
import { importSlugListTxt } from '@/app/data/slugListTxt';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { setStatusLine } from '@/app/state/statusLineActions';
import { addTeamBlueprint } from '@/app/state/teamBlueprintActions';
import {
  pickTeamTrigrams,
  planSlugListImport,
  teamListProblem,
} from '@/app/state/teamInstances';
import {
  formatSeasonLabel,
  formatTeamCount,
  useBlueprintLocation,
  useSeasonTeamEdit,
} from '@/features/components';
import {
  formatJoinNote,
  JOINS_SEASON,
} from '@/features/leagues/LeagueSetupScreen/seasonTeams';
import { settingsChipLabels } from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import { formatLeagueName } from '@/features/components/leagueSummary';
import type TeamsStepProps from './types';
import type { TeamsStepOverlay, TeamsStepState } from './types';
import { getTeamCondition } from '@/app/state/condition';
import {
  NO_SLUGS,
  describeBadLevels,
  describeNotFound,
  describeSlugListImport,
  getSeasonPickerItems,
  getTeamsStepColumns,
  renderConditionPicker,
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
  conditions,
  onSetCondition,
  onAddConditions,
  season,
}: Omit<TeamsStepProps, 'onBack' | 'onNext'>): TeamsStepState {
  const blueprints = useDatabaseStore((state) => state.blueprints);
  const locationOf = useBlueprintLocation();
  const [overlay, setOverlay] = useState<TeamsStepOverlay>('none');
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [importNotice, setImportNotice] = useState<string[] | null>(null);
  // The team that the Switch dialog replaces (US-08.5).
  const [switchUuid, setSwitchUuid] = useState<string | null>(null);
  // The team that the Edit drawer changes (US-08.4).
  const [editUuid, setEditUuid] = useState<string | null>(null);

  const inList = new Set(teams.map((team) => team.blueprintUuid));
  const available = blueprints.filter((blueprint) => !inList.has(blueprint.uuid));
  // The live pick runs again on each render, so after each add, Switch,
  // Remove, or Edit (US-09.6).
  const picks = pickTeamTrigrams(teams, blueprints, fixedTrigrams);
  // In a Season, the list shows what the create makes (Task 218 choice 6).
  const rows = season?.rows ?? [...teams];
  const rowOf = new Map(rows.map((row) => [row.blueprintUuid, row]));
  const pickOf = season
    ? (uuid: string): TrigramPick | undefined => {
        const row = rowOf.get(uuid);
        return row && { trigram: row.trigram, fallback: false };
      }
    : (uuid: string): TrigramPick | undefined => picks.get(uuid);
  const isJoining = (uuid: string): boolean => season?.joining.has(uuid) ?? false;
  const seasonEdit = useSeasonTeamEdit(season?.season);
  const inRoster = new Set(season?.season.teams.map((team) => team.blueprintUuid));
  // "Load them all" adds the Season teams only in a Season (choice 9).
  const loadable = season ? available.filter((b) => inRoster.has(b.uuid)) : available;
  const switched = rows.find((team) => team.blueprintUuid === switchUuid);

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
        pickedTrigram: pickOf(edited.blueprintUuid)?.trigram ?? '',
        otherNames: teams.filter((t) => t !== edited).map((t) => t.name),
        // In a Season, a joining team cannot fix a trigram of the roster.
        otherFixedTrigrams: [
          ...Object.entries(fixedTrigrams)
            .filter(([uuid]) => uuid !== edited.blueprintUuid)
            .map(([, trigram]) => trigram),
          ...(season?.season.teams.map((team) => team.trigram) ?? []),
        ],
        ...(season && {
          title: 'Edit team',
          note: formatJoinNote(
            rowOf.get(edited.blueprintUuid)?.name ?? edited.name,
            formatSeasonLabel(season.season.content)
          ),
        }),
        onSave: (edit: TeamInstanceEdit): void => {
          onUpdateTeam(edited.blueprintUuid, edit);
          closeEdit();
        },
        onCancel: closeEdit,
      }
    : null;

  // A Season team opens "Edit Season team", and its Save changes the
  // Season at once (choice 7). A joining team opens the wizard drawer.
  const openEdit = (blueprintUuid: string): void => {
    if (season && !isJoining(blueprintUuid)) {
      seasonEdit.openDrawer(blueprintUuid);
      return;
    }
    setEditUuid(blueprintUuid);
    setOverlay('edit');
  };

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
      const file = await importSlugListTxt();
      if (file === null) return;
      if (file.entries.length === 0) {
        setStatusLine({ tone: 'error', message: NO_SLUGS });
        return;
      }
      const plan = planSlugListImport(file.entries, blueprints, teams);
      onAddTeams(plan.add);
      onAddConditions(plan.levels);
      setStatusLine({
        tone: 'info',
        message: describeSlugListImport(plan.add.length, plan.alreadyInList),
      });
      const notice = [
        ...(plan.notFound.length > 0 ? [describeNotFound(plan.notFound)] : []),
        ...(file.badLevels.length > 0 ? [describeBadLevels(file.badLevels)] : []),
      ];
      setImportNotice(notice.length > 0 ? notice : null);
    } catch (error) {
      setStatusLine({ tone: 'error', message: getErrorMessage(error) });
    }
  };

  const nameOf = new Map(rows.map((row) => [row.blueprintUuid, row.name]));
  const renderCondition = (blueprintUuid: string): JSX.Element =>
    renderConditionPicker(
      nameOf.get(blueprintUuid) ?? blueprintUuid,
      getTeamCondition(conditions, blueprintUuid),
      (level) => onSetCondition(blueprintUuid, level)
    );

  return {
    leagueName: formatLeagueName(name),
    chipLabels: settingsChipLabels(homeAdvantage, points),
    hasNoBlueprints: blueprints.length === 0,
    columns: getTeamsStepColumns(
      locationOf,
      pickOf,
      openEdit,
      openSwitch,
      onRemoveTeam,
      (team) => renderCondition(team.blueprintUuid),
      (uuid) => (isJoining(uuid) ? JOINS_SEASON : undefined)
    ),
    renderCondition,
    rows,
    seasonDrawer: seasonEdit.drawer,
    canCreateTeam: season === undefined,
    locationOf,
    openEdit,
    openSwitch,
    countText: formatTeamCount(teams.length),
    canLoadAll: loadable.length > 0,
    canGoNext: teams.length > 0,
    warning: teams.length > 0 ? teamListProblem(teams) : null,
    importNotice,
    closeImportNotice: () => setImportNotice(null),
    overlay,
    pickerItems: season
      ? getSeasonPickerItems(season.season, blueprints, inList)
      : available.map(toPickerItem),
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
    loadAll: () => onAddTeams(loadable),
    importSlugList,
  };
}
