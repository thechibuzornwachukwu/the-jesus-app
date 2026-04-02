/**
 * seed-scriptures.ts
 *
 * One-time bulk insert of the KJV Bible (~31,102 verses) into the `scriptures` table.
 * Requires newdb/06_scriptures.sql to have been run first.
 *
 * Usage:
 *   npx tsx scripts/seed-scriptures.ts
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Source: scrollmapper/bible_databases (public domain KJV)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// KJV JSON source — public domain, hosted on jsDelivr CDN
const KJV_JSON_URL =
  'https://cdn.jsdelivr.net/gh/scrollmapper/bible_databases@master/json/t_kjv.json';

interface KjvRow {
  field: [number, string, number, number, string];
  // [id, book_name, chapter, verse, text]
}

interface KjvData {
  resultset: {
    row: KjvRow[];
  };
}

type ScriptureInsert = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: 'KJV';
};

const BATCH_SIZE = 500;

async function main() {
  console.log('Fetching KJV JSON from CDN…');
  const res = await fetch(KJV_JSON_URL);
  if (!res.ok) throw new Error(`Failed to fetch KJV JSON: ${res.status} ${res.statusText}`);

  const json = (await res.json()) as KjvData;
  const rows = json.resultset.row;

  console.log(`Parsed ${rows.length} verses. Starting bulk insert…`);

  // Check existing count to allow resumable seeding
  const { count: existing } = await supabase
    .from('scriptures')
    .select('id', { count: 'exact', head: true });

  if ((existing ?? 0) >= rows.length) {
    console.log(`Scriptures table already has ${existing} rows — skipping seed.`);
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const records: ScriptureInsert[] = batch.map((r) => ({
      book: r.field[1],
      chapter: r.field[2],
      verse: r.field[3],
      text: r.field[4],
      translation: 'KJV',
    }));

    const { error } = await supabase
      .from('scriptures')
      .upsert(records, { onConflict: 'book,chapter,verse,translation', ignoreDuplicates: true });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
    }

    const pct = Math.round(((i + batch.length) / rows.length) * 100);
    process.stdout.write(`\rProgress: ${pct}% (${inserted} inserted, ${skipped} skipped)`);
  }

  console.log(`\nDone. ${inserted} verses inserted, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
