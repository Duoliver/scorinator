import type { TieResult, TieRules } from '@/engine/tiebreak';
import type { League } from './league';
import type { Provenance } from './provenance';

/**
 * A league of a Season (US-13.5). It is a full MVP2 league. The Season
 * wrapper holds the Instances, so the league names its own teams by their
 * Blueprint UUIDs. One Season team can then play in two leagues at the same
 * time (US-13.6, Task 207 choice 3).
 */
export interface SeasonLeague extends League {
  teamUuids: string[];
}

/**
 * A one-off tie between two Season teams, outside the leagues (US-13.7). It
 * has the format options of a bracket tie. `result` is absent until the
 * user plays it. The UUID keys the playoff on a screen, and can link it to
 * a league later (Task 207 choice 4).
 */
export interface Playoff {
  uuid: string;
  name: string;
  homeUuid: string;
  awayUuid: string;
  rules: TieRules;
  result?: TieResult<string>;
}

/**
 * A group of leagues that share their teams (US-13.1). `name` and `year`
 * together are unique in the database. The year is free text, so it can be
 * "2026", a Season number such as "3", "2026-27", or a fictional era such as
 * "4E 201" (Task 209). A finished Season is read only, and
 * the user can reopen it (US-13.9). The Season has no roster of its own: the
 * Instances of its wrapper are the Season teams, in join order (US-13.4,
 * Task 207 choice 2).
 */
export interface Season extends Provenance {
  uuid: string;
  name: string;
  year: string;
  finished: boolean;
  leagues: SeasonLeague[];
  playoffs: Playoff[];
}
