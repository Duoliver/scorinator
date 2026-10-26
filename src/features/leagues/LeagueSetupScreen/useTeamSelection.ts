import { useState } from 'preact/hooks';
import type { TeamSelection } from './types';

/** The teams picked on the Teams step, as local state seeded from the
 * draft. Each change keeps the slugs unique. */
export function useTeamSelection(initialSlugs: string[]): TeamSelection {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);

  return {
    selectedSlugs,
    toggleTeam: (slug) =>
      setSelectedSlugs((current) =>
        current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
      ),
    selectTeam: (slug) =>
      setSelectedSlugs((current) =>
        current.includes(slug) ? current : [...current, slug]
      ),
    selectAllTeams: (slugs) =>
      setSelectedSlugs((current) => Array.from(new Set([...current, ...slugs]))),
    clearSelection: (slugs) =>
      setSelectedSlugs((current) => current.filter((slug) => !slugs.includes(slug))),
  };
}
