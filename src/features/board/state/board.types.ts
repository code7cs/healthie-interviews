import type { CharacterSummary } from '../../characters/characters.types';

export const COLUMN_IDS = ['todo', 'doing', 'done'] as const;

export type ColumnId = (typeof COLUMN_IDS)[number];

export type KanbanItem = {
  id: string;
  title: string;
  assignee: CharacterSummary;
};

export type BoardState = Record<ColumnId, KanbanItem[]>;

export type BoardAction =
  | { type: 'boardRestored'; board: BoardState }
  | { type: 'boardReset' }
  | { type: 'itemCreated'; item: KanbanItem }
  | { type: 'itemDeleted'; itemId: string }
  | {
      type: 'itemMoved';
      itemId: string;
      from: ColumnId;
      to: ColumnId;
      targetIndex: number;
    };

export function isColumnId(value: unknown): value is ColumnId {
  return (
    typeof value === 'string' &&
    COLUMN_IDS.includes(value as ColumnId)
  );
}
