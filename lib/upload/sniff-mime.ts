/**
 * Magic-byte MIME sniffing.
 * Reads the first 12 bytes of a file buffer and returns a canonical MIME
 * string, or null when the signature is unrecognised.
 *
 * Supported formats:
 *   MP4 / MOV / M4A  — bytes 4–7 = "ftyp"
 *   WebM / MKV       — 1A 45 DF A3
 *   JPEG             — FF D8 FF
 *   PNG              — 89 50 4E 47
 *   WebP             — RIFF????WEBP
 *   MP3              — FF FB/F3/F2 or ID3 header
 *   WAV              — RIFF????WAVE
 *   OGG              — OggS  (4F 67 67 53)
 *   FLAC             — fLaC  (66 4C 61 43)
 */
export function sniffMime(buf: Uint8Array): string | null {
  if (buf.length < 4) return null;

  // JPEG — FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';

  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return 'image/png';

  // RIFF-based: WebP and WAV need at least 12 bytes
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
  ) {
    // bytes 8–11 discriminate the sub-type
    const sub = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
    if (sub === 'WEBP') return 'image/webp';
    if (sub === 'WAVE') return 'audio/wav';
  }

  // WebM / MKV — 1A 45 DF A3
  if (
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  )
    return 'video/webm';

  // MP4 / MOV / M4A — bytes 4–7 = "ftyp"
  // Also catches QuickTime "moov" atoms at offset 4 (rare but valid)
  if (buf.length >= 8) {
    const box = String.fromCharCode(buf[4], buf[5], buf[6], buf[7]);
    if (box === 'ftyp' || box === 'moov') return 'video/mp4';
  }

  // MP3 — sync word FF FB / FF F3 / FF F2 or ID3 tag
  if (
    (buf[0] === 0xff && (buf[1] === 0xfb || buf[1] === 0xf3 || buf[1] === 0xf2)) ||
    (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) // "ID3"
  )
    return 'audio/mpeg';

  // OGG — OggS
  if (
    buf[0] === 0x4f &&
    buf[1] === 0x67 &&
    buf[2] === 0x67 &&
    buf[3] === 0x53
  )
    return 'audio/ogg';

  // FLAC — fLaC
  if (
    buf[0] === 0x66 &&
    buf[1] === 0x4c &&
    buf[2] === 0x61 &&
    buf[3] === 0x43
  )
    return 'audio/flac';

  return null;
}

/**
 * Returns true when the client-declared MIME type is compatible with what
 * the magic bytes actually indicate.
 *
 * Null detection (unknown format) is treated as compatible so that uncommon
 * but legitimate file types are not incorrectly rejected.
 */
export function isMimeCompatible(declared: string, detected: string | null): boolean {
  if (detected === null) return true; // can't determine — pass through

  // Normalise: strip parameters (e.g. "video/mp4; codecs=…")
  const d = declared.split(';')[0].trim().toLowerCase();

  switch (detected) {
    case 'video/mp4':
      // MP4 container is shared by video/mp4, video/quicktime, audio/mp4, audio/x-m4a
      return ['video/mp4', 'video/quicktime', 'audio/mp4', 'audio/x-m4a'].includes(d);

    case 'video/webm':
      // WebM container is shared by video/webm, audio/webm
      return ['video/webm', 'audio/webm'].includes(d);

    case 'image/jpeg':
      return d === 'image/jpeg';

    case 'image/png':
      return d === 'image/png';

    case 'image/webp':
      return d === 'image/webp';

    case 'audio/mpeg':
      return ['audio/mpeg', 'audio/mp3'].includes(d);

    case 'audio/wav':
      return ['audio/wav', 'audio/wave', 'audio/x-wav'].includes(d);

    case 'audio/ogg':
      return ['audio/ogg', 'audio/oga'].includes(d);

    case 'audio/flac':
      return ['audio/flac', 'audio/x-flac'].includes(d);

    default:
      return true;
  }
}
