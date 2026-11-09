import { useId } from 'preact/hooks';
import type { JSX } from 'preact';
import { Card } from '@/design-system';
import type FileCardProps from './types';
import styles from './FileCard.module.css';

export type { FileCardProps };

/** One action card of the File screen: a title and description on the
 * left, the card's controls on the right, and an optional full-width
 * footer underneath, as in `Footballer - File Manager.dc.html`. The card is
 * a group named by its title, because two cards have the same button
 * text. */
export function FileCard({
  title,
  description,
  children,
  footer,
}: FileCardProps): JSX.Element {
  const titleId = useId();

  return (
    <Card padding="lg">
      <div class={styles.card} role="group" aria-labelledby={titleId}>
        <div class={styles.top}>
          <div class={styles.text}>
            <h3 id={titleId} class={styles.title}>
              {title}
            </h3>
            <p class={styles.description}>{description}</p>
          </div>
          {children && <div class={styles.controls}>{children}</div>}
        </div>
        {footer}
      </div>
    </Card>
  );
}
FileCard.displayName = 'FileCard';
