import type { JSX } from 'preact';
import { getZoneLegendText } from './helpers';
import type ZoneLegendProps from './types';
import styles from './ZoneLegend.module.css';

export type { ZoneLegendProps };

/** The zone legend under a table or a chart (US-12.5): one swatch and one
 * text for each zone, in place order (Task 155 choice 7, Task 190). It
 * shows nothing for no zone. */
export function ZoneLegend({ zones }: ZoneLegendProps): JSX.Element | null {
  if (zones.length === 0) return null;
  return (
    <ul class={styles.legend} aria-label="Zones">
      {zones.map((zone) => (
        <li class={styles.item} key={zone.colour}>
          <span class={styles.swatch} data-zone={zone.colour} />
          {getZoneLegendText(zone)}
        </li>
      ))}
    </ul>
  );
}
ZoneLegend.displayName = 'ZoneLegend';
