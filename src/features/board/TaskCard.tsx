import type { KanbanItem } from './board.types';
import styles from './board.module.css';

type Props = {
  item: KanbanItem;
};

export function TaskCard({ item }: Props) {
  return (
    <article className={styles.card}>
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
