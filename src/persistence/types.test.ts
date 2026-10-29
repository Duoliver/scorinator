import { describe, expectTypeOf, it } from 'vitest';
import type { DatabaseFolder, WrapperText } from './types';

// Compile-time checks only: `npm run type-check` fails when a rule breaks.

describe('DatabaseFolder (Task 76)', () => {
  it('reads the manifest as text, or null before the first save', () => {
    expectTypeOf<DatabaseFolder['readManifest']>().returns.resolves.toEqualTypeOf<
      string | null
    >();
  });

  it('reads one wrapper as text, by its uuid', () => {
    expectTypeOf<DatabaseFolder['readWrapper']>().parameters.toEqualTypeOf<
      [uuid: string]
    >();
    expectTypeOf<
      DatabaseFolder['readWrapper']
    >().returns.resolves.toEqualTypeOf<string>();
  });

  it('saves wrapper texts and a manifest text, or null for an unchanged manifest', () => {
    expectTypeOf<DatabaseFolder['save']>().parameters.toEqualTypeOf<
      [wrappers: readonly WrapperText[], manifest: string | null]
    >();
    expectTypeOf<DatabaseFolder['save']>().returns.resolves.toEqualTypeOf<void>();
  });

  it('names each wrapper text by its uuid', () => {
    expectTypeOf<WrapperText>().toEqualTypeOf<{ uuid: string; contents: string }>();
  });
});
