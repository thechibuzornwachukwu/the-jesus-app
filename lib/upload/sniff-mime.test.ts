/**
 * Unit tests for sniff-mime.ts
 * Run with:  npx tsx lib/upload/sniff-mime.test.ts
 */
import { sniffMime, isMimeCompatible } from './sniff-mime';

let passed = 0;
let failed = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
    failed++;
  }
}

// ── sniffMime ────────────────────────────────────────────────────────────────

console.log('\nsniffMime()');

// JPEG
expect('JPEG magic', sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');

// PNG
expect('PNG magic', sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');

// WebP (RIFF....WEBP)
expect(
  'WebP magic',
  sniffMime(new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // file size (irrelevant)
    0x57, 0x45, 0x42, 0x50, // WEBP
  ])),
  'image/webp',
);

// WAV (RIFF....WAVE)
expect(
  'WAV magic',
  sniffMime(new Uint8Array([
    0x52, 0x49, 0x46, 0x46,
    0x00, 0x00, 0x00, 0x00,
    0x57, 0x41, 0x56, 0x45, // WAVE
  ])),
  'audio/wav',
);

// WebM
expect('WebM magic', sniffMime(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00])), 'video/webm');

// MP4 (ftyp box)
expect(
  'MP4 ftyp magic',
  sniffMime(new Uint8Array([
    0x00, 0x00, 0x00, 0x20, // box size
    0x66, 0x74, 0x79, 0x70, // "ftyp"
    0x69, 0x73, 0x6f, 0x6d, // brand "isom"
  ])),
  'video/mp4',
);

// MP3 (ID3 tag)
expect('MP3 ID3 magic', sniffMime(new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00])), 'audio/mpeg');

// MP3 (sync word)
expect('MP3 sync magic', sniffMime(new Uint8Array([0xff, 0xfb, 0x90, 0x00])), 'audio/mpeg');

// OGG
expect('OGG magic', sniffMime(new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00])), 'audio/ogg');

// FLAC
expect('FLAC magic', sniffMime(new Uint8Array([0x66, 0x4c, 0x61, 0x43, 0x00])), 'audio/flac');

// Unknown
expect('Unknown → null', sniffMime(new Uint8Array([0x00, 0x01, 0x02, 0x03])), null);

// Too short
expect('Too short → null', sniffMime(new Uint8Array([0xff])), null);

// ── isMimeCompatible ─────────────────────────────────────────────────────────

console.log('\nisMimeCompatible()');

// Happy paths — declared matches detected
expect('video/mp4 vs mp4',        isMimeCompatible('video/mp4',       'video/mp4'),   true);
expect('video/quicktime vs mp4',  isMimeCompatible('video/quicktime', 'video/mp4'),   true);
expect('audio/mp4 vs mp4',        isMimeCompatible('audio/mp4',       'video/mp4'),   true);
expect('video/webm vs webm',      isMimeCompatible('video/webm',      'video/webm'),  true);
expect('audio/webm vs webm',      isMimeCompatible('audio/webm',      'video/webm'),  true);
expect('image/jpeg vs jpeg',      isMimeCompatible('image/jpeg',      'image/jpeg'),  true);
expect('image/png vs png',        isMimeCompatible('image/png',       'image/png'),   true);
expect('image/webp vs webp',      isMimeCompatible('image/webp',      'image/webp'),  true);
expect('audio/mpeg vs mpeg',      isMimeCompatible('audio/mpeg',      'audio/mpeg'),  true);
expect('audio/mp3 vs mpeg',       isMimeCompatible('audio/mp3',       'audio/mpeg'),  true);
expect('audio/wav vs wav',        isMimeCompatible('audio/wav',       'audio/wav'),   true);
expect('audio/ogg vs ogg',        isMimeCompatible('audio/ogg',       'audio/ogg'),   true);
expect('audio/flac vs flac',      isMimeCompatible('audio/flac',      'audio/flac'),  true);

// Unknown detection → always pass
expect('unknown detection → pass', isMimeCompatible('video/mp4', null), true);

// ── SPOOFED EXTENSION CASES (the attack vectors we defend against) ────────────

console.log('\nSpoofed extension cases');

// Attacker uploads a JPEG with declared type "video/mp4"
expect(
  'JPEG bytes declared as video/mp4 → rejected',
  isMimeCompatible('video/mp4', 'image/jpeg'),
  false,
);

// Attacker uploads a PNG with declared type "audio/mpeg"
expect(
  'PNG bytes declared as audio/mpeg → rejected',
  isMimeCompatible('audio/mpeg', 'image/png'),
  false,
);

// Attacker uploads a WebM video with declared type "image/jpeg"
expect(
  'WebM bytes declared as image/jpeg → rejected',
  isMimeCompatible('image/jpeg', 'video/webm'),
  false,
);

// Attacker uploads MP3 audio with declared type "video/mp4"
expect(
  'MP3 bytes declared as video/mp4 → rejected',
  isMimeCompatible('video/mp4', 'audio/mpeg'),
  false,
);

// Attacker uploads WAV with declared type "image/webp"
expect(
  'WAV bytes declared as image/webp → rejected',
  isMimeCompatible('image/webp', 'audio/wav'),
  false,
);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
