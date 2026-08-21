import type { ReactNode } from 'react';
import type { ColumnId } from './board.types';
import styles from './board.module.css';

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

  return (
    <section className={styles.column} aria-labelledby={headingId}>
      <header className={styles.columnHeader}>
        <h2 id={headingId}>{title}</h2>
        <span aria-label={count + ' items'}>{count}</span>
      </header>
      <div className={styles.itemList}>
        {count === 0 ? (
          <p className={styles.emptyState}>No tasks yet</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
