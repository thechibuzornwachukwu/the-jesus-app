import { redirect } from 'next/navigation';

// Root redirects to Engage tab (middleware handles auth check)
export default function RootPage() {
  redirect('/engage');
}
