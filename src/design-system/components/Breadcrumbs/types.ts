/** One step of the path to the current screen. An item with no `href` is
 * the current screen. */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default interface BreadcrumbsProps {
  /** The steps from the top screen down to the current one, in order. */
  items: readonly BreadcrumbItem[];
}
