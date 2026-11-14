import { useState } from 'preact/hooks';
import type { MultiPickerProps } from '@/design-system';
import type { SeasonWrapper } from '@/domain';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { addSeasonTeams } from '@/app/state/seasonActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import { formatCount, formatSeasonLabel } from '@/features/seasons/seasonText';
import { ADD_TEAMS_TEXT, formatJoinHints, toPickerItem } from './helpers';

/** The "Add teams" dialog of the Season view (US-13.4, Task 213 choice 5):
 * the Blueprints that are not in the roster, and a hint for each picked
 * team that clashes with a roster name. */
export function useAddTeams(season: SeasonWrapper | undefined): {
  openPicker: () => void;
  picker: MultiPickerProps | null;
} {
  const blueprints = useDatabaseStore((state) => state.blueprints);
  const [picked, setPicked] = useState<string[] | null>(null);
  const openPicker = (): void => setPicked([]);
  if (!season || picked === null) return { openPicker, picker: null };

  const inRoster = new Set(season.teams.map((team) => team.blueprintUuid));
  const hints = formatJoinHints(
    season.teams.map((team) => team.name),
    blueprints.filter((blueprint) => picked.includes(blueprint.uuid))
  );
  return {
    openPicker,
    picker: {
      mode: 'multi',
      title: 'Add teams',
      description: [ADD_TEAMS_TEXT, ...hints].join(' '),
      items: blueprints.filter((b) => !inRoster.has(b.uuid)).map(toPickerItem),
      searchPlaceholder: 'Name or Location',
      selected: picked,
      onSelectedChange: setPicked,
      confirmLabel: `Add ${formatCount(picked.length, 'team')}`,
      onConfirm: (): void => {
        const added = addSeasonTeams(season.uuid, picked);
        setPicked(null);
        setStatusLine({
          tone: 'info',
          message: `Added ${formatCount(added.length, 'team')} to ${formatSeasonLabel(season.content)}.`,
        });
      },
      onCancel: (): void => setPicked(null),
    },
  };
}
