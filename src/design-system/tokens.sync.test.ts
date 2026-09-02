import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colors } from './tokens';

const cssPath = resolve(import.meta.dirname, 'tokens.css');
const css = readFileSync(cssPath, 'utf-8');

function cssValueOf(variable: string): string | undefined {
  const match = css.match(new RegExp(`--${variable}:\\s*([^;]+);`));
  return match?.[1].trim();
}

describe('tokens.ts stays in sync with tokens.css', () => {
  it.each([
    ['color-bg', colors.bg],
    ['color-surface', colors.surface],
    ['color-fg', colors.fg],
    ['color-fg-muted', colors.fgMuted],
    ['color-accent', colors.accent],
    ['color-accent-fg', colors.accentFg],
    ['color-error', colors.error],
    ['color-error-fg', colors.errorFg],
    ['color-warning', colors.warning],
    ['color-warning-fg', colors.warningFg],
  ])('--%s matches tokens.ts', (variable, tsValue) => {
    expect(cssValueOf(variable)?.toUpperCase()).toBe(tsValue.toUpperCase());
  });
});
