import { useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { Button, Card, Input, Select, type FieldHandle } from '@/design-system';
import {
  FORMAT_OPTIONS,
  formatKeyOf,
  parseWholeNumber,
  type PhaseFormatKey,
} from '@/features/leagues/LeagueSetupScreen/phasePlans';
import { phaseShortName } from '@/features/leagues/leagueSummary';
import { BracketSettings } from '@/features/leagues/LeagueSetupScreen/steps/PhasesStep/BracketSettings';
import type PhaseCardProps from './types';
import type { PhaseCardView } from './types';
import styles from './PhaseCard.module.css';

export type { PhaseCardProps, PhaseCardView };

const SET_BY_OPTIONS = [
  { value: 'size', label: 'Group size' },
  { value: 'count', label: 'Group count' },
];

/** The text of a number field: empty for a `NaN` (choice 4). */
const numberText = (value: number): string =>
  Number.isFinite(value) ? String(value) : '';

/**
 * One phase of the Phases step (Task 129, handoff step 2): the number badge,
 * the short name, ↑ ↓ ✕, the format field, the Groups setting, and the
 * advancement. Bracket is in the format field of the last phase only
 * (US-01.3). A Bracket card shows its settings (Task 140).
 */
export function PhaseCard({ view, phaseList }: PhaseCardProps): JSX.Element {
  const {
    plan,
    index,
    isLast,
    canRemove,
    canMoveUp,
    canMoveDown,
    lines,
    problems,
    suggestion,
    bracket,
  } = view;
  const bestRef = useRef<FieldHandle<string>>(null);
  const number = index + 1;
  // The suggestion sets the plan, and the field through its handle: the
  // field is uncontrolled (Task 177).
  const applySuggestion = (m: number): void => {
    phaseList.setBestOfNext(index, m);
    bestRef.current?.setValue(String(m));
  };
  const formatOptions = isLast
    ? FORMAT_OPTIONS
    : FORMAT_OPTIONS.filter((option) => option.value !== 'bracket');
  const advance = plan.format === 'bracket' ? undefined : plan.advance;
  const bestOfNext = plan.format === 'groups' ? plan.advance?.bestOfNext : undefined;
  const nextPlace =
    advance && Number.isFinite(advance.top)
      ? `place ${advance.top + 1}`
      : 'the next place';

  return (
    <section aria-label={`Phase ${number}`}>
      <Card padding="lg">
        <div class={styles.card}>
          <div class={styles.header}>
            <div class={styles.title}>
              <span class={styles.number}>{number}</span>
              <h3>{phaseShortName(plan)}</h3>
            </div>
            <div class={styles.actions}>
              <Button
                size="icon"
                variant="secondary"
                aria-label={`Move phase ${number} up`}
                disabled={!canMoveUp}
                onClick={() => phaseList.movePhase(index, -1)}
              >
                ↑
              </Button>
              <Button
                size="icon"
                variant="secondary"
                aria-label={`Move phase ${number} down`}
                disabled={!canMoveDown}
                onClick={() => phaseList.movePhase(index, 1)}
              >
                ↓
              </Button>
              <Button
                size="icon"
                variant="secondary"
                aria-label={`Remove phase ${number}`}
                disabled={!canRemove}
                onClick={() => phaseList.removePhase(index)}
              >
                ✕
              </Button>
            </div>
          </div>

          <div class={styles.format}>
            <Select
              key={formatOptions.length}
              label="Format"
              options={[...formatOptions]}
              defaultValue={formatKeyOf(plan)}
              onChange={(value) => phaseList.setFormat(index, value as PhaseFormatKey)}
            />
          </div>

          {plan.format === 'groups' && (
            <div class={styles.fields}>
              <Select
                label="Set by"
                options={SET_BY_OPTIONS}
                defaultValue={plan.grouping.by}
                onChange={(value) =>
                  phaseList.setGroupBy(index, value as 'size' | 'count')
                }
              />
              <div class={styles['number-field']}>
                <Input
                  key={plan.grouping.by}
                  label={plan.grouping.by === 'size' ? 'Group size' : 'Group count'}
                  inputMode="numeric"
                  defaultValue={numberText(
                    plan.grouping.by === 'size'
                      ? plan.grouping.size
                      : plan.grouping.count
                  )}
                  onChange={(text) =>
                    phaseList.setGroupNumber(index, parseWholeNumber(text))
                  }
                />
              </div>
            </div>
          )}

          {advance && (
            <div class={styles.fields}>
              <div class={styles.advance}>
                <div class={styles['number-field']}>
                  <Input
                    label="Top"
                    inputMode="numeric"
                    defaultValue={numberText(advance.top)}
                    onChange={(text) => phaseList.setTop(index, parseWholeNumber(text))}
                  />
                </div>
                <span class={styles['advance-text']}>
                  {plan.format === 'groups'
                    ? 'advance per group'
                    : 'advance to the next phase'}
                </span>
              </div>
              {bestOfNext !== undefined && (
                <div class={styles['number-field']}>
                  <Input
                    ref={bestRef}
                    label={`Best of ${nextPlace}`}
                    inputMode="numeric"
                    defaultValue={numberText(bestOfNext)}
                    onChange={(text) =>
                      phaseList.setBestOfNext(index, parseWholeNumber(text))
                    }
                  />
                </div>
              )}
            </div>
          )}

          {bracket && (
            <BracketSettings index={index} bracket={bracket} phaseList={phaseList} />
          )}

          {lines.sizes && <p class={styles.line}>{lines.sizes}</p>}
          {lines.qualifiers && <p class={styles.line}>{lines.qualifiers}</p>}
          {suggestion && (
            <div class={styles.suggestion}>
              <p class={styles.line}>{suggestion.text}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applySuggestion(suggestion.m)}
              >
                {`Use best ${suggestion.m}`}
              </Button>
            </div>
          )}
          {problems.map((text) => (
            <p key={text} class={styles.problem}>
              {text}
            </p>
          ))}
        </div>
      </Card>
    </section>
  );
}
PhaseCard.displayName = 'PhaseCard';
