import { forwardRef } from 'preact/compat';
import { useCallback, useImperativeHandle, useRef, useState } from 'preact/hooks';
import type TabsProps from './types';
import type { TabItem } from './types';
import type { FieldHandle } from '../../field';
import styles from './Tabs.module.css';

export type { TabsProps, TabItem };

/** `FieldHandle<string>` here means "the active tab id" — the same ref API
 * `Input`/`Select`/`Switch`/`Checkbox` expose for their own value. This is
 * what lets a caller outside `Tabs` switch tabs (`tabsRef.current?.setValue(id)`)
 * without lifting the active-tab state up into its own parent. */
export const Tabs = forwardRef<FieldHandle<string>, TabsProps>(
  ({ tabs, defaultTab, onChange, fullWidth }, ref) => {
    const [activeId, setActiveId] = useState(defaultTab);
    const activeIdRef = useRef(activeId);
    const listenersRef = useRef(new Set<(value: string) => void>());
    const tabButtonsRef = useRef(new Map<string, HTMLButtonElement>());
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const commitValue = useCallback((next: string, fromUser: boolean): void => {
      activeIdRef.current = next;
      setActiveId(next);
      listenersRef.current.forEach((listener) => listener(next));
      if (fromUser) onChangeRef.current?.(next);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getValue: (): string => activeIdRef.current,
        setValue: (next: string): void => commitValue(next, false),
        subscribe: (listener: (value: string) => void): (() => void) => {
          listenersRef.current.add(listener);
          return () => listenersRef.current.delete(listener);
        },
        focus: (): void => tabButtonsRef.current.get(activeIdRef.current)?.focus(),
      }),
      [commitValue]
    );

    const activeTab = tabs.find((tab) => tab.id === activeId);

    return (
      <div class={styles.wrapper}>
        <div class={`${styles.tabs} ${fullWidth ? styles.tabsFullWidth : ''}`} role="tablist">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabButtonsRef.current.set(tab.id, el);
                  else tabButtonsRef.current.delete(tab.id);
                }}
                type="button"
                role="tab"
                aria-selected={active}
                class={`${styles.tab} ${active ? styles.tabActive : ''}`}
                onClick={() => commitValue(tab.id, true)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab && <div role="tabpanel">{activeTab.content}</div>}
      </div>
    );
  }
);
Tabs.displayName = 'Tabs';
