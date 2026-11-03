import type { Rng } from '@/engine/rng';
import {
  applyHomeAdvantage,
  rollElasticity,
  scorinateExtraTime,
  scorinatePeriod,
  type MatchScore,
} from '@/engine/scorination';
import { scorinatePenalties, tossCoin } from './penalties';
import type {
  TieDecision,
  TieMatch,
  TieMatchPart,
  TieResult,
  TieRules,
  TieTeam,
} from './types';

// A played match, with what its AET needs: the OVRs it played with, home
// boost included, and its elasticity roll (Task 134).
interface PlayedMatch<TeamId> {
  match: TieMatch<TeamId>;
  home: TieTeam<TeamId>;
  away: TieTeam<TeamId>;
  homeOvr: number;
  elasticity: number;
}

function playPart<TeamId>(
  part: TieMatchPart,
  home: TieTeam<TeamId>,
  away: TieTeam<TeamId>,
  homeBoost: boolean,
  rng: Rng
): PlayedMatch<TeamId> {
  const homeOvr = homeBoost ? applyHomeAdvantage(home.ovr) : home.ovr;
  const elasticity = rollElasticity(rng);
  const score = scorinatePeriod(homeOvr, away.ovr, elasticity, 1, rng);
  return {
    match: { part, homeId: home.id, awayId: away.id, score },
    home,
    away,
    homeOvr,
    elasticity,
  };
}

// Plays the AET of a level match, at the same venue and with the same
// elasticity. Gives the AET winner, or undefined when the AET is level.
function playAet<TeamId>(
  played: PlayedMatch<TeamId>,
  rng: Rng
): TieTeam<TeamId> | undefined {
  const aet = scorinateExtraTime(
    played.homeOvr,
    played.away.ovr,
    played.elasticity,
    rng
  );
  played.match.aet = aet;
  return pickWinner(aet, played);
}

function pickWinner<TeamId>(
  score: MatchScore,
  played: PlayedMatch<TeamId>
): TieTeam<TeamId> | undefined {
  if (score.homeGoals > score.awayGoals) return played.home;
  if (score.awayGoals > score.homeGoals) return played.away;
  return undefined;
}

function goalsFor<TeamId>(played: PlayedMatch<TeamId>, team: TieTeam<TeamId>): number {
  const { score } = played.match;
  return played.home === team ? score.homeGoals : score.awayGoals;
}

// The winner after 90 or 180 minutes: the higher aggregate, then the away
// goals when the rule is on. AET goals are not played yet, so they never
// count as away goals.
function pickRegularWinner<TeamId>(
  legs: PlayedMatch<TeamId>[],
  higher: TieTeam<TeamId>,
  lower: TieTeam<TeamId>,
  awayGoals: boolean
): [TieTeam<TeamId>, TieDecision] | undefined {
  const total = (team: TieTeam<TeamId>): number =>
    legs.reduce((sum, leg) => sum + goalsFor(leg, team), 0);
  if (total(higher) !== total(lower)) {
    return [total(higher) > total(lower) ? higher : lower, 'regulation'];
  }
  if (!awayGoals) return undefined;
  const away = (team: TieTeam<TeamId>): number =>
    legs
      .filter((leg) => leg.away === team)
      .reduce((sum, leg) => sum + goalsFor(leg, team), 0);
  if (away(higher) === away(lower)) return undefined;
  return [away(higher) > away(lower) ? higher : lower, 'away-goals'];
}

function playLegs<TeamId>(
  higher: TieTeam<TeamId>,
  lower: TieTeam<TeamId>,
  rules: TieRules,
  rng: Rng
): PlayedMatch<TeamId>[] {
  // A single match is at a neutral venue (Task 74). The higher seed takes
  // the home slot, with no boost (Task 135 choice 4).
  if (rules.format === 'single-match')
    return [playPart('leg1', higher, lower, false, rng)];
  // The higher seed plays the second leg at home (Task 79).
  return [
    playPart('leg1', lower, higher, rules.homeAdvantage, rng),
    playPart('leg2', higher, lower, rules.homeAdvantage, rng),
  ];
}

// The replay, a one-shot fallback: a neutral match with its own elasticity,
// then its AET when the phase plays AET, then the coin toss.
function playReplay<TeamId>(
  higher: TieTeam<TeamId>,
  lower: TieTeam<TeamId>,
  playsAet: boolean,
  matches: TieMatch<TeamId>[],
  rng: Rng
): [TieTeam<TeamId>, TieDecision] {
  const replay = playPart('replay', higher, lower, false, rng);
  matches.push(replay.match);
  const winner =
    pickWinner(replay.match.score, replay) ??
    (playsAet ? playAet(replay, rng) : undefined);
  if (winner) return [winner, 'replay'];
  return [tossCoin(rng) === 'home' ? replay.home : replay.away, 'coin-toss'];
}

/**
 * Plays one whole bracket tie, every step it needs, in one call (US-04.5).
 * First the single match or the two legs. A tie level on aggregate then
 * goes to the away goals when the rule is on, then to the US-03.2 sequence:
 * AET when the phase plays it, then penalties or a replay and a coin toss.
 * The AET follows the last match at its venue, and penalties use the stored
 * OVRs (Task 80). The caller builds the fixture ids from each match part.
 */
export function playTie<TeamId>(
  higherSeed: TieTeam<TeamId>,
  lowerSeed: TieTeam<TeamId>,
  rules: TieRules,
  rng: Rng
): TieResult<TeamId> {
  const legs = playLegs(higherSeed, lowerSeed, rules, rng);
  const matches = legs.map((leg) => leg.match);
  const finish = ([winner, decidedBy]: [
    TieTeam<TeamId>,
    TieDecision,
  ]): TieResult<TeamId> => ({
    matches,
    winnerId: winner.id,
    loserId: winner === higherSeed ? lowerSeed.id : higherSeed.id,
    decidedBy,
  });

  const regular = pickRegularWinner(legs, higherSeed, lowerSeed, rules.awayGoals);
  if (regular) return finish(regular);

  const last = legs[legs.length - 1];
  const aetWinner = rules.playsAet ? playAet(last, rng) : undefined;
  if (aetWinner) return finish([aetWinner, 'aet']);

  if (rules.method === 'replay-coin-toss') {
    return finish(playReplay(higherSeed, lowerSeed, rules.playsAet, matches, rng));
  }
  const penalties = scorinatePenalties(last.home.ovr, last.away.ovr, rng);
  const winner = penalties.homeGoals > penalties.awayGoals ? last.home : last.away;
  return { ...finish([winner, 'penalties']), penalties };
}
