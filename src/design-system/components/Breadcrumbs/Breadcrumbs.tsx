import type { JSX } from 'preact';
import type BreadcrumbsProps from './types';
import type { BreadcrumbItem } from './types';
import styles from './Breadcrumbs.module.css';

export type { BreadcrumbsProps, BreadcrumbItem };

/** The path from a top screen to the current one, in place of a single
 * back link, so each level stays one click away (Task 215 point 7). The
 * last item is the current page. */
export function Breadcrumbs({ items }: BreadcrumbsProps): JSX.Element {
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumbs">
      <ol class={styles.list}>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} class={styles.item}>
            {item.href && index !== last ? (
              <a href={item.href} class={styles.link}>
                {item.label}
              </a>
            ) : (
              <span aria-current={index === last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
Breadcrumbs.displayName = 'Breadcrumbs';
