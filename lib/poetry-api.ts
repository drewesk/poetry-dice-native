export interface PoetryExcerpt {
  id: string;
  poet: string;
  title: string;
  text: string;
  year?: string;
  source: string;
}

const POETRY_DATABASE: PoetryExcerpt[] = [
  {
    id: '1',
    poet: 'Robert Frost',
    title: 'The Road Not Taken',
    text: 'Two roads diverged in a yellow wood, And sorry I could not travel both And be one traveler, long I stood And looked down one as far as I could To where it bent in the undergrowth;',
    year: '1916',
    source: 'Public Domain'
  },
  {
    id: '2',
    poet: 'Emily Dickinson',
    title: 'Hope is the thing with feathers',
    text: '"Hope" is the thing with feathers - That perches in the soul - And sings the tune without the words - And never stops - at all -',
    year: '1891',
    source: 'Public Domain'
  },
  {
    id: '3',
    poet: 'William Shakespeare',
    title: 'Sonnet 18',
    text: 'Shall I compare thee to a summer\'s day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, And summer\'s lease hath all too short a date',
    year: '1609',
    source: 'Public Domain'
  },
  {
    id: '4',
    poet: 'Edgar Allan Poe',
    title: 'The Raven',
    text: 'Once upon a midnight dreary, while I pondered, weak and weary, Over many a quaint and curious volume of forgotten lore— While I nodded, nearly napping, suddenly there came a tapping',
    year: '1845',
    source: 'Public Domain'
  },
  {
    id: '5',
    poet: 'Walt Whitman',
    title: 'O Captain! My Captain!',
    text: 'O Captain! my Captain! our fearful trip is done, The ship has weather\'d every rack, the prize we sought is won',
    year: '1865',
    source: 'Public Domain'
  },
];

export async function fetchRandomPoetry(): Promise<PoetryExcerpt> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  const randomIndex = Math.floor(Math.random() * POETRY_DATABASE.length);
  return POETRY_DATABASE[randomIndex];
}
