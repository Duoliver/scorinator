import { open, save } from '@tauri-apps/plugin-dialog';
import type { SaveFileDialog } from '../../persistence/types';

const JSON_FILTERS = [{ name: 'Scorinator save', extensions: ['json'] }];

/** `SaveFileDialog` backed by the real Tauri `dialog` plugin, filtered to
 * `.json` files. */
export const tauriDialog: SaveFileDialog = {
  pickSavePath: (defaultPath) => save({ defaultPath, filters: JSON_FILTERS }),
  pickOpenPath: async () => {
    const selected = await open({ multiple: false, filters: JSON_FILTERS });
    return selected;
  },
};
