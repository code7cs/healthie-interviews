import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCharacters } from './characters.api';

function responseWith(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCharacters', () => {
  it('maps GraphQL results to character summaries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      responseWith({
        data: {
          characters: {
            results: [
              {
                id: '1',
                name: 'Rick Sanchez',
                image: 'https://example.com/rick.jpeg',
              },
            ],
          },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCharacters()).resolves.toEqual([
      {
        id: '1',
        name: 'Rick Sanchez',
        image: 'https://example.com/rick.jpeg',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://rickandmortyapi.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('rejects a non-successful HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(responseWith({}, false, 503)),
    );

    await expect(fetchCharacters()).rejects.toThrow(
      'Character request failed with status 503',
    );
  });

  it('rejects GraphQL errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWith({
          errors: [{ message: 'Resolver failed' }],
        }),
      ),
    );

    await expect(fetchCharacters()).rejects.toThrow('Resolver failed');
  });

  it('rejects malformed character data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWith({
          data: { characters: { results: [{ id: '1' }] } },
        }),
      ),
    );

    await expect(fetchCharacters()).rejects.toThrow(
      'Character response had an unexpected shape',
    );
  });
});
