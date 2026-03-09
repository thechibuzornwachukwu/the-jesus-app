import { createClient } from '../../lib/supabase/server';
import { AuthGateScreen } from '../../libs/shared-ui/AuthGateScreen';
import { BottomNav } from '../../components/BottomNav';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import { ToastContainer } from '../../libs/shared-ui/Toast';
import { BereanProvider } from '../../lib/berean/context';
import { CompleteProfileBanner } from '../../libs/shared-ui/CompleteProfileBanner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthGateScreen />;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, church_name')
    .eq('id', user.id)
    .single();

  const profileIncomplete = !profile?.full_name || !profile?.church_name;

  return (
    <BereanProvider>
      {profileIncomplete && <CompleteProfileBanner />}
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
      <PwaInstallPrompt />
      <ToastContainer />
    </BereanProvider>
  );
}
