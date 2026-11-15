import type { JSX } from 'preact';
import type { RoutableProps } from 'preact-router';
import { TeamsScreen } from '@/features/teams';
import {
  LeagueSetupScreen,
  LeagueDetailScreen,
  LeaguesDashboardScreen,
} from '@/features/leagues';
import { FileScreen } from '@/features/file';
import { SeasonsListScreen, SeasonViewScreen } from '@/features/seasons';

/** `TeamsScreen`/`LeagueSetupScreen` take no props and stay routing-agnostic,
 * per `module-boundaries.md` — `features/` never needs to know it is routed.
 * These adapters carry the `path`/`default` typing `<Router>` needs instead. */
export function TeamsRoute(_props: RoutableProps): JSX.Element {
  return <TeamsScreen />;
}

export function LeagueSetupRoute(_props: RoutableProps): JSX.Element {
  return <LeagueSetupScreen />;
}

export function LeaguesDashboardRoute(_props: RoutableProps): JSX.Element {
  return <LeaguesDashboardScreen />;
}

export function FileRoute(_props: RoutableProps): JSX.Element {
  return <FileScreen />;
}

export function SeasonsRoute(_props: RoutableProps): JSX.Element {
  return <SeasonsListScreen />;
}

/** Carries the `uuid` of `ROUTES.seasonDetail` (`/seasons/:uuid`) to the
 * Season view, as `LeagueDetailRoute` does for a league (Task 213). */
export function SeasonViewRoute(props: RoutableProps & { uuid?: string }): JSX.Element {
  return <SeasonViewScreen uuid={props.uuid ?? ''} />;
}

/** Carries the Season `uuid` of `ROUTES.seasonLeagueNew` to the wizard, so
 * it makes the league in that Season (Task 218). */
export function SeasonLeagueSetupRoute(
  props: RoutableProps & { uuid?: string }
): JSX.Element {
  return <LeagueSetupScreen seasonUuid={props.uuid ?? ''} />;
}

/** Carries the two UUIDs of `ROUTES.seasonLeagueDetail` to League Detail:
 * a league UUID is unique only in its Season (Task 196, Task 219). */
export function SeasonLeagueDetailRoute(
  props: RoutableProps & { uuid?: string; leagueUuid?: string }
): JSX.Element {
  return (
    <LeagueDetailScreen seasonUuid={props.uuid ?? ''} uuid={props.leagueUuid ?? ''} />
  );
}

/** Unlike the adapters above, this one does carry a real prop across:
 * `uuid`, the one param `preact-router` injects for `ROUTES.leagueDetail`
 * (`/leagues/:uuid`) and the one piece of routing information
 * `LeagueDetailScreen` actually needs. */
export function LeagueDetailRoute(
  props: RoutableProps & { uuid?: string }
): JSX.Element {
  return <LeagueDetailScreen uuid={props.uuid ?? ''} />;
}
