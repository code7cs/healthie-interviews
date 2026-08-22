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

async function addTask(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  await user.type(screen.getByRole('textbox', { name: 'Task title' }), title);
  await user.click(screen.getByRole('combobox', { name: 'Character' }));

  await user.click(screen.getByRole('option', { name: 'Rick Sanchez' }));
  await user.click(screen.getByRole('button', { name: 'Add task' }));
}

function renderBoard() {
  return render(
    <KanbanBoard
      characters={characters}
      characterStatus="success"
      characterError={null}
      onRetryCharacters={vi.fn()}
    />,
  );
}
describe('KanbanBoard', () => {
  it('creates assigned tasks in To Do', async () => {
    const user = userEvent.setup();

    renderBoard();

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

  it('deletes an individual task from the board', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Remove this task');

    await user.click(
      screen.getByRole('button', { name: 'Delete Remove this task' }),
    );

    expect(screen.queryByText('Remove this task')).not.toBeInTheDocument();
  });

  it('resets the board after confirmation and clears the cache', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderBoard();
    await addTask(user, 'Reset this task');

    expect(screen.getByRole('button', { name: 'Reset board' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Reset board' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText('Reset this task')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset board' })).toBeDisabled();
    expect(window.localStorage.length).toBe(0);
    confirmSpy.mockRestore();
  });
});
