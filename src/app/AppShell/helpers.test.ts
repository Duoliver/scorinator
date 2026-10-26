import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/app/routes';
import { NAV_ITEMS, isNavItemActive, isScreenChange, toActivePath } from './helpers';
import type { NavItem } from './types';

const navItem = (path: string): NavItem =>
  NAV_ITEMS.find((item) => item.path === path)!;

describe('isNavItemActive', () => {
  it('marks Leagues for the dashboard, League Setup, and League Detail', () => {
    const leagues = navItem(ROUTES.leaguesDashboard);
    expect(isNavItemActive(leagues, '/leagues')).toBe(true);
    expect(isNavItemActive(leagues, '/leagues/new')).toBe(true);
    expect(isNavItemActive(leagues, '/leagues/coastal-premier')).toBe(true);
    expect(isNavItemActive(leagues, '/teams')).toBe(false);
  });

  it('marks any other item only for its exact path', () => {
    const teams = navItem(ROUTES.teams);
    expect(isNavItemActive(teams, '/teams')).toBe(true);
    expect(isNavItemActive(teams, '/teams/extra')).toBe(false);
    expect(isNavItemActive(teams, '/leagues')).toBe(false);
  });
});

describe('toActivePath', () => {
  it('gives the start screen for the root url, which the router renders by default', () => {
    expect(toActivePath(ROUTES.root)).toBe(ROUTES.leaguesDashboard);
  });

  it('keeps any other url', () => {
    expect(toActivePath('/file')).toBe('/file');
  });
});

describe('isScreenChange', () => {
  it('is false on the first render, when there is no previous url', () => {
    expect(isScreenChange(undefined, '/leagues')).toBe(false);
  });

  it('is false for the same url', () => {
    expect(isScreenChange('/teams', '/teams')).toBe(false);
  });

  it('is true for another url', () => {
    expect(isScreenChange('/teams', '/file')).toBe(true);
  });
});
