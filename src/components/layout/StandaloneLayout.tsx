import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const StandaloneLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 px-6 border-b border-border bg-surface flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-warning" />
            ) : (
              <Moon className="w-4 h-4 text-text-secondary" />
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
};
