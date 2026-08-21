import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Rick & Morty Kanban Board</p>
        <h1>Character-powered Kanban</h1>
        <p>Plan work, assign a Rick and Morty character, and celebrate progress.</p>
      </header>
      <main className={styles.main}>
        <p>The board is ready for its first feature.</p>
      </main>
    </div>
  );
}
