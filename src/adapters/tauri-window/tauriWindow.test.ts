import { describe, expect, it } from 'vitest';
import { choiceFromLabel } from './tauriWindow';

describe('choiceFromLabel', () => {
  it('maps the Save button to save', () => {
    expect(choiceFromLabel('Save')).toBe('save');
  });

  it("maps the Don't save button to discard", () => {
    expect(choiceFromLabel("Don't save")).toBe('discard');
  });

  it('maps Cancel to cancel', () => {
    expect(choiceFromLabel('Cancel')).toBe('cancel');
  });

  it('maps any other answer, such as a closed dialog, to cancel', () => {
    expect(choiceFromLabel('')).toBe('cancel');
    expect(choiceFromLabel('Ok')).toBe('cancel');
  });
});
