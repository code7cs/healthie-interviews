# Healthie Frontend Kanban Design

## Context

This repository contains the frontend pre-work for Healthie's Senior Software Engineer, Frontend interview. The deliverable is a frontend-only Kanban board built with React and TypeScript. It must load Rick and Morty characters through the public GraphQL API, create character-assigned items, reorder items within a column, move items between To Do, Doing, and Done, and celebrate transitions into Done.

The submission is due by end of day August 21, 2026. The implementation should be complete and usable while remaining small enough to explain and extend during a one-hour pairing interview.

## Goals

- Satisfy every required frontend behavior in the interview guide.
- Make architectural boundaries visible without over-engineering a single-page exercise.
- Keep business state transitions independent from the drag-and-drop library.
- Provide useful loading, failure, empty, validation, and drag-cancellation behavior.
- Make the implementation easy to walk through commit by commit.
- Leave clear extension points for filtering, persistence, or UI improvements during the interview.

## Non-goals

- A backend or Rails implementation.
- Authentication, routing, or multi-user collaboration.
- Server persistence or local-storage persistence before the interview.
- Filtering or search beyond the character selector.
- A general-purpose design system or global state framework.
- Loading all Rick and Morty pages; the first page provides enough choices for this exercise.

## Architecture

The application uses a feature-oriented structure with two domain areas: characters and board. Character data is remote, read-only server data. Board items are local interaction state. The application connects these areas when the user submits the creation form, but neither feature owns the other's implementation details.

The board is managed by a React reducer backed by pure state-transition functions. dnd-kit is isolated in the board UI and translates drag events into a library-independent `itemMoved` action. This keeps the most important behavior deterministic, unit-testable, and replaceable if the drag-and-drop library changes.

No generic `shared`, `utils`, or `services` directory is introduced initially. A module is extracted only when it has a concrete responsibility and consumer.

## Technology Choices

| Concern | Choice | Rationale |
| --- | --- | --- |
| Build tool | Vite React TypeScript template | Fast setup, small configuration surface, and first-class TypeScript support. |
| UI | React with function components | Required by the exercise and appropriate for the single-page interaction model. |
| Board state | `useReducer` plus pure transition functions | Makes invariants and state changes explicit without adding a global state dependency. |
| Drag and drop | Current `@dnd-kit/react` API | Handles pointer, touch, keyboard, sorting, and accessibility mechanics while allowing application-owned state. |
| API client | Native `fetch` in a dedicated API module | The app has one simple GraphQL request, so a GraphQL client or query cache would add more concepts than value. |
| Form | Controlled React fields | The form has only a title and character selector, so a form framework is unnecessary. |
| Styling | CSS Modules plus global design tokens | Keeps component styling local while allowing a small coherent visual system. |
| Tests | Vitest and React Testing Library | Integrates with Vite and supports pure model tests and user-facing component tests. |
| Completion effect | Local CSS-based celebration | Meets the delight requirement without adding a dependency for a single effect. |

## Proposed File Structure

```text
src/
  app/
    App.tsx
    App.test.tsx
    App.module.css
  features/
    characters/
      characters.api.ts
      characters.api.test.ts
      characters.types.ts
      useCharacters.ts
    board/
      board.types.ts
      board.reducer.ts
      board.reducer.test.ts
      KanbanBoard.tsx
      KanbanBoard.test.tsx
      KanbanColumn.tsx
      TaskCard.tsx
      CreateTaskForm.tsx
      CreateTaskForm.test.tsx
      Celebration.tsx
      board.module.css
  test/
    setup.ts
  index.css
  main.tsx
```

`App` composes the character-loading and board features. `KanbanBoard` owns the reducer and dnd-kit adapter. Presentational board components receive explicit data and callbacks rather than reading application-wide context.

## Domain Model

