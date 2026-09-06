export interface PoetryExcerpt {
  id: string;
  poet: string;
  title: string;
  text: string;
  year?: string;
  source: string;
}

interface PoetryApiResponse {
  text?: unknown;
  source?: {
    title?: unknown;
    poemTitle?: unknown;
    author?: unknown;
    gutenbergId?: unknown;
    poemId?: unknown;
  };
}

const POETRY_API_BASE_URL =
  process.env.EXPO_PUBLIC_POETRY_API_BASE_URL ?? 'http://localhost:3000';
const POETRY_API_KEY = process.env.EXPO_PUBLIC_POETRY_API_KEY;

const MAX_RANDOM_POETRY_ATTEMPTS = 5;

const CONTRIBUTOR_ROLE_PATTERN = /\[(?:compiler|contributor|editor|illustrator|translator)[^\]]*\]/i;

function getDisplayPoet(author: string): string {
  const authorParts = author.split(';').map(part => part.trim()).filter(Boolean);
  const poetPart = authorParts.find(part => !CONTRIBUTOR_ROLE_PATTERN.test(part));

  if (!poetPart) return 'Unknown poet';

  return poetPart.replace(/\s*\[[^\]]+\]/g, '').trim() || 'Unknown poet';
}

function mapApiResponseToPoetryExcerpt(data: PoetryApiResponse): PoetryExcerpt | null {
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  const source = data.source;
  const rawPoet = typeof source?.author === 'string' ? source.author.trim() : '';
  const poet = rawPoet ? getDisplayPoet(rawPoet) : '';
  const title = typeof source?.poemTitle === 'string' ? source.poemTitle.trim() : '';
  const collectionTitle = typeof source?.title === 'string' ? source.title.trim() : '';
  const gutenbergId = typeof source?.gutenbergId === 'string' ? source.gutenbergId.trim() : '';
  const poemId = typeof source?.poemId === 'string' ? source.poemId.trim() : '';

  if (!text || !poet || !title || !gutenbergId || !poemId) {
    return null;
  }

  return {
    id: poemId,
    poet,
    title,
    text,
    source: collectionTitle
      ? `${collectionTitle} · Project Gutenberg #${gutenbergId}`
      : `Project Gutenberg #${gutenbergId}`,
  };
}

export async function fetchRandomPoetry(): Promise<PoetryExcerpt> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RANDOM_POETRY_ATTEMPTS; attempt++) {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (POETRY_API_KEY) headers['x-api-key'] = POETRY_API_KEY;

      const response = await fetch(`${POETRY_API_BASE_URL.replace(/\/$/, '')}/poetry/random`, { headers });

      if (!response.ok) {
        throw new Error(`Poetry API returned ${response.status}`);
      }

      const data = (await response.json()) as PoetryApiResponse;
      const poetry = mapApiResponseToPoetryExcerpt(data);

      if (poetry) {
        return poetry;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('No fully credited poetry excerpt found');
}
