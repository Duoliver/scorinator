import { useFileStore, type FileStatus } from './fileStore';

export function setFileStatus(status: FileStatus): void {
  useFileStore.setState({ status });
}

export function clearFileStatus(): void {
  useFileStore.setState({ status: null });
}
