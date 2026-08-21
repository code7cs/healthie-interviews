import { afterEach, describe, expect, it } from 'vitest';
import {
  BOARD_STORAGE_KEY,
  clearBoardState,
  loadBoardState,
  saveBoardState,
} from './board.storage';
import type { BoardState } from './board.types';

const board: BoardState = {
  todo: [
    {
      id: 'task-1',
      title: 'Prepare client notes',
      assignee: {
        id: 'rick',
        name: 'Rick Sanchez',
        image: 'https://example.com/rick.jpg',
      },
    },
  ],
  doing: [],
  done: [],
};

afterEach(() => {
  window.localStorage.clear();
});

describe('board storage', () => {
  it('round-trips a versioned board snapshot', () => {
    saveBoardState(board);

    expect(window.localStorage.getItem(BOARD_STORAGE_KEY)).toContain(
      '"version":1',
    );
    expect(loadBoardState()).toEqual(board);
  });

  it('falls back to an empty board for invalid persisted data', () => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, '{"version":1}');

    expect(loadBoardState()).toEqual({
      todo: [],
      doing: [],
      done: [],
    });
  });

  it('clears storage when the board is empty', () => {
    saveBoardState(board);
    saveBoardState({ todo: [], doing: [], done: [] });

    expect(window.localStorage.getItem(BOARD_STORAGE_KEY)).toBeNull();
    expect(loadBoardState()).toEqual({
      todo: [],
      doing: [],
      done: [],
    });
  });

  it('can clear the persisted snapshot explicitly', () => {
    saveBoardState(board);
    clearBoardState();

    expect(window.localStorage.getItem(BOARD_STORAGE_KEY)).toBeNull();
  });
});
