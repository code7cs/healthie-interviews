import type {
  BoardAction,
  BoardState,
  ColumnId,
  KanbanItem,
} from './board.types';

export function createEmptyBoard(): BoardState {
  return {
    todo: [],
    doing: [],
    done: [],
  };
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

function moveItem(
  state: BoardState,
  itemId: string,
  from: ColumnId,
  to: ColumnId,
  targetIndex: number,
): BoardState {
  const sourceIndex = state[from].findIndex((item) => item.id === itemId);

  if (sourceIndex === -1) {
    return state;
  }

  const sourceItems = [...state[from]];
  const [movedItem] = sourceItems.splice(sourceIndex, 1);

  if (!movedItem) {
    return state;
  }

  if (from === to) {
    const insertionIndex = clampIndex(targetIndex, sourceItems.length);
    sourceItems.splice(insertionIndex, 0, movedItem);

    return {
      ...state,
      [from]: sourceItems,
    };
  }

  const targetItems = [...state[to]];
  const insertionIndex = clampIndex(targetIndex, targetItems.length);
  targetItems.splice(insertionIndex, 0, movedItem);

  return {
    ...state,
    [from]: sourceItems,
    [to]: targetItems,
  };
}

function createItem(state: BoardState, item: KanbanItem): BoardState {
  return {
    ...state,
    todo: [...state.todo, item],
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case 'boardRestored':
      return action.board;
    case 'itemCreated':
      return createItem(state, action.item);
    case 'itemMoved':
      return moveItem(
        state,
        action.itemId,
        action.from,
        action.to,
        action.targetIndex,
      );
    default:
      return state;
  }
}
