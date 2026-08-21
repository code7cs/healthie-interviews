# Healthie Frontend Pre-work

A React + TypeScript Kanban board for the Healthie Senior Software Engineer, Frontend interview pre-work.

The board uses characters from the [Rick and Morty GraphQL API](https://rickandmortyapi.com/graphql) as task assignees. Tasks can be created, reordered within a column, moved between columns, and completed with a small celebration when they enter **Done**.

## Run locally

Requirements:

- Node.js 20.19+ or 22.12+
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

Run the production checks:

```bash
npm run test       # Vitest + React Testing Library
npm run typecheck  # TypeScript project references
npm run lint       # oxlint
npm run build      # typecheck plus Vite production build
```

## Product behavior

- Loads character options from the Rick and Morty GraphQL API.
- Shows loading, retryable error, and loaded states for remote data.
- Creates a task with a title and assigned character.
- Starts every new task in **To Do**.
- Supports sortable drag-and-drop within and across **To Do**, **Doing**, and **Done**.
- Supports keyboard interaction through the dnd-kit drag handle.
- Announces completion with an accessible live status when a task enters **Done**.
- Keeps the board responsive for smaller screens.
- Keeps task state in memory for this exercise; there is no backend persistence.

## Design and architecture

The implementation deliberately separates remote data from local interaction state:

```
Rick and Morty GraphQL API
        |
        v
characters.api.ts -> useCharacters.ts -> CreateTaskForm
                                             |
                                             v
                                    KanbanBoard / reducer
                                             |
                                             v
                            columns + sortable TaskCards
```

- `src/features/characters` owns the API contract, response validation, and loading lifecycle. The API module uses native `fetch` so the network boundary stays explicit and easy to test.
- `src/features/board/board.reducer.ts` is a pure state transition module. It owns creation, intra-column reorder, cross-column moves, destination clamping, and unknown-item safety.
- `KanbanBoard` owns orchestration: it translates dnd-kit events into the reducer's domain action and triggers the completion effect only for a real transition into Done.
- `TaskCard`, `KanbanColumn`, and `CreateTaskForm` are focused UI components. CSS Modules keep feature styles local while `src/index.css` contains only global tokens and primitives.
- Stable task IDs are generated at the creation boundary. Character data is stored as the small view-model needed by a task, rather than coupling the board to the entire API response.

The main design record is [docs/superpowers/specs/2026-08-20-healthie-kanban-design.md](docs/superpowers/specs/2026-08-20-healthie-kanban-design.md).

## Why these tools

- **Vite** keeps the exercise fast to start and close to a production React build.
- **React `useReducer`** makes the finite board transitions explicit without introducing global state machinery for a single screen.
- **dnd-kit** provides sortable primitives, keyboard support, drag handles, and cross-container interactions while leaving domain state in the reducer.
- **Native GraphQL fetch** avoids hiding a small API boundary behind a large client abstraction.
- **CSS Modules** provide component-local styles without requiring a design-system dependency for a focused interview exercise.
- **Vitest + React Testing Library** cover pure transitions and user-visible behavior at the appropriate level.

I intentionally did not add a router, Redux, a form framework, or a query-cache library: each would add global or indirect behavior without solving a requirement in this single-page exercise.

## Testing approach

The test suite covers:

- GraphQL success, HTTP failure, GraphQL failure, and malformed response handling.
- Board creation, reordering, cross-column movement, clamping, and invalid-item safety.
- Form validation and successful task creation.
- User-visible task creation in the board.
- Celebration timing and cleanup behavior.

The reducer tests are intentionally pure and table-like, while component tests interact through accessible labels and roles. This keeps implementation details out of the most important behavior tests.

## Commit walkthrough

The implementation history is organized as a small sequence of reviewable decisions:

1. `docs: define kanban architecture` - records scope, boundaries, and trade-offs.
2. `chore: scaffold React TypeScript app` - establishes the Vite, TypeScript, test, lint, and styling baseline.
3. `feat: load character options from GraphQL` - adds the remote data boundary and resilient loading states.
4. `feat: add tested board state model` - adds the pure reducer and domain types.
5. `feat: create character-assigned tasks` - adds task creation and the initial board UI.
6. `feat: support sortable multi-column board` - integrates dnd-kit while keeping transitions in the reducer.
7. `feat: celebrate completed tasks` - adds the Done transition feedback, accessibility polish, and responsive visual treatment.
8. `docs: add setup and interview walkthrough` - documents how to run, review, and discuss the project.

AI was used as a development aid. I can explain the implementation, tests, trade-offs, and design decisions in detail.
