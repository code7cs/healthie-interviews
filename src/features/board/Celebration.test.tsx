import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Celebration } from './Celebration';

describe('Celebration', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifies the parent after the celebration interval', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(<Celebration onComplete={onComplete} />);

    expect(screen.getByRole('status')).toHaveTextContent('Task completed!');
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1_400);
    });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('renders a non-interactive confetti layer', () => {
    render(<Celebration onComplete={vi.fn()} />);

    const confettiLayer = screen.getByTestId('confetti-layer');

    expect(confettiLayer).toHaveAttribute('aria-hidden', 'true');
    expect(confettiLayer.querySelectorAll('span')).toHaveLength(16);
  });
});
