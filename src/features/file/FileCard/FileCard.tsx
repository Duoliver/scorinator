import type { JSX } from 'preact';
import { Card } from '@/design-system';
import type FileCardProps from './types';
import styles from './FileCard.module.css';

export type { FileCardProps };

/** One action card of the File screen: a title and description on the
 * left, the card's controls on the right, and an optional full-width
 * footer underneath, as in `Footballer - File Manager.dc.html`. A card
 * with an `input` puts the input and the controls on a shared row under
 * the text instead. */
export function FileCard({
  title,
  description,
  children,
  input,
  footer,
}: FileCardProps): JSX.Element {
  const text = (
    <div class={styles.text}>
      <h3 class={styles.title}>{title}</h3>
      <p class={styles.description}>{description}</p>
    </div>
  );
  const controls = children && <div class={styles.controls}>{children}</div>;

  return (
    <Card padding="lg">
      <div class={styles.card}>
        {input ? (
          <>
            {text}
            <div class={styles.inputRow}>
              <div class={styles.input}>{input}</div>
              {controls}
            </div>
          </>
        ) : (
          <div class={styles.top}>
            {text}
            {controls}
          </div>
        )}
        {footer}
      </div>
    </Card>
  );
}
FileCard.displayName = 'FileCard';
