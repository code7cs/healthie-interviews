import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { CharacterSummary } from '../characters/characters.types';
import styles from './board.module.css';

type Props = {
  characters: CharacterSummary[];
  value: string;
  disabled: boolean;
  invalid: boolean;
  labelledBy: string;
  describedBy?: string;
  placeholder?: string;
  onChange: (characterId: string) => void;
};

export function CharacterCombobox({
  characters,
  value,
  disabled,
  invalid,
  labelledBy,
  describedBy,
  placeholder = 'Select a character',
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const selectedCharacter = characters.find(
    (character) => character.id === value,
  );
  const selectedIndex = characters.findIndex(
    (character) => character.id === value,
  );
  const safeActiveIndex =
    characters.length === 0 ? -1 : Math.min(activeIndex, characters.length - 1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsidePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () =>
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [isOpen]);

  function open() {
    if (disabled || characters.length === 0) {
      return;
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }

  function selectCharacter(index: number) {
    const character = characters[index];
    if (!character) {
      return;
    }

    onChange(character.id);
    setActiveIndex(index);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setActiveIndex((current) =>
        Math.min(current + 1, characters.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      setActiveIndex(characters.length - 1);
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      if (safeActiveIndex >= 0) {
        selectCharacter(safeActiveIndex);
      }
    }
  }

  return (
    <div ref={rootRef} className={styles.combobox}>
      <button
        ref={triggerRef}
        className={
          styles.comboboxTrigger + ' ' +
          (invalid ? styles.invalidField : '')
        }
        type="button"
        role="combobox"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          isOpen && safeActiveIndex >= 0
            ? listboxId + '-option-' + safeActiveIndex
            : undefined
        }
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.comboboxValue}>
          {selectedCharacter ? (
            <img
              className={styles.comboboxAvatar}
              src={selectedCharacter.image}
              alt=""
            />
          ) : (
            <span className={styles.comboboxPlaceholderAvatar} aria-hidden="true">
              ?
            </span>
          )}
          <span>{selectedCharacter?.name ?? placeholder}</span>
        </span>
        <span className={styles.comboboxChevron} aria-hidden="true">&#x2304;</span>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          className={styles.comboboxMenu}
          role="listbox"
          aria-labelledby={labelledBy}
        >
          {characters.map((character, index) => (
            <div
              key={character.id}
              id={listboxId + '-option-' + index}
              className={
                styles.comboboxOption + ' ' +
                (index === safeActiveIndex ? styles.comboboxOptionActive : '')
              }
              role="option"
              aria-selected={character.id === value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectCharacter(index)}
            >
              <img
                className={styles.comboboxOptionAvatar}
                src={character.image}
                alt=""
              />
              <span>{character.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
