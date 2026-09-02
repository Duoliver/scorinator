import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type TabsProps from './types';
import type { TabItem } from './types';
import styles from './Tabs.module.css';

export type { TabsProps, TabItem };

export function Tabs({ tabs, defaultTab, onChange }: TabsProps): JSX.Element {
  const [activeId, setActiveId] = useState(defaultTab);
  const activeTab = tabs.find((tab) => tab.id === activeId);

  const selectTab = (id: string): void => {
    setActiveId(id);
    onChange?.(id);
  };

  return (
    <div class={styles.wrapper}>
      <div class={styles.tabs} role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              class={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => selectTab(tab.id)}
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
