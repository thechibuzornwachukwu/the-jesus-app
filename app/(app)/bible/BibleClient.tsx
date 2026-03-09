// BibleClient is now a thin re-export of the shared BibleReader component.
// The actual implementation lives in libs/bible/BibleReader.tsx so it can be
// reused inside the global BibleSheet overlay.
export { BibleReader as BibleClient } from '../../../libs/bible/BibleReader';
