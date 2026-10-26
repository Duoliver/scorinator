import {
  emptyLeagueDraft,
  useLeagueDraftStore,
  type LeagueDraft,
} from './leagueDraftStore';

export function setLeagueDraft(draft: LeagueDraft): void {
  useLeagueDraftStore.setState(draft);
}

export function resetLeagueDraft(): void {
  useLeagueDraftStore.setState(emptyLeagueDraft());
}