```ts
type ColumnId = 'todo' | 'doing' | 'done';

type CharacterSummary = {
  id: string;
  name: string;
  image: string;
};

type KanbanItem = {
  id: string;
  title: string;
  assignee: CharacterSummary;
};

type BoardState = Record<ColumnId, KanbanItem[]>;

type BoardAction =
  | { type: 'itemCreated'; item: KanbanItem }
  | {
      type: 'itemMoved';
      itemId: string;
      from: ColumnId;
      to: ColumnId;
      targetIndex: number;
    };
```

The grouped-record state mirrors the visible board and keeps reorder operations easy to read. Normalizing items into separate maps would be useful for much larger data or frequent item lookup, but it would add indirection without helping this exercise.

### Board invariants

- Every item exists in exactly one column.
- Every item has a stable unique ID, non-empty title, and assigned character.
- New items enter the `todo` column.
- A move removes the item from its source before inserting it at the clamped target index.
- Invalid item IDs, invalid targets, canceled drags, and drops without a target leave state unchanged.
- A celebration occurs only when an item moves from a non-Done column into Done.

## Character Data Flow

The API module sends a POST request to `https://rickandmortyapi.com/graphql` with a query for the first page of characters and requests `id`, `name`, and `image`. It validates HTTP status, GraphQL errors, and the presence of `data.characters.results` before mapping the response to `CharacterSummary[]`.

`useCharacters` owns loading, success, and failure state. It aborts the request when its consumer unmounts and exposes a retry operation. The creation form remains disabled until characters are available. Failures render an actionable message and retry button rather than silently falling back to hard-coded data.

## Board Interaction Flow

1. The user enters a title and selects a character.
2. `CreateTaskForm` validates both values and submits a creation request to `KanbanBoard`.
3. `KanbanBoard` creates a unique item and dispatches `itemCreated`.
4. Each item is registered with dnd-kit through a stable item ID, its current index, and its column group.
5. At the end of a valid drag, the UI adapter reads the source and target positions and dispatches one `itemMoved` action.
6. The reducer handles same-column reordering and cross-column movement through the same domain operation.
7. The UI adapter compares the source and destination columns and triggers `Celebration` when an item newly enters Done.

dnd-kit types and event shapes do not appear in `board.reducer.ts`. This is the central dependency boundary of the design.

## Components

- `App`: page shell, title, character request state, and feature composition.
- `CreateTaskForm`: accessible title and character controls, field-level validation, and submission reset.
- `KanbanBoard`: board state owner, drag provider, drag-event adapter, and completion-effect trigger.
- `KanbanColumn`: labeled droppable region that remains available when empty.
- `TaskCard`: item title, character avatar and name, and an explicit drag handle.
- `Celebration`: short-lived, non-blocking visual effect with reduced-motion support.

## Error Handling and Edge Cases

- API request pending: show a visible loading state and disable creation.
- HTTP, GraphQL, or malformed-response failure: show a concise error and retry action.
- No returned characters: show an empty-state message instead of an unusable select.
- Empty or whitespace-only title: show an inline validation message and preserve the selected character.
- Missing character selection: show an inline validation message.
- Canceled drag or missing target: make no state change.
- Empty destination column: keep the column itself droppable.
- Moving within Done: reorder without replaying the celebration.
- Moving out of Done and back into Done: celebrate the new completion transition.
- Reduced-motion preference: replace movement-heavy celebration with a brief static success treatment.

## Accessibility and Layout

- Every input has a visible label and associated error text.
- Task cards expose a dedicated drag handle instead of making interactive card content ambiguous.
- Keyboard drag behavior supplied by dnd-kit remains enabled.
- Columns have visible headings and item counts.
- Focus styles are visible, colors maintain readable contrast, and status is not communicated by color alone.
- The desktop layout displays three columns. Narrow screens use horizontal board scrolling so column width and drop targets remain usable.
- Character images include useful alt text and reserve dimensions to avoid layout shifts.

## Testing Strategy

### Pure model tests

`board.reducer.test.ts` verifies:

- New items are appended to To Do.
- Items reorder forward and backward within a column.
- Items move to the start, middle, and end of another column.
- Items can move into an empty column.
- Invalid item IDs leave state unchanged.
- Source state is not mutated.

