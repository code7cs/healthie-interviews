import { useCallback, useEffect, useState } from 'react';
import { fetchCharacters } from './characters.api';
import type {
  CharactersStatus,
  CharacterSummary,
} from './characters.types';

type CharactersState = {
  data: CharacterSummary[];
  status: CharactersStatus;
  error: Error | null;
};

const INITIAL_STATE: CharactersState = {
  data: [],
  status: 'loading',
  error: null,
};

export function useCharacters() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CharactersState>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();

    fetchCharacters(controller.signal)
      .then((data) => {
        setState({ data, status: 'success', error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState({
          data: [],
          status: 'error',
          error:
            error instanceof Error
              ? error
              : new Error('Unable to load characters'),
        });
      });

    return () => {
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ data: [], status: 'loading', error: null });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}
