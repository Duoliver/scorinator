import { useState } from 'preact/hooks';
import type { ConfirmDialogProps } from '@/design-system';
import { bracketSlotCount } from '@/engine/bracket';
import { setBracketByes } from '@/app/state/leagueWrapperActions';
import { phaseStandings } from '@/app/state/phases';
import { useTeamLookup } from '@/features/components';
import type SeedListProps from './types';
import type { SeedListState } from './types';
import { buildSeedRows, describeByes, seedTagsOf, toggleBye } from './helpers';
import { PhaseFormat } from '@/engine/phases';

/**
 * The Seed List data (Task 142): the rows in seed order with their tags
 * and stars, the bye text and count, and the star action. After the first
 * bracket result, a star click opens the "Clear bracket results?" confirm
 * first, because `setBracketByes` clears every result (US-04.10).
 */
export function useSeedList({ league, phaseIndex }: SeedListProps): SeedListState {
  const [pending, setPending] = useState<string[] | null>(null);
  const lookup = useTeamLookup(league.teams);
  const phase = league.content.phases[phaseIndex];
  const seeds = phase?.format === PhaseFormat.BRACKET ? phase.seeds : [];
  const byeTeams = phase?.format === PhaseFormat.BRACKET ? phase.byeTeams : [];
  const hasResults = phase?.format === PhaseFormat.BRACKET && phase.results.length > 0;
  const byes = seeds.length >= 2 ? bracketSlotCount(seeds.length) - seeds.length : 0;

  const before = league.content.plans[phaseIndex - 1];
  const tags =
    before && before.format !== PhaseFormat.BRACKET
      ? seedTagsOf(phaseStandings(league, phaseIndex - 1), before.format)
      : new Map<string, string>();

  const apply = (next: string[]): void => setBracketByes(league.uuid, next);
  const confirm: ConfirmDialogProps | null = pending
    ? {
        title: 'Clear bracket results?',
        message: 'This will clear every result of the bracket. Continue?',
        confirmLabel: 'Clear & change byes',
        tone: 'destructive',
        onConfirm: (): void => {
          setPending(null);
          apply(pending);
        },
        onCancel: (): void => setPending(null),
      }
    : null;

  return {
    rows: buildSeedRows(seeds, byeTeams, byes, tags, lookup),
    hasTags: tags.size > 0,
    ...describeByes(seeds.length, byes, byeTeams.length),
    toggleBye: (teamId): void => {
      const next = toggleBye(byeTeams, teamId);
      if (hasResults) setPending(next);
      else apply(next);
    },
    confirm,
  };
}
