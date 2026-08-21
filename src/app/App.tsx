import { KanbanBoard } from '../features/board/KanbanBoard';
import { useCharacters } from '../features/characters/useCharacters';
import styles from './App.module.css';

export function App() {
  const characters = useCharacters();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Rick & Morty Kanban Board</p>
        <h1>Character-powered Kanban</h1>
        <p>Plan work, assign a Rick and Morty character, and celebrate progress.</p>
      </header>

      <main className={styles.main}>
        <KanbanBoard
          characters={characters.data}
          characterStatus={characters.status}
          characterError={characters.error?.message ?? null}
          onRetryCharacters={characters.retry}
        />
      </main>
    </div>
  );
}
