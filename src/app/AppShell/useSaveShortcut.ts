import { useEffect } from 'preact/hooks';
import { saveCurrentLeague } from '@/app/saveActions';

/** Ctrl+S (Cmd+S on macOS) saves the current league, from any screen. A
 * held key still gets its browser default blocked, but saves only once. */
export function useSaveShortcut(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isSave =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 's';
      if (!isSave) return;
      event.preventDefault();
      if (event.repeat) return;
      void saveCurrentLeague();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
