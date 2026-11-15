import { useState } from 'preact/hooks';
import type { ConfirmDialogProps } from '@/design-system';
import {
  findBracketWinner,
  findPlayableTies,
  findTieTeams,
  hasDependentResults,
  roundName,
} from '@/engine/bracket';
import { bracketRulesFor, bracketTreeOf } from '@/app/state/bracket';
import {
  scorinateBracket,
  scorinateBracketTie,
} from '@/app/state/leagueWrapperActions';
import { useTeamLookup } from '@/features/components';
import type BracketViewProps from './types';
import type { BracketColumn, BracketViewState } from './types';
import { buildTieCard, describeBracketHeader } from './helpers';
import { PhaseFormat } from '@/engine/phases';

/**
 * The Bracket view data (Task 141): the header line, one column for each
 * round with its tie cards, the winner, the missing byes, and the
 * Scorinate actions. A re-scorinate of a tie with a later result opens the
 * "Clear later rounds?" confirm first (US-04.6).
 */
export function useBracketView({
  league,
  phaseIndex,
  leagueRef,
  readOnly = false,
}: BracketViewProps): BracketViewState {
  const ref = leagueRef ?? league.uuid;
  const [confirmTie, setConfirmTie] = useState<string | null>(null);
  const lookup = useTeamLookup(league.teams);
  const phase = league.content.phases[phaseIndex];
  const results = phase?.format === PhaseFormat.BRACKET ? phase.results : [];
  const rules = bracketRulesFor(league, phaseIndex);
  const tree = bracketTreeOf(league, phaseIndex);
  const rounds = tree.status === 'ready' ? tree.rounds : [];
  const playable = new Set(findPlayableTies(rounds, results));

  const columns: BracketColumn[] = rounds.map((round) => ({
    key: round.round,
    name: roundName(round.teams),
    // The final first, the third-place tie under it (US-04.12).
    cards: [...round.ties]
      .sort((a, b) => a.tie - b.tie)
      .map((tie) =>
        buildTieCard(
          tie,
          findTieTeams(rounds, results, tie.id),
          results.find((result) => result.tieId === tie.id),
          rules,
          lookup,
          playable.has(tie.id)
        )
      )
      // A finished Season keeps every result as it is (US-13.9).
      .map((card) => (readOnly ? { ...card, canScorinate: false } : card)),
  }));

  const winnerId = findBracketWinner(rounds, results);
  const scorinateTie = (tieId: string): void => {
    const played = results.some((result) => result.tieId === tieId);
    if (played && hasDependentResults(rounds, results, tieId)) setConfirmTie(tieId);
    else scorinateBracketTie(ref, tieId);
  };
  const confirm: ConfirmDialogProps | null = confirmTie
    ? {
        title: 'Clear later rounds?',
        message: 'This will clear results for later rounds. Continue?',
        confirmLabel: 'Clear & scorinate',
        tone: 'destructive',
        onConfirm: (): void => {
          setConfirmTie(null);
          scorinateBracketTie(ref, confirmTie);
        },
        onCancel: (): void => setConfirmTie(null),
      }
    : null;

  return {
    header: describeBracketHeader(league.content.plans, phaseIndex, rules),
    columns,
    winner: winnerId === undefined ? undefined : lookup(winnerId),
    missingByes:
      tree.status === 'missing-byes'
        ? `Assign ${tree.assigned} / ${tree.byes} byes to play the first round.`
        : undefined,
    canScorinateBracket: playable.size > 0 && !readOnly,
    scorinateBracket: () => scorinateBracket(ref),
    scorinateTie,
    confirm,
  };
}
