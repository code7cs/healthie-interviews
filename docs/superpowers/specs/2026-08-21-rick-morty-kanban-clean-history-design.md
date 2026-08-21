# Rick and Morty Kanban Clean History Design

## Goal

Rebuild the project history as a clean eight-commit product story while preserving the current user-facing features and replacing the accumulated drag-and-drop patches with one controlled implementation.

## Product scope

- React and TypeScript single-page Kanban board.
- Character options loaded from the Rick and Morty GraphQL API.
- Task creation with character assignment and field validation.
- To Do, Doing, and Done columns.
- Drag-and-drop movement across columns and reordering within a column.
- Keyboard drag support, lazy avatar loading, responsive styling, and completion celebration.
- In-memory board state; no router, backend, global state library, form framework, or query cache.

## Architecture

The API feature owns fetching, response validation, loading, retry, and character view models. The board feature owns task creation, reducer transitions, drag target translation, sortable UI, and the Done celebration.

Drag-and-drop is controlled by React state. The sortable optimistic DOM plugin remains disabled because it can reparent a card outside React ownership and cause a `removeChild` error. `onDragStart` stores an immutable board snapshot, `onDragOver` applies a reducer move using the current board location, and `onDragEnd` is a guarded fallback. A canceled drag restores the snapshot.

The drag calculations live in focused pure helpers so target resolution and insertion-index behavior can be tested independently from the provider wiring. The reducer remains the only authority that changes board order.

## Error and edge-case behavior

- A missing or invalid target is ignored safely.
- A column target appends to the current column length.
- An item target uses its sortable group and index.
- A task's source column is found from current board state, not stale drag metadata.
- Repeated `onDragOver` events that represent the same board position do not dispatch duplicate moves.
- Canceling restores the exact pre-drag board snapshot.
- Entering Done from another column triggers one celebration.

## Verification

The project must pass `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Drag tests cover empty-column moves, cross-column item targets, upward and downward reorder, end-event deduplication, cancellation, and missing targets. Browser verification covers all three columns, both reorder directions, cancellation, and the absence of a white screen or application console errors.
