import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColumnId } from './board.types';

type SortableFixture = {
  id: string;
  group: ColumnId;
  index: number;
  initialGroup: ColumnId;
  initialIndex: number;
  data?: { columnId: ColumnId };
};

type DropTargetFixture = {
  id: string;
  group?: ColumnId;
  index?: number;
  data?: { columnId?: unknown };
};

type DragEventFixture = {
  canceled?: boolean;
  operation: {
    source: SortableFixture;
    target?: DropTargetFixture;
  };
};

const { dragStartHandler, dragOverHandler, dragEndHandler } = vi.hoisted(
  () => ({
    dragStartHandler: vi.fn(),
    dragOverHandler: vi.fn(),
    dragEndHandler: vi.fn(),
  }),
);

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: (props: {
    children: ReactNode;
    onDragStart?: (event: DragEventFixture) => void;
    onDragOver?: (event: DragEventFixture) => void;
    onDragEnd?: (event: DragEventFixture) => void;
  }) => {
    dragStartHandler.mockImplementation(props.onDragStart ?? (() => {}));
    dragOverHandler.mockImplementation(props.onDragOver ?? (() => {}));
    dragEndHandler.mockImplementation(props.onDragEnd ?? (() => {}));
    return props.children;
  },
  useDroppable: () => ({
    ref: vi.fn(),
    isDropTarget: false,
  }),
  DragOverlay: ({ children, className }: { children?: ReactNode; className?: string }) =>
    children ? (
      <div className={className} data-testid="drag-overlay">
        {children}
      </div>
    ) : null,
}));

vi.mock('@dnd-kit/dom', () => ({
  Feedback: { configure: () => ({}) },
  KeyboardSensor: {},
  PointerSensor: { configure: () => ({}) },
}));

vi.mock('@dnd-kit/dom/sortable', () => ({
  SortableKeyboardPlugin: {},
}));

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: (value: unknown) =>
    Boolean(
      value &&
        typeof value === 'object' &&
        'group' in value &&
        'index' in value,
    ),
  useSortable: () => ({
    ref: vi.fn(),
    handleRef: vi.fn(),
    isDragging: false,
  }),
}));

import { KanbanBoard } from './KanbanBoard';

const characters = [
  {
    id: 'rick',
    name: 'Rick Sanchez',
    image: 'https://example.com/rick.jpg',
  },
  {
    id: 'morty',
    name: 'Morty Smith',
    image: 'https://example.com/morty.jpg',
  },
];

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

async function addTask(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  await screen.getByLabelText('Task title').focus();
  await user.keyboard(title);
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
    group,
    index,
    initialGroup: group,
    initialIndex: index,
  };
}

function sortableTarget(
  id: string,
  group: ColumnId,
  index: number,
): DropTargetFixture {
  return { id, group, index };
}

function columnTarget(columnId: ColumnId): DropTargetFixture {
  return { id: 'column:' + columnId, data: { columnId } };
}

function fallbackColumnTarget(columnId: ColumnId): DropTargetFixture {
  return { id: 'column:' + columnId };
}

function startDrag(event: DragEventFixture) {
  act(() => dragStartHandler(event));
}

function overDrag(event: DragEventFixture) {
  act(() => dragOverHandler(event));
}

function endDrag(event: DragEventFixture) {
  act(() => dragEndHandler(event));
}

function columnItems(columnName: string) {
  return within(screen.getByRole('region', { name: columnName }))
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  dragStartHandler.mockReset();
  dragOverHandler.mockReset();
  dragEndHandler.mockReset();
});

let nextTaskId = 0;

beforeEach(() => {
  nextTaskId = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => 'task-' + ++nextTaskId,
  });
});

describe('KanbanBoard drag and drop', () => {
  it('renders a task preview overlay while dragging', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });

    const overlay = screen.getByTestId('drag-overlay');
    expect(overlay).toHaveTextContent('Task one');
    expect(overlay.className).toContain('dragOverlay');

    endDrag({
      canceled: true,
      operation: { source },
    });

    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('moves a task into an empty column during onDragOver', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });
    overDrag({ operation: { source, target: columnTarget('doing') } });

    expect(columnItems('To Do')).toEqual([]);
    expect(columnItems('Doing')).toEqual(['Task one']);
  });

  it('moves a task onto an existing task in another column', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');

    const first = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source: first } });
    overDrag({ operation: { source: first, target: columnTarget('doing') } });

    const second = sortableSource('task-2', 'todo', 0);
    startDrag({ operation: { source: second } });
    overDrag({
      operation: {
        source: second,
        target: sortableTarget('task-1', 'doing', 0),
      },
    });

    expect(columnItems('To Do')).toEqual([]);
    expect(columnItems('Doing')).toEqual(['Task two', 'Task one']);
  });

  it('reorders upward within the same column', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');
    await addTask(user, 'Task three');

    const source = sortableSource('task-3', 'todo', 2);
    startDrag({ operation: { source } });
    overDrag({
      operation: {
        source,
        target: sortableTarget('task-1', 'todo', 0),
      },
    });

    expect(columnItems('To Do')).toEqual([
      'Task three',
      'Task one',
      'Task two',
    ]);
  });

  it('reorders downward within the same column', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');
    await addTask(user, 'Task three');

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });
    overDrag({
      operation: {
        source,
        target: sortableTarget('task-3', 'todo', 2),
      },
    });

    expect(columnItems('To Do')).toEqual([
      'Task two',
      'Task three',
      'Task one',
    ]);
  });

  it('does not duplicate a move when onDragEnd follows onDragOver', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    const source = sortableSource('task-1', 'todo', 0);
    const event = {
      operation: { source, target: columnTarget('doing') },
    };
    startDrag(event);
    overDrag(event);
    expect(columnItems('Doing')).toEqual(['Task one']);

    endDrag(event);

    expect(columnItems('To Do')).toEqual([]);
    expect(columnItems('Doing')).toEqual(['Task one']);
  });

  it('restores the board when a drag is canceled', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');
    await addTask(user, 'Task two');

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });
    overDrag({ operation: { source, target: columnTarget('doing') } });
    expect(columnItems('Doing')).toEqual(['Task one']);

    endDrag({
      canceled: true,
      operation: { source, target: columnTarget('doing') },
    });

    expect(columnItems('To Do')).toEqual(['Task one', 'Task two']);
    expect(columnItems('Doing')).toEqual([]);
  });

  it('resolves a column from its id when target data is missing', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });
    overDrag({
      operation: { source, target: fallbackColumnTarget('done') },
    });

    expect(columnItems('To Do')).toEqual([]);
    expect(columnItems('Done')).toEqual(['Task one']);
  });

  it('finalizes a drag on end when no over event moved it', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });
    endDrag({ operation: { source, target: columnTarget('doing') } });

    expect(columnItems('To Do')).toEqual([]);
    expect(columnItems('Doing')).toEqual(['Task one']);
  });

  it('ignores a drag with no valid target', async () => {
    const user = userEvent.setup();
    renderBoard();
    await addTask(user, 'Task one');

    const source = sortableSource('task-1', 'todo', 0);
    startDrag({ operation: { source } });
    overDrag({ operation: { source } });
    endDrag({ operation: { source } });

    expect(columnItems('To Do')).toEqual(['Task one']);
    expect(columnItems('Doing')).toEqual([]);
    expect(columnItems('Done')).toEqual([]);
  });
});
