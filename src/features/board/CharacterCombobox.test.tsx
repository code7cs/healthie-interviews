import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CharacterCombobox } from './CharacterCombobox';

const characters = [
  {
    id: '1',
    name: 'Rick Sanchez',
    image: 'https://example.com/rick.jpeg',
  },
  {
    id: '2',
    name: 'Morty Smith',
    image: 'https://example.com/morty.jpeg',
  },
];

function renderCombobox(onChange = vi.fn()) {
  return {
    onChange,
    ...render(
      <>
        <span id="character-label">Character</span>
        <CharacterCombobox
          characters={characters}
          value=""
          disabled={false}
          invalid={false}
          labelledBy="character-label"
          onChange={onChange}
        />
      </>,
    ),
  };
}

describe('CharacterCombobox', () => {
  it('opens a rich listbox and selects a character', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();

    await user.click(screen.getByRole('combobox', { name: 'Character' }));

    const rickOption = screen.getByRole('option', { name: 'Rick Sanchez' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(rickOption.querySelector('img')).toHaveAttribute(
      'src',
      characters[0].image,
    );

    await user.click(screen.getByRole('option', { name: 'Morty Smith' }));

    expect(onChange).toHaveBeenCalledWith('2');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation and selection', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    const trigger = screen.getByRole('combobox', { name: 'Character' });

    await user.click(trigger);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('2');
  });
});
