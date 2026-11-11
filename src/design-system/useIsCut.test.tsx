import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { mockTextWidth, resizeText, setTextWidth } from '@/test/textWidth';
import { useIsCut } from './useIsCut';

function Probe(): JSX.Element {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const cut = useIsCut(element);
  return <span ref={setElement}>{cut ? 'cut' : 'whole'}</span>;
}

describe('useIsCut (Task 180)', () => {
  beforeEach(() => mockTextWidth());

  it('is false while the text fits its box', () => {
    setTextWidth(80, 100);
    render(<Probe />);
    expect(screen.getByText('whole')).toBeInTheDocument();
  });

  it('is true when the text is wider than its box', () => {
    setTextWidth(140, 100);
    render(<Probe />);
    expect(screen.getByText('cut')).toBeInTheDocument();
  });

  it('checks again when the box changes size', () => {
    setTextWidth(80, 100);
    render(<Probe />);
    resizeText(140, 100);
    expect(screen.getByText('cut')).toBeInTheDocument();
    resizeText(140, 160);
    expect(screen.getByText('whole')).toBeInTheDocument();
  });

  it('is false with no element', () => {
    function Empty(): JSX.Element {
      return <span>{useIsCut(null) ? 'cut' : 'whole'}</span>;
    }
    setTextWidth(140, 100);
    render(<Empty />);
    expect(screen.getByText('whole')).toBeInTheDocument();
  });
});
