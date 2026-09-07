import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FocusAudioPlayer } from './FocusAudioPlayer';
import { AuthModal } from '@/components/auth/AuthModal';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const MainLayout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <TopBar onOpenAuth={() => setAuthModalOpen(true)} />

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
