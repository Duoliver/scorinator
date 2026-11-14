import { useState } from 'preact/hooks';
import { DEFAULT_BRACKET_RULES } from '@/engine/phases';
import { TieFormat, type TiebreakMethod } from '@/engine/tiebreak';
import type { TeamInstance } from '@/domain';
import type PlayoffDialogProps from './types';
import type { PlayoffDialogState, PlayoffSlot } from './types';
import { NAME_TAKEN, getTeamItem } from './helpers';

/** The "New playoff" dialog (US-13.7, Task 220). It starts with the bracket
 * defaults of the wizard, and "Home advantage" off, as a new league
 * (choice 4). "Create playoff" stays off until the name is free and both
 * slots have a team (choice 5). */
export function usePlayoffDialog({
  teams,
  isTaken,
  onCreate,
}: PlayoffDialogProps): PlayoffDialogState {
  const [name, setName] = useState('');
  const [uuids, setUuids] = useState<Record<PlayoffSlot, string | undefined>>({
    1: undefined,
    2: undefined,
  });
  const [picking, setPicking] = useState<PlayoffSlot | null>(null);
  const [format, setFormat] = useState<TieFormat>(DEFAULT_BRACKET_RULES.format);
  const [awayGoals, setAwayGoals] = useState(DEFAULT_BRACKET_RULES.awayGoals);
  const [playsAet, setPlaysAet] = useState(DEFAULT_BRACKET_RULES.playsAet);
  const [method, setMethod] = useState<TiebreakMethod>(DEFAULT_BRACKET_RULES.method);
  const [homeAdvantage, setHomeAdvantage] = useState(false);

  const teamOf = (uuid: string | undefined): TeamInstance | undefined =>
    teams.find((team) => team.blueprintUuid === uuid);
  const trimmed = name.trim();
  const nameError = trimmed !== '' && isTaken(trimmed) ? NAME_TAKEN : null;
  const canCreate =
    trimmed !== '' &&
    nameError === null &&
    uuids[1] !== undefined &&
    uuids[2] !== undefined;

  // The team of the other slot shows, disabled, with its slot (point 4c).
  const inSlot = picking ? teamOf(uuids[picking]) : undefined;
  const picker = picking && {
    mode: 'single' as const,
    title: `Pick team ${picking}`,
    description: 'Only the teams of the Season roster.',
    items: teams.map((team) => {
      const other: PlayoffSlot = picking === 1 ? 2 : 1;
      const isOther = uuids[other] === team.blueprintUuid;
      return getTeamItem(team, isOther ? `Team ${other}` : undefined);
    }),
    current: inSlot && getTeamItem(inSlot),
    onPick: (uuid: string): void => {
      setUuids((now) => ({ ...now, [picking]: uuid }));
      setPicking(null);
    },
    onCancel: (): void => setPicking(null),
  };

  return {
    setName,
    nameError,
    team1: teamOf(uuids[1]),
    team2: teamOf(uuids[2]),
    openPicker: setPicking,
    picker,
    format,
    setFormat,
    awayGoals,
    setAwayGoals,
    playsAet,
    setPlaysAet,
    method,
    setMethod,
    homeAdvantage,
    setHomeAdvantage,
    canCreate,
    handleCreate: (event: Event): void => {
      event.preventDefault();
      if (!canCreate || !uuids[1] || !uuids[2]) return;
      onCreate({
        name: trimmed,
        team1Uuid: uuids[1],
        team2Uuid: uuids[2],
        rules: {
          format,
          awayGoals: format === TieFormat.TWO_LEGGED && awayGoals,
          playsAet,
          method,
          homeAdvantage,
        },
      });
    },
  };
}
