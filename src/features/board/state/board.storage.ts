import { createEmptyBoard } from './board.reducer';
import type { BoardState, KanbanItem } from './board.types';

export const BOARD_STORAGE_KEY = 'rick-morty-kanban:board:v1';

type StoredBoard = {
  version: 1;
  board: BoardState;
};

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isKanbanItem(value: unknown): value is KanbanItem {
  if (!isRecord(value) || !isRecord(value.assignee)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.assignee.id === 'string' &&
    typeof value.assignee.name === 'string' &&
    typeof value.assignee.image === 'string'
  );
}

function isBoardState(value: unknown): value is BoardState {
  if (!isRecord(value)) {
    return false;
  }

  return ['todo', 'doing', 'done'].every((columnId) => {
    const items = value[columnId];

    return Array.isArray(items) && items.every(isKanbanItem);
  });
}

function isStoredBoard(value: unknown): value is StoredBoard {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isBoardState(value.board)
  );
}

export function loadBoardState(
  storage: Storage | null = browserStorage(),
): BoardState {
  if (!storage) {
    return createEmptyBoard();
  }

  try {
    const raw = storage.getItem(BOARD_STORAGE_KEY);

    if (!raw) {
      return createEmptyBoard();
    }

    const parsed: unknown = JSON.parse(raw);

    return isStoredBoard(parsed) ? parsed.board : createEmptyBoard();
  } catch {
    return createEmptyBoard();
  }
}

export function saveBoardState(
  board: BoardState,
  storage: Storage | null = browserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    if (Object.values(board).every((items) => items.length === 0)) {
      storage.removeItem(BOARD_STORAGE_KEY);
      return;
    }

    const payload: StoredBoard = {
      version: 1,
      board,
    };

    storage.setItem(BOARD_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable or full. The board remains usable in memory.
  }
}

export function clearBoardState(
  storage: Storage | null = browserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(BOARD_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; clearing the in-memory board still works.
  }
}
