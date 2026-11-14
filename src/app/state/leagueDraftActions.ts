import {
  emptyLeagueDraft,
  useLeagueDraftStore,
  type LeagueDraft,
} from './leagueDraftStore';

/** Keeps the draft of the standalone wizard, or of the wizard in a Season. */
export function setLeagueDraft(draft: LeagueDraft, seasonUuid?: string): void {
  if (seasonUuid === undefined) {
    useLeagueDraftStore.setState(draft);
    return;
  }
  useLeagueDraftStore.setState((now) => ({
    seasonDrafts: { ...now.seasonDrafts, [seasonUuid]: draft },
  }));
}

/** Clears the draft of one container only (Task 218 choice 3). */
export function resetLeagueDraft(seasonUuid?: string): void {
  if (seasonUuid === undefined) {
    useLeagueDraftStore.setState(emptyLeagueDraft());
    return;
  }
  useLeagueDraftStore.setState((now) => {
    const { [seasonUuid]: _cleared, ...rest } = now.seasonDrafts;
    return { seasonDrafts: rest };
  });
}
