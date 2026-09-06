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

export const MainLayout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, 'settings', 'announcements'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.active && data.text) {
            setAnnouncement(data.text);
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
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-2.5 flex items-center justify-between text-xs font-bold text-text-primary animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 text-primary shrink-0" />
              <span>{announcement}</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-text-tertiary hover:text-text-primary p-1"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Routed Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
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
