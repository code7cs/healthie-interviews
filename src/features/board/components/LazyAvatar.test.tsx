import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LazyAvatar } from './LazyAvatar';

let intersectionCallback:
  | ((entries: IntersectionObserverEntry[]) => void)
  | undefined;

const observe = vi.fn();
const disconnect = vi.fn();

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '100px';
  readonly scrollMargin = '';
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = (entries) => callback(entries, this);
  }

  disconnect = disconnect;
  observe = observe;
  unobserve = vi.fn();
  takeRecords = () => [];
}

describe('LazyAvatar', () => {
  beforeEach(() => {
    intersectionCallback = undefined;
    observe.mockReset();
    disconnect.mockReset();
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('waits to request a lazy image until its container is visible', () => {
    const { container } = render(
      <LazyAvatar
        src="https://example.com/rick.jpeg"
        alt=""
        fallbackLabel="Rick Sanchez"
        className="avatar"
      />,
    );

    const imageContainer = container.firstElementChild;

    expect(imageContainer).not.toBeNull();
    expect(observe).toHaveBeenCalledWith(imageContainer);
    expect(container.querySelector('img')).toBeNull();

    act(() => {
      intersectionCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('src', 'https://example.com/rick.jpeg');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
    expect(disconnect).toHaveBeenCalled();
  });

  it('loads the selected avatar eagerly', () => {
    const { container } = render(
      <LazyAvatar
        src="https://example.com/morty.jpeg"
        alt=""
        fallbackLabel="Morty Smith"
        className="avatar"
        eager
      />,
    );

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('src', 'https://example.com/morty.jpeg');
    expect(image).toHaveAttribute('loading', 'eager');
  });
});
