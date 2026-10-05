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
  /** Stretches the tablist to fill its container, each tab getting equal
   * width — a stepper look, for a wizard with few, evenly-important steps.
   * Default (false) keeps the tablist only as wide as its labels need. */
  fullWidth?: boolean;
  /** Scrolls the window to the top whenever the active tab changes, from a
   * tab click or from `ref.setValue` — for a wizard, where each step should
   * start at its top. Not on mount, and not when the active tab is picked
   * again. Default (false) leaves the scroll position alone. */
  scrollToTopOnChange?: boolean;
}
