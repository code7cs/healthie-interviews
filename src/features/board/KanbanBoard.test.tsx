import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KanbanBoard } from './KanbanBoard';

const characters = [
  {
    id: '1',
    name: 'Rick Sanchez',
    image: 'https://example.com/rick.jpeg',
  },
];

describe('KanbanBoard', () => {
  it('creates assigned tasks in To Do', async () => {
    const user = userEvent.setup();

    render(
      <KanbanBoard
        characters={characters}
        characterStatus="success"
        characterError={null}
        onRetryCharacters={vi.fn()}
      />,
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Task title' }),
      'Prepare client notes',
    );
    await user.click(screen.getByRole('combobox', { name: 'Character' }));
    await user.click(screen.getByRole('option', { name: 'Rick Sanchez' }));
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    const todo = screen.getByRole('region', { name: 'To Do' });

    expect(within(todo).getByText('Prepare client notes')).toBeInTheDocument();
    expect(
      within(todo).getByText('Assigned to Rick Sanchez'),
    ).toBeInTheDocument();
  });
});
