// The Bible reader is now a global draggable overlay reachable from every page
// via the BookOpenText button in each tab header. This route is retired visually
// but kept so any old links / bookmarks don't 404.
import { redirect } from 'next/navigation';

export const metadata = { title: 'Bible | The JESUS App' };

export default function BiblePage() {
  redirect('/explore');
}
