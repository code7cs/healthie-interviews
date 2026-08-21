import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import {
  type Dispatch,
  useCallback,
  useReducer,
  useRef,
  useState,
} from 'react';
import type {
  CharactersStatus,
  CharacterSummary,
} from '../characters/characters.types';
import {
  boardReducer,
  createEmptyBoard,
} from './board.reducer';
import {
  createDragMove,
  findItemLocation,
  type DragMove,
} from './board.drag';
import type {
  BoardAction,
  BoardState,
  ColumnId,
  KanbanItem,
} from './board.types';
import {
  CreateTaskForm,
  type CreateItemInput,
} from './CreateTaskForm';
import { Celebration } from './Celebration';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard, TaskCardPreview } from './TaskCard';
import styles from './board.module.css';

const COLUMNS: Array<{ id: ColumnId; title: string }> = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

type DragSession = {
  itemId: string;
  snapshot: BoardState;
  hasMoved: boolean;
  lastTargetId: string | null;
};

type Props = {
  characters: CharacterSummary[];
  characterStatus: CharactersStatus;
  characterError: string | null;
  onRetryCharacters: () => void;
};

function applyDragMove(
  board: BoardState,
  dispatch: Dispatch<BoardAction>,
  session: DragSession,
  target: unknown,
): DragMove | null {
  const move = createDragMove(board, session.itemId, target);

  if (!move || session.lastTargetId === move.targetId) {
    return null;
  }

  dispatch({
    type: 'itemMoved',
    itemId: move.itemId,
    from: move.from,
    to: move.to,
    targetIndex: move.targetIndex,
  });

  session.hasMoved = true;
  session.lastTargetId = move.targetId;
  return move;
}

function movedIntoDone(
  snapshot: BoardState,
  board: BoardState,
  itemId: string,
) {
  const before = findItemLocation(snapshot, itemId);
  const after = findItemLocation(board, itemId);

  return before?.columnId !== 'done' && after?.columnId === 'done';
}

function findBoardItem(
  board: BoardState,
  itemId: string,
): KanbanItem | null {
  const location = findItemLocation(board, itemId);

  return location ? board[location.columnId][location.index] : null;
}

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
  const dragSessionRef = useRef<DragSession | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItem = activeItemId
    ? findBoardItem(board, activeItemId)
    : null;

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
        onDragStart={(event) => {
          const { source } = event.operation;

          if (!isSortable(source)) {
            dragSessionRef.current = null;
            setActiveItemId(null);
            return;
          }

          const itemId = String(source.id);
          dragSessionRef.current = {
            itemId,
            snapshot: board,
            hasMoved: false,
            lastTargetId: null,
          };
          setActiveItemId(itemId);
        }}
        onDragOver={(event) => {
          const { source, target } = event.operation;
          const session = dragSessionRef.current;

          if (
            !isSortable(source) ||
            !session ||
            session.itemId !== String(source.id)
          ) {
            return;
          }

          applyDragMove(board, dispatch, session, target);
        }}
        onDragEnd={(event) => {
          const session = dragSessionRef.current;

          if (event.canceled) {
            if (session) {
              dispatch({
                type: 'boardRestored',
                board: session.snapshot,
              });
            }

            dragSessionRef.current = null;
            setActiveItemId(null);
            return;
          }

          const { source, target } = event.operation;

          if (!isSortable(source)) {
            dragSessionRef.current = null;
            setActiveItemId(null);
            return;
          }

          const itemId = String(source.id);
          const activeSession =
            session && session.itemId === itemId
              ? session
              : {
                  itemId,
                  snapshot: board,
                  hasMoved: false,
                  lastTargetId: null,
                };
          const hadMoved = activeSession.hasMoved;
          const move = applyDragMove(
            board,
            dispatch,
            activeSession,
            target,
          );

          if (
            move &&
            move.from !== 'done' &&
            move.to === 'done'
          ) {
            setCelebrationId(itemId + ':' + Date.now());
          } else if (
            hadMoved &&
            movedIntoDone(activeSession.snapshot, board, itemId)
          ) {
            setCelebrationId(itemId + ':' + Date.now());
          }

          dragSessionRef.current = null;
          setActiveItemId(null);
        }}
      >
        <DragOverlay
          className={styles.dragOverlay}
        >
          {activeItem ? <TaskCardPreview item={activeItem} /> : null}
        </DragOverlay>
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
