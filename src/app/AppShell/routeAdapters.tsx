import type { JSX } from 'preact';
import type { RoutableProps } from 'preact-router';
import { TeamsScreen } from '@/features/teams';
import {
  LeagueSetupScreen,
  LeagueDetailScreen,
  LeaguesDashboardScreen,
} from '@/features/leagues';
import { FileScreen } from '@/features/file';

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

/** Unlike the adapters above, this one does carry a real prop across:
 * `uuid`, the one param `preact-router` injects for `ROUTES.leagueDetail`
 * (`/leagues/:uuid`) and the one piece of routing information
 * `LeagueDetailScreen` actually needs. */
export function LeagueDetailRoute(
  props: RoutableProps & { uuid?: string }
): JSX.Element {
  return <LeagueDetailScreen uuid={props.uuid ?? ''} />;
}
