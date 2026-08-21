import { type CSSProperties, useEffect } from 'react';
import styles from './board.module.css';

const CONFETTI_PIECES = [
  { id: 1, left: '4%', delay: '0ms', drift: '5rem', color: '#6558d3' },
  { id: 2, left: '11%', delay: '80ms', drift: '-8rem', color: '#f2a93b' },
  { id: 3, left: '18%', delay: '160ms', drift: '7rem', color: '#e85d75' },
  { id: 4, left: '26%', delay: '40ms', drift: '-6rem', color: '#36a269' },
  { id: 5, left: '33%', delay: '240ms', drift: '8rem', color: '#6558d3' },
  { id: 6, left: '41%', delay: '100ms', drift: '-9rem', color: '#f2a93b' },
  { id: 7, left: '49%', delay: '300ms', drift: '6rem', color: '#e85d75' },
  { id: 8, left: '57%', delay: '120ms', drift: '-7rem', color: '#36a269' },
  { id: 9, left: '64%', delay: '220ms', drift: '9rem', color: '#6558d3' },
  { id: 10, left: '72%', delay: '20ms', drift: '-5rem', color: '#f2a93b' },
  { id: 11, left: '79%', delay: '180ms', drift: '7rem', color: '#e85d75' },
  { id: 12, left: '86%', delay: '60ms', drift: '-8rem', color: '#36a269' },
  { id: 13, left: '92%', delay: '260ms', drift: '5rem', color: '#6558d3' },
  { id: 14, left: '23%', delay: '340ms', drift: '10rem', color: '#f2a93b' },
  { id: 15, left: '68%', delay: '380ms', drift: '-10rem', color: '#e85d75' },
  { id: 16, left: '38%', delay: '420ms', drift: '6rem', color: '#36a269' },
] as const;

type ConfettiStyle = CSSProperties & {
  '--confetti-drift': string;
};

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
      <div
        className={styles.confettiLayer}
        data-testid="confetti-layer"
        aria-hidden="true"
      >
        {CONFETTI_PIECES.map((piece) => (
          <span
            key={piece.id}
            className={styles.confettiPiece}
            style={
              {
                left: piece.left,
                animationDelay: piece.delay,
                backgroundColor: piece.color,
                '--confetti-drift': piece.drift,
              } as ConfettiStyle
            }
          />
        ))}
      </div>
      <strong className={styles.celebrationMessage}>Task completed!</strong>
    </div>
  );
}
