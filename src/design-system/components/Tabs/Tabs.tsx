import { forwardRef } from 'preact/compat';
import { useLayoutEffect, useRef } from 'preact/hooks';
import type TabsProps from './types';
import type { TabItem } from './types';
import type { FieldHandle } from '@/design-system/field';
import { useFieldHandle } from '@/design-system/useFieldHandle';
import styles from './Tabs.module.css';

export type { TabsProps, TabItem };

/** `FieldHandle<string>` here means "the active tab id" — the same ref API
 * `Input`/`Select`/`Switch`/`Checkbox` expose for their own value. This is
 * what lets a caller outside `Tabs` switch tabs (`tabsRef.current?.setValue(id)`)
 * without lifting the active-tab state up into its own parent. */
export const Tabs = forwardRef<FieldHandle<string>, TabsProps>(
  ({ tabs, defaultTab, onChange, fullWidth, scrollToTopOnChange }, ref) => {
    const tabButtonsRef = useRef(new Map<string, HTMLButtonElement>());
    const { value: activeId, commitValue } = useFieldHandle(ref, {
      defaultValue: defaultTab,
      onChange,
      focus: (current) => tabButtonsRef.current.get(current)?.focus(),
    });

    // Starts at `defaultTab`, so the mount itself never counts as a change.
    // A layout effect, so the scroll happens before the paint, and the new
    // tab never shows for one frame at the old scroll position.
    const scrolledForIdRef = useRef(activeId);
    useLayoutEffect(() => {
      if (scrolledForIdRef.current === activeId) return;
      scrolledForIdRef.current = activeId;
      if (scrollToTopOnChange) window.scrollTo({ top: 0 });
    }, [activeId, scrollToTopOnChange]);

    const activeTab = tabs.find((tab) => tab.id === activeId);

    return (
      <div class={styles.wrapper}>
        <div
          class={`${styles.tabs} ${fullWidth ? styles.tabsFullWidth : ''}`}
          role="tablist"
        >
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
