import { describe, expect, it } from 'vitest';
import { boardReducer, createEmptyBoard } from './board.reducer';
import type { BoardState, KanbanItem } from './board.types';

const rick = {
  id: '1',
  name: 'Rick Sanchez',
  image: 'https://example.com/rick.jpeg',
};

function item(id: string): KanbanItem {
  return {
    id,
    title: 'Task ' + id,
    assignee: rick,
  };
}

function board(overrides: Partial<BoardState> = {}): BoardState {
  return {
    todo: [],
    doing: [],
    done: [],
    ...overrides,
  };
}

describe('boardReducer', () => {
  it('creates an empty board', () => {
    expect(createEmptyBoard()).toEqual({
      todo: [],
      doing: [],
      done: [],
    });
  });

  it('appends new items to To Do', () => {
    const next = boardReducer(createEmptyBoard(), {
      type: 'itemCreated',
      item: item('a'),
    });

    expect(next.todo.map(({ id }) => id)).toEqual(['a']);
  });

  it('reorders an item forward within a column', () => {
    const state = board({ todo: [item('a'), item('b'), item('c')] });

    const next = boardReducer(state, {
      type: 'itemMoved',
      itemId: 'a',
      from: 'todo',
      to: 'todo',
      targetIndex: 2,
    });

    expect(next.todo.map(({ id }) => id)).toEqual(['b', 'c', 'a']);
  });

  it('reorders an item backward within a column', () => {
    const state = board({ todo: [item('a'), item('b'), item('c')] });

    const next = boardReducer(state, {
      type: 'itemMoved',
      itemId: 'c',
      from: 'todo',
      to: 'todo',
      targetIndex: 0,
    });

    expect(next.todo.map(({ id }) => id)).toEqual(['c', 'a', 'b']);
  });

  it('moves an item into the middle of another column', () => {
    const state = board({
      todo: [item('a')],
      doing: [item('b'), item('c')],
    });

    const next = boardReducer(state, {
      type: 'itemMoved',
      itemId: 'a',
      from: 'todo',
      to: 'doing',
      targetIndex: 1,
    });

    expect(next.todo).toEqual([]);
    expect(next.doing.map(({ id }) => id)).toEqual(['b', 'a', 'c']);
  });

  it('moves an item into an empty column', () => {
    const state = board({ todo: [item('a')] });

    const next = boardReducer(state, {
      type: 'itemMoved',
      itemId: 'a',
      from: 'todo',
      to: 'done',
      targetIndex: 0,
    });

    expect(next.todo).toEqual([]);
    expect(next.done.map(({ id }) => id)).toEqual(['a']);
  });

  it('clamps a target index to the destination length', () => {
    const state = board({ todo: [item('a')] });

    const next = boardReducer(state, {
      type: 'itemMoved',
      itemId: 'a',
      from: 'todo',
      to: 'doing',
      targetIndex: 99,
    });

    expect(next.doing.map(({ id }) => id)).toEqual(['a']);
  });

  it('returns the original state for an unknown item', () => {
    const state = board({ todo: [item('a')] });

    const next = boardReducer(state, {
      type: 'itemMoved',
      itemId: 'missing',
      from: 'todo',
      to: 'done',
      targetIndex: 0,
    });

    expect(next).toBe(state);
  });

  it('does not mutate the source state', () => {
    const state = board({ todo: [item('a'), item('b')] });
    const snapshot = structuredClone(state);

    boardReducer(state, {
      type: 'itemMoved',
      itemId: 'a',
      from: 'todo',
      to: 'doing',
      targetIndex: 0,
    });

    expect(state).toEqual(snapshot);
  });
});
