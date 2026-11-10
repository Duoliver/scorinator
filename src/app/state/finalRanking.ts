import { finalRanking, type PhaseOrderInput, PhaseFormat } from '@/engine/phases';
import type { LeagueWrapper } from '@/domain';
import { bracketTreeOf } from './bracket';
import { leagueLotOf, phaseStandings } from './phases';

/**
 * The final ranking of a league from its current results, as Blueprint
 * UUIDs (US-10.5, Task 147). It builds one engine input for each started
 * phase: the tables of a round robin or Groups phase, and the tree of a
 * bracket (choice 1). Task 148 writes the slug list from it.
 */
export function leagueFinalRanking(wrapper: LeagueWrapper): string[] {
  const inputs = wrapper.content.phases.map((phase, index): PhaseOrderInput<string> => {
    if (phase.format !== PhaseFormat.BRACKET) {
      return { format: phase.format, tables: phaseStandings(wrapper, index) };
    }
    const tree = bracketTreeOf(wrapper, index);
    return {
      format: PhaseFormat.BRACKET,
      seeds: phase.seeds,
      rounds: tree.status === 'ready' ? tree.rounds : null,
      results: phase.results,
    };
  });
  return finalRanking(inputs, leagueLotOf(wrapper));
}
