export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  summary: string;
  tags: string[];
  cover: { background: string; accent: string };
  filePath: string;
  downloadName: string;
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'pilgrim-progress',
    title: "The Pilgrim's Progress",
    author: 'John Bunyan',
    summary:
      'The timeless allegorical journey of Christian from the City of Destruction to the Celestial City — one of the most widely read books in Christian history.',
    tags: ['Discipleship', 'Classic', 'Allegory'],
    cover: { background: '#1e3a5f', accent: '#60a5fa' },
    filePath: 'https://www.gutenberg.org/files/131/131-h/131-h.htm',
    downloadName: "pilgrims-progress.pdf",
  },
  {
    id: 'cost-of-discipleship',
    title: 'The Cost of Discipleship',
    author: 'Dietrich Bonhoeffer',
    summary:
      "Bonhoeffer's landmark work on what it truly means to follow Christ — confronting cheap grace and calling believers to costly, cross-bearing obedience.",
    tags: ['Discipleship', 'Theology', 'Prayer'],
    cover: { background: '#3b1f2b', accent: '#f9a8d4' },
    filePath: 'https://archive.org/details/costofdisciplesh0000bonh',
    downloadName: 'cost-of-discipleship.pdf',
  },
  {
    id: 'imitation-of-christ',
    title: 'The Imitation of Christ',
    author: 'Thomas à Kempis',
    summary:
      'One of the most beloved devotional works in Christendom, guiding readers toward humility, self-denial, and contemplation of the life of Jesus.',
    tags: ['Devotional', 'Classic', 'Spiritual Formation'],
    cover: { background: '#2d3b1a', accent: '#86efac' },
    filePath: 'https://www.gutenberg.org/files/1653/1653-h/1653-h.htm',
    downloadName: 'imitation-of-christ.pdf',
  },
  {
    id: 'knowing-god',
    title: 'Knowing God',
    author: 'J.I. Packer',
    summary:
      'A rich exploration of the attributes and character of God, urging believers to pursue not just knowledge about God, but genuine relationship with Him.',
    tags: ['Theology', 'Spiritual Formation'],
    cover: { background: '#312e81', accent: '#a5b4fc' },
    filePath: 'https://archive.org/details/knowinggod00pack',
    downloadName: 'knowing-god.pdf',
  },
  {
    id: 'mere-christianity',
    title: 'Mere Christianity',
    author: 'C.S. Lewis',
    summary:
      'A foundational defense of the Christian faith, examining morality, human nature, and the claims of Christ with logical clarity and warm conviction.',
    tags: ['Apologetics', 'Theology', 'Classic'],
    cover: { background: '#78350f', accent: '#fcd34d' },
    filePath: 'https://archive.org/details/merechristianity0000lewi',
    downloadName: 'mere-christianity.pdf',
  },
  {
    id: 'prayer',
    title: 'Prayer',
    author: 'Philip Yancey',
    summary:
      'An honest, searching investigation into prayer — why it matters, why it sometimes feels hollow, and how to cultivate a genuine conversation with God.',
    tags: ['Prayer', 'Spiritual Formation', 'Devotional'],
    cover: { background: '#164e63', accent: '#67e8f9' },
    filePath: 'https://archive.org/details/prayer00yanc',
    downloadName: 'prayer-yancey.pdf',
  },
];
