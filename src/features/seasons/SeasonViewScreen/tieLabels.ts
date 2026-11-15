import { TieFormat, TiebreakMethod } from '@/engine/tiebreak';

/* The labels of the tie rules, as the wizard bracket settings name them.
 * One label set, so a rule reads the same everywhere in a Season (Task
 * 220). */

export const FORMAT_LABELS: Record<TieFormat, string> = {
  [TieFormat.SINGLE_MATCH]: 'Single match',
  [TieFormat.TWO_LEGGED]: 'Two-legged',
};

export const METHOD_LABELS: Record<TiebreakMethod, string> = {
  [TiebreakMethod.PENALTIES]: 'Penalties',
  [TiebreakMethod.REPLAY_COIN_TOSS]: 'Replay → Coin toss',
};
