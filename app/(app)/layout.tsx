import { createClient } from '../../lib/supabase/server';
import { AuthGateScreen } from '../../libs/shared-ui/AuthGateScreen';
import { AppHeader } from '../../components/AppHeader';
import { BottomNav } from '../../components/BottomNav';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import { ToastContainer } from '../../libs/shared-ui/Toast';
import { BereanProvider } from '../../lib/berean/context';
import { BibleProvider } from '../../lib/bible/context';
import { CompleteProfileBanner } from '../../libs/shared-ui/CompleteProfileBanner';
import { getStreakData } from '../../lib/profile/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthGateScreen />;
  }

  const [{ data: profile }, streakData] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, church_name')
      .eq('id', user.id)
      .single(),
    getStreakData(),
  ]);

  const profileIncomplete = !profile?.username || !profile?.church_name;

  return (
    <BereanProvider>
      <BibleProvider>
        <AppHeader streakCount={streakData.current} />
        {profileIncomplete && <CompleteProfileBanner />}
        <main className="page-content">
          {children}
        </main>
        <BottomNav />
        <PwaInstallPrompt />
        <ToastContainer />
      </BibleProvider>
    </BereanProvider>
  );
}
