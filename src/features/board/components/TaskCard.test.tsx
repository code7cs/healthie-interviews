const { dndMocks, sortableKeyboardPlugin } = vi.hoisted(() => {
  const Feedback = {
    configure: (options: unknown) => ({ plugin: Feedback, options }),
  };
  const PointerSensor = {
    configure: (options: unknown) => ({ plugin: PointerSensor, options }),
  };

  return {
    dndMocks: {
      Feedback,
      KeyboardSensor: { name: 'KeyboardSensor' },
      PointerSensor,
    },
    sortableKeyboardPlugin: { name: 'SortableKeyboardPlugin' },
  };
});

import { Feedback, KeyboardSensor, PointerSensor } from '@dnd-kit/dom';
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { useSortableMock } = vi.hoisted(() => ({
  useSortableMock: vi.fn(),
}));

vi.mock('@dnd-kit/dom', () => dndMocks);
vi.mock('@dnd-kit/dom/sortable', () => ({
  SortableKeyboardPlugin: sortableKeyboardPlugin,
}));
vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: useSortableMock,
}));

import { TaskCard } from './TaskCard';

const item = {
  id: 'task-1',
  title: 'Prepare client notes',
  assignee: {
    id: 'character-1',
    name: 'Rick Sanchez',
    image: 'https://example.com/rick.jpg',
  },
};

describe('TaskCard', () => {
  it('keeps optimistic sorting disabled while preserving keyboard feedback', () => {
    useSortableMock.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
      isDropTarget: true,
    });

    render(<TaskCard item={item} columnId="todo" index={0} />);

    const options = useSortableMock.mock.calls[0]?.[0] as {
      data?: { columnId?: string };
      plugins?: unknown[];
      sensors?: unknown[];
    };

    expect(options.plugins).toEqual([
      SortableKeyboardPlugin,
      { plugin: Feedback, options: { feedback: 'move' } },
    ]);
    expect(options.data).toEqual({ columnId: 'todo' });
    expect(options.sensors?.[1]).toBe(KeyboardSensor);
    const pointerSensor = options.sensors?.[0] as
      | { plugin?: unknown }
      | undefined;
    expect(pointerSensor?.plugin).toBe(PointerSensor);
    expect(screen.getByTestId('drop-target-card')).toBeInTheDocument();
    expect(screen.queryByTestId('drop-placeholder')).not.toBeInTheDocument();
  });

  it('exposes a delete action without changing the drag configuration', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    useSortableMock.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
      isDropTarget: false,
    });

    render(
      <TaskCard
        item={item}
        columnId="todo"
        index={0}
        onDelete={onDelete}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'Delete Prepare client notes' }),
    );

    expect(onDelete).toHaveBeenCalledWith('task-1');
  });
});
