import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import { useCallback, useReducer, useState } from 'react';
import type {
  CharactersStatus,
  CharacterSummary,
} from '../characters/characters.types';
import {
  boardReducer,
  createEmptyBoard,
} from './board.reducer';
import { isColumnId, type ColumnId } from './board.types';
import {
  CreateTaskForm,
  type CreateItemInput,
} from './CreateTaskForm';
import { Celebration } from './Celebration';
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

  const [celebrationId, setCelebrationId] = useState<string | null>(null);
  const clearCelebration = useCallback(() => {
    setCelebrationId(null);
  }, []);

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
      {celebrationId && (
        <Celebration
          key={celebrationId}
          onComplete={clearCelebration}
        />
      )}

      <CreateTaskForm
        characters={characters}
        characterStatus={characterStatus}
        characterError={characterError}
        onRetryCharacters={onRetryCharacters}
        onCreate={handleCreate}
      />

      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) {
            return;
          }

          const { source, target } = event.operation;

          if (!isSortable(source)) {
            return;
          }

          const from = source.initialGroup;
          let to: unknown = source.group;
          let targetIndex: number | undefined;

          if (target && isSortable(target)) {
            to = target.group;
            targetIndex = target.index;
          } else {
            const targetColumn = target?.data?.columnId;

            if (isColumnId(targetColumn)) {
              to = targetColumn;
              targetIndex = board[targetColumn].length;
            }
          }

          if (
            !isColumnId(from) ||
            !isColumnId(to) ||
            typeof targetIndex !== 'number'
          ) {
            return;
          }

          if (from === to && source.initialIndex === targetIndex) {
            return;
          }

          if (from !== 'done' && to === 'done') {
            setCelebrationId(String(source.id) + ':' + Date.now());
          }

          dispatch({
            type: 'itemMoved',
            itemId: String(source.id),
            from,
            to,
            targetIndex,
          });
        }}
      >
        <div className={styles.board} aria-label="Kanban board">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              title={column.title}
              count={board[column.id].length}
            >
              {board[column.id].map((item, index) => (
                <TaskCard
                  key={item.id}
                  item={item}
                  columnId={column.id}
                  index={index}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </DragDropProvider>
    </div>
  );
}
