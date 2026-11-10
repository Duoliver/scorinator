import type { JSX } from 'preact';
import { Button, Drawer } from '@/design-system';
import { ZoneEditor } from '@/features/leagues/ZoneEditor';
import type ZoneDrawerProps from './types';
import { useZoneDrawer } from './useZoneDrawer';
import styles from './ZoneDrawer.module.css';

export type { ZoneDrawerProps };

/** "Edit zones" of one phase in League Detail (US-12.5, Task 189 choice 6):
 * the zone editor, with Save and Cancel. Save is off while the zones have a
 * problem. The editor shows the problem. */
export function ZoneDrawer({
  title,
  plan,
  onSave,
  onCancel,
}: ZoneDrawerProps): JSX.Element {
  const { setZones, canSave, handleSave } = useZoneDrawer(plan, onSave);
  return (
    <Drawer title={title} onClose={onCancel}>
      <div class={styles.body}>
        <ZoneEditor plan={plan} onChange={setZones} />
        <div class={styles.buttons}>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
ZoneDrawer.displayName = 'ZoneDrawer';
