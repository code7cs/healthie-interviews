import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ColumnId } from './board.types';

type SortableFixture = {
  id: string;
  initialGroup: ColumnId;
  group: ColumnId;
  initialIndex: number;
  index: number;
};

type DropTargetFixture = SortableFixture & {
  data: { columnId: ColumnId };
};

type ColumnDropTargetFixture = {
  id: string;
  data: { columnId: ColumnId };
};

type DragEndEventFixture = {
  canceled?: boolean;
  operation: {
    source: SortableFixture;
    target?: DropTargetFixture | ColumnDropTargetFixture;
  };
};

const { dragEndHandler } = vi.hoisted(() => ({
  dragEndHandler: vi.fn(),
}));

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: (props: {
    children: ReactNode;
    onDragEnd: (event: DragEndEventFixture) => void;
  }) => {
    dragEndHandler.mockImplementation(props.onDragEnd);
    return props.children;
  },
  useDroppable: () => ({
    ref: vi.fn(),
    isDropTarget: false,
  }),
}));

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: (value: unknown): value is SortableFixture =>
    typeof value === 'object' && value !== null && 'initialGroup' in value,
  useSortable: () => ({
    ref: vi.fn(),
    handleRef: vi.fn(),
    isDragging: false,
  }),
}));

import { KanbanBoard } from './KanbanBoard';

const character = {
  id: 'character-1',
  name: 'Rick Sanchez',
  image: 'https://example.com/rick.jpeg',
};

let nextTaskId = 1;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderBoard() {
  nextTaskId = 1;
  vi.stubGlobal('crypto', {
    randomUUID: () => 'task-' + nextTaskId++,
  });

  return render(
    <KanbanBoard
      characters={[character]}
      characterStatus="success"
      characterError={null}
      onRetryCharacters={vi.fn()}
    />,
  );
}

async function addTask(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.type(
    screen.getByRole('textbox', { name: 'Task title' }),
    title,
  );
  await user.click(screen.getByRole('combobox', { name: 'Character' }));
  await user.click(screen.getByRole('option', { name: 'Rick Sanchez' }));
  await user.click(screen.getByRole('button', { name: 'Add task' }));
}

function sortableSource(
  id: string,
  group: ColumnId,
  index: number,
): SortableFixture {
  return {
    id,
    initialGroup: group,
    group,
    initialIndex: index,
    index,
  };
}

function sortableTarget(
  id: string,
  group: ColumnId,
  index: number,
): DropTargetFixture {
  return {
    ...sortableSource(id, group, index),
    data: { columnId: group },
  };
}

function columnTarget(columnId: ColumnId): ColumnDropTargetFixture {
  return {
    id: 'column:' + columnId,
    data: { columnId },
  };
}

function endDrag(event: DragEndEventFixture) {
  act(() => {
    dragEndHandler(event);
  });
}

function columnItems(columnName: string) {
  return within(screen.getByRole('region', { name: columnName }))
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

describe('KanbanBoard drag and drop', () => {
  it('moves a task between columns using the target sortable index', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');

    endDrag({
      operation: {
        source: sortableSource('task-1', 'todo', 0),
        target: columnTarget('doing'),
      },
    });
    endDrag({
      operation: {
        source: sortableSource('task-2', 'todo', 0),
        target: sortableTarget('task-1', 'doing', 0),
      },
    });

    expect(columnItems('To Do')).toEqual([]);
    expect(columnItems('Doing')).toEqual(['Task two', 'Task one']);
  });

  it('reorders tasks downward within the same column', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');
    await addTask(user, 'Task three');

    endDrag({
      operation: {
        source: sortableSource('task-1', 'todo', 0),
        target: sortableTarget('task-3', 'todo', 2),
      },
    });

    expect(columnItems('To Do')).toEqual([
      'Task two',
      'Task three',
      'Task one',
    ]);
  });

  it('reorders tasks upward within the same column', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');
    await addTask(user, 'Task three');

    endDrag({
      operation: {
        source: sortableSource('task-3', 'todo', 2),
        target: sortableTarget('task-1', 'todo', 0),
      },
    });

    expect(columnItems('To Do')).toEqual([
      'Task three',
      'Task one',
      'Task two',
    ]);
  });

  it('appends a task when dropped into an empty column target', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');

    endDrag({
      operation: {
        source: sortableSource('task-1', 'todo', 0),
        target: columnTarget('doing'),
      },
    });

    expect(columnItems('To Do')).toEqual(['Task two']);
    expect(columnItems('Doing')).toEqual(['Task one']);
  });

  it('ignores a drag with no valid drop target', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    endDrag({
      operation: {
        source: sortableSource('task-1', 'todo', 0),
      },
    });

    expect(columnItems('To Do')).toEqual(['Task one']);
    expect(columnItems('Doing')).toEqual([]);
  });
});
