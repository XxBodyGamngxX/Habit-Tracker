import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import iconLogo from '@/public/icon.png';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <div className="relative flex items-center justify-center">
          <img
            src={iconLogo}
            alt="Mornigami"
            className="w-16 h-16 object-contain animate-pulse rounded-2xl shadow-md"
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="font-display font-black text-xl text-primary tracking-tight">
            Mornigami
          </h2>
          <p className="text-xs text-text-secondary font-medium animate-pulse">
            Folding your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
