export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  summary: string;
  tags: string[];
  filePath: string;
  downloadName: string;
  cover: {
    background: string;
    accent: string;
  };
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'gods-generals-finney',
    title: "God's Generals: Charles Finney",
    author: 'Roberts Liardon',
    summary: 'A profile of Charles Finney and the revival movement that shaped modern evangelism and prayer culture.',
    tags: ['Revival', 'Church History'],
    filePath: '/books/07_GodsGenerals_Charles Finney (Naijasermons.com.ng).pdf',
    downloadName: 'gods-generals-charles-finney.pdf',
    cover: {
      background: 'linear-gradient(145deg, #3b2918 0%, #1f140b 55%, #0f0a06 100%)',
      accent: '#d7a15d',
    },
  },
  {
    id: 'africa-gods-generals',
    title: "Africa God's Generals: The Soul",
    author: 'Eddie Sempala',
    summary: 'A revival-centered look at apostolic fire and soul-winning through African ministry testimonies and lessons.',
    tags: ['Revival', 'Missions'],
    filePath: '/books/Africa God s Generals_ The Soul - Eddie Sempala (1) (3).pdf',
    downloadName: 'africa-gods-generals-the-soul.pdf',
    cover: {
      background: 'linear-gradient(145deg, #132523 0%, #0c1716 50%, #080d0d 100%)',
      accent: '#7fd6c6',
    },
  },
  {
    id: 'signs-and-wonders',
    title: 'Signs and Wonders',
    author: 'Maria Woodworth-Etter',
    summary: 'Eyewitness-style ministry accounts focused on repentance, healing, and the demonstration of God\'s power.',
    tags: ['Healing', 'Evangelism'],
    filePath: '/books/Signs and Wonders - Maria Beulah Woodworth-Etter.pdf',
    downloadName: 'signs-and-wonders-maria-woodworth-etter.pdf',
    cover: {
      background: 'linear-gradient(145deg, #2a1737 0%, #190f24 55%, #0d0913 100%)',
      accent: '#d4a7ff',
    },
  },
  {
    id: 'zoe-god-kind-life',
    title: 'Zoe: The God-Kind of Life',
    author: 'Kenneth E. Hagin',
    summary: 'A foundational teaching on eternal life in Christ and how the believer can live from that nature daily.',
    tags: ['Identity in Christ', 'Faith'],
    filePath: '/books/Zoe-The-God-Kind-Of-Life-Kenneth-E.-Hagin-Christiandiet.com_.ng_.pdf',
    downloadName: 'zoe-the-god-kind-of-life.pdf',
    cover: {
      background: 'linear-gradient(145deg, #243115 0%, #141f0d 52%, #0b1107 100%)',
      accent: '#b9d97a',
    },
  },
];

