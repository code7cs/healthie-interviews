import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateTaskForm } from './CreateTaskForm';

const characters = [
  {
    id: '1',
    name: 'Rick Sanchez',
    image: 'https://example.com/rick.jpeg',
  },
];

describe('CreateTaskForm', () => {
  it('requires a title and character', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskForm
        characters={characters}
        characterStatus="success"
        characterError={null}
        onRetryCharacters={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByText('Enter a task title.')).toBeInTheDocument();
    expect(screen.getByText('Choose a character.')).toBeInTheDocument();
  });

  it('submits trimmed input and resets the fields', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(
      <CreateTaskForm
        characters={characters}
        characterStatus="success"
        characterError={null}
        onRetryCharacters={vi.fn()}
        onCreate={onCreate}
      />,
    );

    const title = screen.getByRole('textbox', { name: 'Task title' });
    const assignee = screen.getByRole('combobox', { name: 'Character' });

    await user.type(title, '  Prepare client notes  ');
    await user.selectOptions(assignee, '1');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(onCreate).toHaveBeenCalledWith({
      title: 'Prepare client notes',
      assignee: characters[0],
    });
    expect(title).toHaveValue('');
    expect(assignee).toHaveValue('');
  });

  it('explains when no character options are returned', () => {
    render(
      <CreateTaskForm
        characters={[]}
        characterStatus="success"
        characterError={null}
        onRetryCharacters={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'No characters are currently available.',
    );
    expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled();
  });

  it('shows retry UI when characters fail to load', async () => {
    const user = userEvent.setup();
    const onRetryCharacters = vi.fn();

    render(
      <CreateTaskForm
        characters={[]}
        characterStatus="error"
        characterError="Network unavailable"
        onRetryCharacters={onRetryCharacters}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry characters' }));
    expect(onRetryCharacters).toHaveBeenCalledOnce();
  });
});
