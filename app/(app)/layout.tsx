import { createClient } from '../../lib/supabase/server';
import { AuthGateScreen } from '../../libs/shared-ui/AuthGateScreen';
import { BottomNav } from '../../components/BottomNav';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import { ToastContainer } from '../../libs/shared-ui/Toast';
import { BereanProvider } from '../../lib/berean/context';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthGateScreen />;
  }

  return (
    <BereanProvider>
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
      <PwaInstallPrompt />
      <ToastContainer />
    </BereanProvider>
  );
}
