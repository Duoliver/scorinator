import { open, save } from '@tauri-apps/plugin-dialog';
import type { FileFilter, SaveFileDialog } from '../../persistence/types';

const JSON_FILTERS: readonly FileFilter[] = [
  { name: 'Scorinator save', extensions: ['json'] },
];

/** `SaveFileDialog` backed by the real Tauri `dialog` plugin. Filters to
 * `.json` files when the caller does not pass its own `filters` — the
 * original save/load use case, kept as the default so existing callers do
 * not need to change. */
export const tauriDialog: SaveFileDialog = {
  pickSavePath: (defaultPath, filters = JSON_FILTERS) =>
    save({ defaultPath, filters: [...filters] }),
  pickOpenPath: async (filters = JSON_FILTERS) => {
    const selected = await open({ multiple: false, filters: [...filters] });
    return selected;
  },
};
