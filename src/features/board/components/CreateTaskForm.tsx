import { type FormEvent, useState } from 'react';
import type {
  CharactersStatus,
  CharacterSummary,
} from '../../characters/characters.types';
import { CharacterCombobox } from './CharacterCombobox';
import styles from '../board.module.css';

export type CreateItemInput = {
  title: string;
  assignee: CharacterSummary;
};

type Props = {
  characters: CharacterSummary[];
  characterStatus: CharactersStatus;
  characterError: string | null;
  onRetryCharacters: () => void;
  onCreate: (input: CreateItemInput) => void;
  canReset: boolean;
  onReset: () => void;
};

type FormErrors = {
  title?: string;
  character?: string;
};

export function CreateTaskForm({
  characters,
  characterStatus,
  characterError,
  onRetryCharacters,
  onCreate,
  canReset,
  onReset,
}: Props) {
  const [title, setTitle] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const assignee = characters.find(
      (character) => character.id === characterId,
    );
    const nextErrors: FormErrors = {};

    if (!trimmedTitle) {
      nextErrors.title = 'Enter a task title.';
    }

    if (!assignee) {
      nextErrors.character = 'Choose a character.';
    }

    setErrors(nextErrors);

    if (!trimmedTitle || !assignee) {
      return;
    }

    onCreate({ title: trimmedTitle, assignee });
    setTitle('');
    setCharacterId('');
  }

  return (
    <section className={styles.formPanel} aria-labelledby="create-task-title">
      <div>
        <p className={styles.sectionLabel}>Add work</p>
        <h2 id="create-task-title">Create a task</h2>
      </div>

      {characterStatus === 'error' && (
        <div className={styles.apiError} role="alert">
          <p>{characterError ?? 'Unable to load characters.'}</p>
          <button type="button" onClick={onRetryCharacters}>
            Retry characters
          </button>
        </div>
      )}

      {characterStatus === 'success' && characters.length === 0 && (
        <p role="status">No characters are currently available.</p>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Task title</span>
          <input
            className={errors.title ? styles.invalidField : undefined}
            value={title}
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((current) => ({ ...current, title: undefined }));
            }}
          />
          {errors.title && (
            <span id="title-error" className={styles.fieldError}>
              {errors.title}
            </span>
          )}
        </label>

        <label className={styles.field}>
          <span id="character-label">Character</span>
          <CharacterCombobox
            characters={characters}
            value={characterId}
            disabled={characterStatus !== 'success' || characters.length === 0}
            invalid={Boolean(errors.character)}
            labelledBy="character-label"
            describedBy={errors.character ? 'character-error' : undefined}
            placeholder={
              characterStatus === 'loading'
                ? 'Loading characters…'
                : 'Select a character'
            }
            onChange={(nextCharacterId) => {
              setCharacterId(nextCharacterId);
              setErrors((current) => ({ ...current, character: undefined }));
            }}
          />
          {errors.character && (
            <span id="character-error" className={styles.fieldError}>
              {errors.character}
            </span>
          )}
        </label>

        <div className={styles.formActions}>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={
              characterStatus !== 'success' || characters.length === 0
            }
          >
            Add task
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onReset}
            disabled={!canReset}
          >
            Reset board
          </button>
        </div>
      </form>
    </section>
  );
}
