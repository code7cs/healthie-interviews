import type { CharacterSummary } from './characters.types';

const CHARACTERS_ENDPOINT = 'https://rickandmortyapi.com/graphql';

const CHARACTERS_QUERY = [
  'query Characters($page: Int!) {',
  '  characters(page: $page) {',
  '    results {',
  '      id',
  '      name',
  '      image',
  '    }',
  '  }',
  '}',
].join('\n');

type GraphQLPayload = {
  data?: {
    characters?: {
      results?: unknown;
    } | null;
  };
  errors?: Array<{ message?: unknown }>;
};

function isCharacterSummary(value: unknown): value is CharacterSummary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.image === 'string'
  );
}

export async function fetchCharacters(
  signal?: AbortSignal,
): Promise<CharacterSummary[]> {
  const response = await fetch(CHARACTERS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CHARACTERS_QUERY,
      variables: { page: 1 },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      'Character request failed with status ' + response.status,
    );
  }

  const payload = (await response.json()) as GraphQLPayload;
  const graphQLError = payload.errors?.[0]?.message;

  if (typeof graphQLError === 'string') {
    throw new Error(graphQLError);
  }

  const results = payload.data?.characters?.results;

  if (!Array.isArray(results) || !results.every(isCharacterSummary)) {
    throw new Error('Character response had an unexpected shape');
  }

  return results.map(({ id, name, image }) => ({ id, name, image }));
}
