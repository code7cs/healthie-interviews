import { Feedback, KeyboardSensor, PointerSensor } from '@dnd-kit/dom';
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import { useSortable } from '@dnd-kit/react/sortable';
import type { ColumnId, KanbanItem } from './board.types';
import styles from './board.module.css';

const TASK_CARD_SENSORS = [
  PointerSensor.configure({
    activatorElements: (source) => [source.handle, source.element],
  }),
  KeyboardSensor,
];

type Props = {
  item: KanbanItem;
  columnId: ColumnId;
  index: number;
};

export function TaskCard({ item, columnId, index }: Props) {
  const { ref, handleRef, isDragging } = useSortable({
    id: item.id,
    index,
    group: columnId,
    type: 'item',
    accept: 'item',
    data: { columnId },
    sensors: TASK_CARD_SENSORS,
    plugins: [SortableKeyboardPlugin, Feedback.configure({ feedback: 'move' })],
  });

  return (
    <article
      ref={ref}
      className={styles.card}
      data-dragging={isDragging || undefined}
    >
      <button
        ref={handleRef}
        className={styles.dragHandle}
        type="button"
        aria-label={'Drag ' + item.title}
        title="Drag task"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>

      <img
        className={styles.avatar}
        src={item.assignee.image}
        alt={item.assignee.name}
        width="44"
        height="44"
      />
      <div>
        <h3 className={styles.taskTitle}>{item.title}</h3>
        <p className={styles.assignee}>Assigned to {item.assignee.name}</p>
      </div>
    </article>
  );
}
