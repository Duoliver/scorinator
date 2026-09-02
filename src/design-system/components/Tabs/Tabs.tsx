import type TabsProps from './types';
import type { TabItem } from './types';
import styles from './Tabs.module.css';

export type { TabsProps, TabItem };

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
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
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
