/**
 * Seed Theology Docs — Phase 4 RAG ingestion
 *
 * Embeds key scripture passages with text-embedding-3-small and inserts
 * them into the `theology_docs` table.
 *
 * Prerequisites:
 *   1. Copy .env.local to .env (or set environment variables)
 *   2. OPENAI_API_KEY=sk-...
 *   3. SUPABASE_SERVICE_ROLE_KEY=... (bypass RLS for insert)
 *   4. NEXT_PUBLIC_SUPABASE_URL=https://...
 *
 * Run:
 *   npx tsx scripts/seed-theology.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Doc {
  title: string;
  source: string;
  content: string;
  track: string | null;
}

const DOCS: Doc[] = [
  // ── Salvation ──────────────────────────────────────────────────────────────
  {
    title: 'God So Loved the World',
    source: 'John 3:16',
    content:
      'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. Salvation is the gift of God rooted in His unconditional love, not in human merit.',
    track: 'salvation',
  },
  {
    title: 'All Have Sinned',
    source: 'Romans 3:23',
    content:
      'For all have sinned and fall short of the glory of God. Sin is universal — every person is separated from God\'s perfect standard. This diagnosis applies equally to all humanity regardless of culture or religion.',
    track: 'salvation',
  },
  {
    title: 'Wages of Sin vs Gift of Life',
    source: 'Romans 6:23',
    content:
      'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord. Eternal life is not earned — it is received as a gift through faith in Jesus Christ.',
    track: 'salvation',
  },
  {
    title: 'Confess and Believe',
    source: 'Romans 10:9-10',
    content:
      'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved. Salvation involves both inward faith in the resurrection and outward confession of Christ\'s lordship.',
    track: 'salvation',
  },
  {
    title: 'The Way, Truth, Life',
    source: 'John 14:6',
    content:
      'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me." Jesus makes an exclusive claim: salvation comes only through Him. He is not one path among many but the only way to God.',
    track: 'salvation',
  },
  {
    title: 'Abundant Life',
    source: 'John 10:10',
    content:
      'The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full. Salvation is not merely escape from hell — it is entrance into abundant, overflowing life in Christ.',
    track: 'salvation',
  },

  // ── Prayer ─────────────────────────────────────────────────────────────────
  {
    title: 'The Lord\'s Prayer',
    source: 'Matthew 6:9-13',
    content:
      'Our Father in heaven, hallowed be your name, your kingdom come, your will be done, on earth as it is in heaven. Give us today our daily bread. And forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from the evil one. Jesus provides a pattern for prayer: worship, alignment to God\'s will, daily provision, forgiveness, and protection.',
    track: 'prayer',
  },
  {
    title: 'Ask Seek Knock',
    source: 'Matthew 7:7-8',
    content:
      'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you. For everyone who asks receives; the one who seeks finds; and to the one who knocks, the door will be opened. Jesus calls us to persistent, expectant prayer in three escalating postures.',
    track: 'prayer',
  },
  {
    title: 'Pray Without Ceasing',
    source: '1 Thessalonians 5:17',
    content:
      'Pray continually. Unceasing prayer is not endless formal prayer but a continual orientation of the heart toward God throughout every moment of the day — a lifestyle of communion rather than a religious duty.',
    track: 'prayer',
  },
  {
    title: 'The Spirit Intercedes',
    source: 'Romans 8:26',
    content:
      'In the same way, the Spirit helps us in our weakness. We do not know what we ought to pray for, but the Spirit himself intercedes for us through wordless groans. When we don\'t know how to pray, the Holy Spirit takes our groanings and intercedes perfectly before the Father.',
    track: 'prayer',
  },
  {
    title: 'Prayer and Peace',
    source: 'Philippians 4:6-7',
    content:
      'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus. Prayer is the antidote to anxiety — presenting our concerns to God releases supernatural peace.',
    track: 'prayer',
  },
  {
    title: 'Jesus in Gethsemane',
    source: 'Matthew 26:39',
    content:
      '"My Father, if it is possible, may this cup be taken from me. Yet not as I will, but as you will." The most honest prayer is one that brings real requests but ultimately surrenders to the Father\'s will. Jesus modeled vulnerable prayer combined with complete trust.',
    track: 'prayer',
  },

  // ── Grace ──────────────────────────────────────────────────────────────────
  {
    title: 'Saved by Grace through Faith',
    source: 'Ephesians 2:8-9',
    content:
      'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast. Grace is God\'s unmerited favor — salvation entirely from Him, entirely free, received by faith not earned by works.',
    track: 'grace',
  },
  {
    title: 'Where Sin Abounded Grace Abounded',
    source: 'Romans 5:20',
    content:
      'The law was brought in so that the trespass might increase. But where sin increased, grace increased all the more. No sin is too great for God\'s grace. The magnitude of human failure is always exceeded by the magnitude of God\'s mercy.',
    track: 'grace',
  },
  {
    title: 'Neither Do I Condemn You',
    source: 'John 8:10-11',
    content:
      '"Woman, where are they? Has no one condemned you?" "No one, sir," she said. "Then neither do I condemn you," Jesus declared. "Go now and leave your life of sin." Jesus removes condemnation before issuing the call to change. Grace precedes transformation — it is the power that makes holiness possible.',
    track: 'grace',
  },
  {
    title: 'My Grace is Sufficient',
    source: '2 Corinthians 12:9',
    content:
      'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness." Therefore I will boast all the more gladly about my weaknesses, so that Christ\'s power may rest on me. Grace is not only forgiveness but divine empowerment that operates most visibly through human weakness.',
    track: 'grace',
  },
  {
    title: 'Grace that Trains',
    source: 'Titus 2:11-12',
    content:
      'For the grace of God has appeared that offers salvation to all people. It teaches us to say "No" to ungodliness and worldly passions, and to live self-controlled, upright and godly lives in this present age. True grace does not lead to license but disciplines us toward godliness.',
    track: 'grace',
  },

  // ── Identity in Christ ─────────────────────────────────────────────────────
  {
    title: 'New Creation',
    source: '2 Corinthians 5:17',
    content:
      'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here! In Christ we are not merely improved — we are fundamentally new. Old identity, old shame, old labels are displaced by a new creation reality.',
    track: 'identity',
  },
  {
    title: 'Children of God',
    source: '1 John 3:1-2',
    content:
      'See what great love the Father has lavished on us, that we should be called children of God! And that is what we are! The reason the world does not know us is that it did not know him. You are not merely a servant or a creation — you are a dearly loved child of the Father, called and acknowledged by God Himself.',
    track: 'identity',
  },
  {
    title: 'I Am the Vine',
    source: 'John 15:5',
    content:
      '"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing." Identity in Christ is relational not just positional. We exist as branches — only alive and fruitful when connected to the Vine.',
    track: 'identity',
  },
  {
    title: 'Strength through Christ',
    source: 'Philippians 4:13',
    content:
      'I can do all this through him who gives me strength. Paul\'s confidence was not in himself but in Christ who strengthened him. This is not a blank check for personal ambition but a declaration of sufficiency for every God-given assignment.',
    track: 'identity',
  },
  {
    title: 'Royal Priesthood',
    source: '1 Peter 2:9',
    content:
      'But you are a chosen people, a royal priesthood, a holy nation, God\'s special possession, that you may declare the praises of him who called you out of darkness into his wonderful light. Believers carry a fourfold identity: chosen, royal, holy, and possessed by God — called for the purpose of declaring His glory.',
    track: 'identity',
  },
  {
    title: 'Seated in Heavenly Places',
    source: 'Ephesians 2:6',
    content:
      'And God raised us up with Christ and seated us with him in the heavenly realms in Christ Jesus. Our identity in Christ is not earthly but heavenly — spiritually seated in authority alongside the risen Christ right now.',
    track: 'identity',
  },

  // ── Spiritual Warfare ──────────────────────────────────────────────────────
  {
    title: 'The Armor of God',
    source: 'Ephesians 6:10-18',
    content:
      'Finally, be strong in the Lord and in his mighty power. Put on the full armor of God, so that you can take your stand against the devil\'s schemes... the belt of truth, breastplate of righteousness, feet fitted with the gospel of peace, shield of faith, helmet of salvation, sword of the Spirit. Spiritual warfare is fought with divinely provided weapons: truth, righteousness, peace, faith, salvation, and Scripture.',
    track: 'warfare',
  },
  {
    title: 'Greater is He',
    source: '1 John 4:4',
    content:
      'You, dear children, are from God and have overcome them, because the one who is in you is greater than the one who is in the world. The Holy Spirit dwelling within a believer is greater in power than any demonic force. Victory is not fought toward — it is enforced from.',
    track: 'warfare',
  },
  {
    title: 'Submit and Resist',
    source: 'James 4:7',
    content:
      'Submit yourselves, then, to God. Resist the devil, and he will flee from you. Spiritual authority over the enemy flows from submission to God. Resistance without submission is mere willpower; resistance from submission is divine authority.',
    track: 'warfare',
  },
  {
    title: 'Divine Weapons',
    source: '2 Corinthians 10:4-5',
    content:
      'The weapons we fight with are not the weapons of the world. On the contrary, they have divine power to demolish strongholds. We demolish arguments and every pretension that sets itself up against the knowledge of God. Spiritual strongholds — patterns of thought opposed to God — are torn down through spiritual weapons, not human reasoning alone.',
    track: 'warfare',
  },
  {
    title: 'The Devil Prowls',
    source: '1 Peter 5:8-9',
    content:
      'Be alert and of sober mind. Your enemy the devil prowls around like a roaring lion looking for someone to devour. Resist him, standing firm in the faith. Vigilance is required in spiritual warfare — the enemy is real, active, and looking for opportunities. The response is sober alertness and firm faith.',
    track: 'warfare',
  },

  // ── General / Cross-track ──────────────────────────────────────────────────
  {
    title: 'The Holy Spirit as Helper',
    source: 'John 14:26',
    content:
      'But the Advocate, the Holy Spirit, whom the Father will send in my name, will teach you all things and will remind you of everything I have said to you. The Holy Spirit is the Christian\'s constant companion, teacher, and reminder of Christ\'s words.',
    track: null,
  },
  {
    title: 'Scripture is God-breathed',
    source: '2 Timothy 3:16-17',
    content:
      'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work. The Bible is the authoritative Word of God, sufficient for all matters of faith and practice.',
    track: null,
  },
  {
    title: 'Love God and Neighbor',
    source: 'Matthew 22:37-39',
    content:
      '"Love the Lord your God with all your heart and with all your soul and with all your mind." This is the first and greatest commandment. And the second is like it: "Love your neighbor as yourself." The entire Christian life is summarized in wholehearted love for God expressed outwardly in love for people.',
    track: null,
  },
  {
    title: 'Faith without Works is Dead',
    source: 'James 2:17',
    content:
      'In the same way, faith by itself, if it is not accompanied by action, is dead. Genuine saving faith always produces fruit. Faith and works are not competitors in salvation — faith saves, and saving faith inevitably produces action.',
    track: null,
  },
  {
    title: 'The Fruit of the Spirit',
    source: 'Galatians 5:22-23',
    content:
      'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law. The mark of the Spirit-filled life is not spectacular gifts alone but deep character transformation visible in these nine qualities.',
    track: null,
  },
  {
    title: 'Renewing the Mind',
    source: 'Romans 12:2',
    content:
      'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is — his good, pleasing and perfect will. Transformation begins in the mind. Christian growth is fundamentally a renewal of how we think, perceive, and respond.',
    track: null,
  },
  {
    title: 'Drawing Near to God',
    source: 'Hebrews 4:16',
    content:
      'Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need. Because of Christ\'s atoning work, believers have direct, confident access to God — not as strangers but as welcomed children.',
    track: null,
  },
];

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}

async function main() {
  console.log(`Seeding ${DOCS.length} theology docs…`);

  for (let i = 0; i < DOCS.length; i++) {
    const doc = DOCS[i];
    process.stdout.write(`  [${i + 1}/${DOCS.length}] ${doc.source}… `);

    const embedding = await embed(`${doc.title}\n${doc.source}\n${doc.content}`);

    const { error } = await supabase.from('theology_docs').insert({
      title: doc.title,
      source: doc.source,
      content: doc.content,
      track: doc.track,
      embedding,
    });

    if (error) {
      console.error(`FAILED: ${error.message}`);
    } else {
      console.log('OK');
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
