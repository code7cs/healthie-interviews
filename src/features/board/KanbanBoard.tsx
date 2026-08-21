import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import { useReducer } from 'react';
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
          let targetIndex = source.index;

          const targetColumn = target?.data?.columnId;

          if (typeof targetColumn === 'string') {
            to = targetColumn;
            targetIndex = board[targetColumn as ColumnId].length;
          }

          if (!isColumnId(from) || !isColumnId(to)) {
            return;
          }

          if (from === to && source.initialIndex === targetIndex) {
            return;
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
