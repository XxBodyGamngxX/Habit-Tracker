import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FocusAudioPlayer } from './FocusAudioPlayer';
import { AuthModal } from '@/components/auth/AuthModal';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { Toaster } from 'sonner';
import { db, doc, getDoc } from '@/lib/firebase';
import { Megaphone, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

export const MainLayout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{ text: string; type: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, 'settings', 'announcements'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.active && data.text) {
            setAnnouncement({
              text: data.text,
              type: data.type || 'info',
            });
          }
        }
      } catch (err) {
        console.warn('Announcement fetch error:', err);
      }
    };
    fetchAnnouncement();
  }, []);

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <TopBar onOpenAuth={() => setAuthModalOpen(true)} />

        {/* Global Announcement Banner */}
        {announcement && !dismissed && (
          <div
            className={cn(
              'border-b px-6 py-2.5 flex items-center justify-between text-xs font-bold animate-in fade-in-50 duration-300',
              announcement.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                : announcement.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
                : announcement.type === 'danger'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
                : 'bg-primary/10 border-primary/20 text-text-primary'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span>{announcement.text}</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="opacity-70 hover:opacity-100 p-1 transition-opacity"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Routed Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Ambient Focus Audio Controller */}
      <FocusAudioPlayer />

      {/* Global Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <LevelUpModal />

      {/* Toast Notification Container */}
      <Toaster position="top-right" richColors />
    </div>
  );
};
