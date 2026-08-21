import { useEffect } from 'react';
import styles from './board.module.css';

type Props = {
  onComplete: () => void;
};

export function Celebration({ onComplete }: Props) {
  useEffect(() => {
    const timeout = window.setTimeout(onComplete, 1400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className={styles.celebration} role="status" aria-live="polite">
      <span className={styles.sparkOne} aria-hidden="true">✦</span>
      <span className={styles.sparkTwo} aria-hidden="true">●</span>
      <span className={styles.sparkThree} aria-hidden="true">✦</span>
      <strong>Task completed!</strong>
    </div>
  );
}