### API tests

`characters.api.test.ts` mocks `fetch` and verifies successful mapping, non-OK HTTP responses, GraphQL errors, and malformed payloads.

### Component tests

`CreateTaskForm.test.tsx` verifies required fields, successful submission, and field reset. A board integration test verifies that creation renders the task in To Do.

The test suite does not simulate pixel-level drag gestures in JSDOM. Drag mechanics belong to dnd-kit; application movement is covered through reducer tests, and the wired interaction is verified manually in a real browser.

### Manual acceptance checks

- Create multiple tasks with different characters.
- Reorder tasks upward and downward in every column.
- Move tasks across all column pairs, including into and out of empty columns.
- Confirm celebration behavior for each Done transition rule.
- Retry after a simulated API failure.
- Complete the core flow using the keyboard.
- Verify layout at desktop and narrow viewport widths.
- Run lint, type checking, tests, and production build from a clean install.

## Commit Story

The repository will contain eight focused commits that can be presented chronologically:

1. `docs: define kanban architecture`
   - Record requirements, boundaries, tradeoffs, testing, and the implementation story.
2. `chore: scaffold React TypeScript app`
   - Initialize Git-visible application scaffolding, Vite, TypeScript, linting, Vitest, and base styles.
3. `feat: load character options from GraphQL`
   - Add API types, fetch boundary, request-state hook, error handling, retry behavior, and API tests.
4. `feat: add tested board state model`
   - Add board types, reducer, invariants, and comprehensive pure state-transition tests.
5. `feat: create character-assigned tasks`
   - Add the creation form, validation, task cards, initial columns, and component tests.
6. `feat: support sortable multi-column board`
   - Add dnd-kit integration, same-column reorder, cross-column movement, empty-column drops, and drag affordances.
7. `feat: celebrate completions and polish the UI`
   - Add Done celebration, reduced-motion behavior, responsive styling, focus states, counts, and visual polish.
8. `docs: add setup and interview walkthrough`
   - Add the final README with setup, scripts, architecture decisions, tradeoffs, testing notes, known limitations, and extension ideas.

Each commit must pass the relevant tests available at that point. Generated scaffolding stays in one commit; later commits contain one coherent behavior and its tests.

## Interview Walkthrough

The first ten minutes can follow the commit story:

1. State the exercise scope and the deliberate non-goals.
2. Explain remote character data versus local board state.
3. Show the reducer and its invariants before discussing UI components.
4. Show how the dnd-kit adapter produces a library-independent action.
5. Demonstrate loading, validation, empty columns, reorder, cross-column movement, and Done celebration.
6. Explain why persistence and filtering remain extensions for the pairing session.
7. Close with production considerations: persistence API, optimistic updates, observability, accessibility testing, and larger datasets.

## Risks and Mitigations

- **Unfamiliar dnd-kit API:** follow only the current official multiple-list documentation, keep integration isolated, and implement the reducer before drag wiring.
- **Cross-column edge cases:** test the movement model separately and manually verify empty columns before visual polish.
- **Public API instability:** provide explicit loading, error, and retry states; do not hide failures with hard-coded data.
- **Deadline pressure:** complete requirements and verification before optional polish; persistence and filtering remain out of scope.

## Acceptance Criteria

- The application is implemented with React and TypeScript and runs from documented commands.
- It fetches a usable character list through the required Rick and Morty GraphQL endpoint.
- A form creates To Do items with a required title and assigned character.
- Items reorder within a column and move between To Do, Doing, and Done.
- Empty columns remain valid drop targets.
- A delightful effect occurs only when an item newly enters Done.
- Loading, failure, retry, validation, and reduced-motion behavior are present.
- Automated tests cover domain transitions, API mapping failures, and form behavior.
- Lint, type checking, tests, and production build pass.
- The README explains local setup, architecture choices, tradeoffs, testing, limitations, and interview-ready extension points.
