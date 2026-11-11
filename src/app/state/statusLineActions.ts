import { useStatusLineStore, type StatusLineMessage } from './statusLineStore';

export function setStatusLine(status: StatusLineMessage): void {
  useStatusLineStore.setState({ status });
}

export function clearStatusLine(): void {
  useStatusLineStore.setState({ status: null });
}
