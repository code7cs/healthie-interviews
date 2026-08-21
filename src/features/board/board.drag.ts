import { isColumnId, type BoardState, type ColumnId } from './board.types';

export type DragPosition = {
  columnId: ColumnId;
  index: number;
  targetId: string;
};

export type DragMove = {
  itemId: string;
  from: ColumnId;
  to: ColumnId;
  targetIndex: number;
  targetId: string;
};

type DropCandidate = {
  data?: { columnId?: unknown };
  group?: unknown;
  id?: unknown;
  index?: unknown;
};

export function findItemLocation(board: BoardState, itemId: string) {
  for (const columnId of ['todo', 'doing', 'done'] as const) {
    const index = board[columnId].findIndex((item) => item.id === itemId);

    if (index !== -1) {
      return { columnId, index };
    }
  }

  return null;
}

export function resolveDropPosition(
  target: unknown,
  board: BoardState,
): DragPosition | null {
  if (!target || typeof target !== 'object') {
    return null;
  }

  const candidate = target as DropCandidate;
  const targetId =
    typeof candidate.id === 'string' ? candidate.id : '';

  if (
    isColumnId(candidate.group) &&
    typeof candidate.index === 'number' &&
    Number.isFinite(candidate.index)
  ) {
    return {
      columnId: candidate.group,
      index: Math.max(0, Math.trunc(candidate.index)),
      targetId: targetId || 'item:' + candidate.group,
    };
  }

  let columnId = candidate.data?.columnId;

  if (!isColumnId(columnId) && targetId.startsWith('column:')) {
    columnId = targetId.slice('column:'.length);
  }

  if (!isColumnId(columnId)) {
    return null;
  }

  return {
    columnId,
    index: board[columnId].length,
    targetId: targetId || 'column:' + columnId,
  };
}

export function createDragMove(
  board: BoardState,
  itemId: string,
  target: unknown,
): DragMove | null {
  const source = findItemLocation(board, itemId);
  const destination = resolveDropPosition(target, board);

  if (!source || !destination) {
    return null;
  }

  const remainingTargetLength =
    board[destination.columnId].length -
    (source.columnId === destination.columnId ? 1 : 0);
  const targetIndex = Math.max(
    0,
    Math.min(destination.index, remainingTargetLength),
  );

  if (
    source.columnId === destination.columnId &&
    source.index === targetIndex
  ) {
    return null;
  }

  return {
    itemId,
    from: source.columnId,
    to: destination.columnId,
    targetIndex,
    targetId: destination.targetId,
  };
}
