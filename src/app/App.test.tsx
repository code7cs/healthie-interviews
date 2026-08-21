import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('../features/characters/useCharacters', () => ({
  useCharacters: () => ({
    data: [],
    status: 'loading',
    error: null,
    retry: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders the application heading without calling the live API', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Character-powered Kanban' }),
    ).toBeInTheDocument();
  });
});
