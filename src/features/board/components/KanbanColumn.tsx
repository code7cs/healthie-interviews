import { useDroppable } from '@dnd-kit/react';
import type { ReactNode } from 'react';
import type { ColumnId } from '../state/board.types';
import styles from '../board.module.css';

type Props = {
  columnId: ColumnId;
  title: string;
  count: number;
  children: ReactNode;
};

export function KanbanColumn({
  columnId,
  title,
  count,
  children,
}: Props) {
  const headingId = 'column-' + columnId;
  const { ref, isDropTarget } = useDroppable({
    id: 'column:' + columnId,
    type: 'column',
    accept: 'item',
    data: { columnId },
    collisionPriority: -1,
  });

  return (
    <section
      ref={ref}
      className={styles.column}
      data-drop-target={isDropTarget || undefined}
      aria-labelledby={headingId}
    >
      <header className={styles.columnHeader}>
        <h2 id={headingId}>{title}</h2>
        <span aria-label={count + ' items'}>{count}</span>
      </header>
      <div
        className={styles.itemList}
        data-has-items={count > 0 ? 'true' : undefined}
      >
        {count === 0 ? (
          isDropTarget ? (
            <div
              className={styles.dropPlaceholder}
              data-testid="column-drop-placeholder"
              aria-hidden="true"
            />
          ) : (
            <p className={styles.emptyState}>Drop a task here</p>
          )
        ) : (
          children
        )}
      </div>
    </section>
  );
}
