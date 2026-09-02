import type { ComponentChildren } from 'preact';

export interface TabItem {
  id: string;
  label: string;
  content: ComponentChildren;
}

export default interface TabsProps {
  tabs: TabItem[];
  /** Which tab is active on mount. Uncontrolled — Tabs owns switching itself. */
  defaultTab: string;
  /** Notified whenever the active tab changes (e.g. to sync a URL param or lazy-load). */
  onChange?: (id: string) => void;
}
