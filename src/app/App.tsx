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
        <section className={styles.statusPanel} aria-labelledby="character-status">
          <h2 id="character-status">Character directory</h2>

          {characters.status === 'loading' && (
            <p role="status">Loading character options…</p>
          )}

          {characters.status === 'error' && (
            <div role="alert">
              <p>{characters.error?.message}</p>
              <button type="button" onClick={characters.retry}>
                Retry
              </button>
            </div>
          )}

          {characters.status === 'success' && (
            <p role="status">
              {characters.data.length} characters are ready for assignment.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
