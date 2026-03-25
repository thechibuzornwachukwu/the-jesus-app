import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getTrendingVerses, getSuggestedPeople, searchBooks, searchCourses } from '../../../lib/discover/actions';
import { getCourseProgress } from '../../../lib/learn/actions';
import { DiscoverClient } from './DiscoverClient';

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const [trendingVerses, suggestedPeople, courseProgress, allCourses, allBooks] = await Promise.all([
    getTrendingVerses(12),
    getSuggestedPeople(user.id, 10),
    getCourseProgress(),
    searchCourses(''),
    searchBooks(''),
  ]);

  return (
    <DiscoverClient
      trendingVerses={trendingVerses}
      suggestedPeople={suggestedPeople}
      courseProgress={courseProgress}
      courses={allCourses}
      books={allBooks}
    />
  );
}
