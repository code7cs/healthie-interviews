import { Feedback, KeyboardSensor, PointerSensor } from '@dnd-kit/dom';
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useSortableMock } = vi.hoisted(() => ({
  useSortableMock: vi.fn(),
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
    image: 'https://example.com/rick.jpeg',
  },
};

describe('TaskCard', () => {
  it('keeps drag feedback in React-owned DOM and avoids optimistic DOM moves', () => {
    useSortableMock.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
    });

    render(<TaskCard item={item} columnId="todo" index={0} />);

    const options = useSortableMock.mock.calls[0]?.[0] as {
      plugins?: unknown[];
    };

    expect(options.plugins).toEqual([
      SortableKeyboardPlugin,
      { plugin: Feedback, options: { feedback: 'move' } },
    ]);
  });

  it('includes its column in sortable target data for cross-column drops', () => {
    useSortableMock.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
    });

    render(<TaskCard item={item} columnId="doing" index={0} />);

    const options = useSortableMock.mock.calls.at(-1)?.[0] as {
      data?: { columnId?: string };
    };

    expect(options.data).toEqual({ columnId: 'doing' });
  });

  it('activates pointer dragging from the card surface as well as the handle', () => {
    useSortableMock.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
    });

    const { container } = render(
      <TaskCard item={item} columnId="todo" index={0} />,
    );
    const card = container.querySelector('article');
    const handle = container.querySelector('button');
    const options = useSortableMock.mock.calls.at(-1)?.[0] as {
      sensors?: unknown[];
    };
    const pointerSensor = options.sensors?.[0] as {
      plugin?: unknown;
      options?: {
        activatorElements?: (source: {
          element: Element;
          handle: Element;
        }) => Element[];
      };
    };

    expect(card).not.toBeNull();
    expect(handle).not.toBeNull();
    expect(options.sensors?.[1]).toBe(KeyboardSensor);
    expect(pointerSensor.plugin).toBe(PointerSensor);
    expect(
      pointerSensor.options?.activatorElements?.({
        element: card!,
        handle: handle!,
      }),
    ).toEqual([handle, card]);
  });
});
