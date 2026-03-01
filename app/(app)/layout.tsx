import { BottomNav } from '../../components/BottomNav';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import { ToastContainer } from '../../libs/shared-ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
      <PwaInstallPrompt />
      <ToastContainer />
    </>
  );
}
