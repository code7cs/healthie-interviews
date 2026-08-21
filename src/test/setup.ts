import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

class TestResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  observe() {}

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver;
