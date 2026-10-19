import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('gives the message of an Error', () => {
    expect(getErrorMessage(new RangeError('Bad slug.'))).toBe('Bad slug.');
  });

  it('gives a thrown string as it is', () => {
    expect(getErrorMessage('Permission denied.')).toBe('Permission denied.');
  });

  it('gives the text form of any other thrown value', () => {
    expect(getErrorMessage(42)).toBe('42');
    expect(getErrorMessage(undefined)).toBe('undefined');
  });
});
