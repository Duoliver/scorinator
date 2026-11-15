import { useState } from 'preact/hooks';
import type { Playoff, SeasonWrapper, TeamInstance } from '@/domain';
import { getErrorMessage } from '@/app/getErrorMessage';
import { isPlayoffNameTaken, useDatabaseStore } from '@/app/state/databaseStore';
import {
  createPlayoff,
  playPlayoff,
  type PlayoffInput,
} from '@/app/state/seasonPlayoffActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import { useBlueprintLocation } from '@/features/components';
import type { PlayoffDialogProps } from './PlayoffDialog';
import {
  formatPlayoffRules,
  getPlayoffScore,
  hasAetMatch,
  type PlayoffRow,
  type PlayoffSide,
} from './PlayoffsTab';

/** One team of a row, from the Season roster. */
function getSide(
  roster: ReadonlyMap<string, TeamInstance>,
  locationOf: (blueprintUuid: string) => string,
  uuid: string,
  goals: number | undefined,
  loserId: string | undefined
): PlayoffSide {
  const team = roster.get(uuid);
  return {
    name: team?.name ?? '',
    location: locationOf(uuid),
    trigram: team?.trigram ?? '',
    colour: team?.colour ?? '',
    isLoser: loserId === uuid,
    goals: goals === undefined ? '' : String(goals),
  };
}

/** The Playoffs tab and the "New playoff" dialog of one Season (US-13.7,
 * Task 220). A play writes the winner in the status line (choice 7). */
export function usePlayoffs(season: SeasonWrapper | undefined): {
  rows: PlayoffRow[];
  hasAetKey: boolean;
  openDialog: () => void;
  dialog: PlayoffDialogProps | null;
} {
  const [isOpen, setIsOpen] = useState(false);
  const locationOf = useBlueprintLocation();
  if (!season) {
    return {
      rows: [],
      hasAetKey: false,
      openDialog: () => setIsOpen(true),
      dialog: null,
    };
  }

  const roster = new Map(season.teams.map((team) => [team.blueprintUuid, team]));
  const play = (playoff: Playoff): void => {
    try {
      playPlayoff(season.uuid, playoff.uuid);
    } catch (error) {
      setStatusLine({ tone: 'error', message: getErrorMessage(error) });
      return;
    }
    // The result is in the store now, not in this render's Season.
    const played = useDatabaseStore
      .getState()
      .seasons[season.uuid]?.content.playoffs.find((p) => p.uuid === playoff.uuid);
    const winner = played?.result && roster.get(played.result.winnerId)?.name;
    setStatusLine({
      tone: 'info',
      message: `Played ${playoff.name}: ${winner ?? 'a team'} wins.`,
    });
  };
  const rows = season.content.playoffs.map((playoff): PlayoffRow => {
    const { team1Uuid, team2Uuid, result } = playoff;
    const score = result && getPlayoffScore(result, team1Uuid, team2Uuid);
    return {
      uuid: playoff.uuid,
      name: playoff.name,
      rules: formatPlayoffRules(playoff.rules),
      team1: getSide(roster, locationOf, team1Uuid, score?.team1Goals, result?.loserId),
      team2: getSide(roster, locationOf, team2Uuid, score?.team2Goals, result?.loserId),
      total: score && `${score.team1Goals} - ${score.team2Goals}`,
      detail: score?.detail ?? '',
      play: result ? undefined : (): void => play(playoff),
    };
  });

  return {
    rows,
    hasAetKey: season.content.playoffs.some((playoff) => hasAetMatch(playoff.result)),
    openDialog: () => setIsOpen(true),
    dialog: isOpen
      ? {
          teams: season.teams,
          isTaken: (name: string) => isPlayoffNameTaken(season, name),
          onCreate: (input: PlayoffInput): void => {
            try {
              createPlayoff(season.uuid, input);
              setIsOpen(false);
              setStatusLine({ tone: 'info', message: `Created ${input.name.trim()}.` });
            } catch (error) {
              setStatusLine({ tone: 'error', message: getErrorMessage(error) });
            }
          },
          onCancel: () => setIsOpen(false),
        }
      : null,
  };
}
