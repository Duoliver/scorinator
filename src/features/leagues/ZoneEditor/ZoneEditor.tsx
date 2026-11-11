import type { JSX } from 'preact';
import { Input, Switch } from '@/design-system';
import type ZoneEditorProps from './types';
import { useZoneEditor } from './useZoneEditor';
import styles from './ZoneEditor.module.css';

export type { ZoneEditorProps };

/**
 * The zones of one round-robin or Groups phase (US-12.5, Task 189): one row
 * for each colour. An automatic zone shows its places as text, and only its
 * label changes. A free zone has a switch, and its places and label when it
 * is on. The problems of `checkZones` show under the rows.
 */
export function ZoneEditor(props: ZoneEditorProps): JSX.Element {
  const { rows, problems, changeRow } = useZoneEditor(props);
  return (
    <div class={styles.container}>
      <div class={styles.editor}>
        {rows.map((row) => (
          <div
            key={row.colour}
            class={styles.row}
            role="group"
            aria-label={`${row.name} zone`}
          >
            {/* The swatch and the name or switch stay together, at the top of
              the row, so they do not move when the fields show or hide (Task
              178). */}
            <div class={styles.lead}>
              <span class={styles.swatch} data-zone={row.colour} />
              {row.automatic ? (
                <span class={styles.name}>
                  <strong>{row.name}</strong>
                  <span class={styles.places}>{row.places}</span>
                </span>
              ) : (
                <span class={styles.name}>
                  <Switch
                    label={row.name}
                    defaultChecked={row.values.on}
                    onChange={(on) => changeRow(row.colour, { on })}
                  />
                </span>
              )}
            </div>
            {(row.automatic || row.values.on) && (
              <div class={styles.fields}>
                {!row.automatic && (
                  <>
                    <div class={styles.place}>
                      <Input
                        label="From"
                        type="number"
                        min={1}
                        defaultValue={row.values.from}
                        onChange={(from) => changeRow(row.colour, { from })}
                      />
                    </div>
                    <div class={styles.place}>
                      <Input
                        label="To"
                        type="number"
                        min={1}
                        defaultValue={row.values.to}
                        onChange={(to) => changeRow(row.colour, { to })}
                      />
                    </div>
                  </>
                )}
                <div class={styles.label}>
                  <Input
                    label="Label"
                    defaultValue={row.values.label}
                    onChange={(label) => changeRow(row.colour, { label })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {problems.map((text) => (
          <p key={text} class={styles.problem}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
ZoneEditor.displayName = 'ZoneEditor';
