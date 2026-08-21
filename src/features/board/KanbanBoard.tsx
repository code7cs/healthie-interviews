import { useReducer } from 'react';
import type {
  CharactersStatus,
  CharacterSummary,
} from '../characters/characters.types';
import {
  boardReducer,
  createEmptyBoard,
} from './board.reducer';
import type { ColumnId } from './board.types';
import {
  CreateTaskForm,
  type CreateItemInput,
} from './CreateTaskForm';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import styles from './board.module.css';

const COLUMNS: Array<{ id: ColumnId; title: string }> = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

type Props = {
  characters: CharacterSummary[];
  characterStatus: CharactersStatus;
  characterError: string | null;
  onRetryCharacters: () => void;
};

export function KanbanBoard({
  characters,
  characterStatus,
  characterError,
  onRetryCharacters,
}: Props) {
  const [board, dispatch] = useReducer(
    boardReducer,
    undefined,
    createEmptyBoard,
  );

  function handleCreate(input: CreateItemInput) {
    dispatch({
      type: 'itemCreated',
      item: {
        id: crypto.randomUUID(),
        ...input,
      },
    });
  }

  return (
    <div className={styles.boardShell}>
      <CreateTaskForm
        characters={characters}
        characterStatus={characterStatus}
        characterError={characterError}
        onRetryCharacters={onRetryCharacters}
        onCreate={handleCreate}
      />

      <div className={styles.board} aria-label="Kanban board">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            columnId={column.id}
            title={column.title}
            count={board[column.id].length}
          >
            {board[column.id].map((item) => (
              <TaskCard key={item.id} item={item} />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}
