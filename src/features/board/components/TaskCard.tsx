import { Feedback, KeyboardSensor, PointerSensor } from '@dnd-kit/dom';
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import { useSortable } from '@dnd-kit/react/sortable';
import type { ColumnId, KanbanItem } from '../state/board.types';
import styles from '../board.module.css';

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
  onDelete?: (itemId: string) => void;
};

type HandleRef = (element: Element | null) => void;

function TaskCardContent({
  item,
  handleRef,
  onDelete,
}: {
  item: KanbanItem;
  handleRef?: HandleRef;
  onDelete?: () => void;
}) {
  return (
    <>
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
      {onDelete && (
        <button
          className={styles.deleteButton}
          type="button"
          aria-label={'Delete ' + item.title}
          title="Delete task"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 .8 12h8.4L16 7" />
          </svg>
        </button>
      )}
    </>
  );
}

export function TaskCardPreview({ item }: { item: KanbanItem }) {
  return (
    <article className={styles.card} data-drag-preview>
      <TaskCardContent item={item} />
    </article>
  );
}

export function TaskCard({ item, columnId, index, onDelete }: Props) {
  const {
    ref,
    handleRef,
    isDragging,
    isDropTarget,
  } = useSortable({
    id: item.id,
    index,
    group: columnId,
    type: 'item',
    accept: 'item',
    data: { columnId },
    sensors: TASK_CARD_SENSORS,
    // React owns card placement. Optimistic DOM reparenting can conflict
    // with the reducer update and cause a removeChild error.
    plugins: [SortableKeyboardPlugin, Feedback.configure({ feedback: 'move' })],
  });

  return (
    <article
      ref={ref}
      className={styles.card}
      data-dragging={isDragging || undefined}
      data-drop-target={isDropTarget || undefined}
      data-testid="drop-target-card"
    >
      <TaskCardContent
        item={item}
        handleRef={handleRef}
        onDelete={onDelete ? () => onDelete(item.id) : undefined}
      />
    </article>
  );
}
