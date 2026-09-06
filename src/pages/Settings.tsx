import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KeyRound, Palette, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const { user, userRole, userNumber, updateUserProfile, resetPassword, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(displayName.trim());
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPass = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success(`Password reset link dispatched to ${user.email}`);
    } catch {
      toast.error('Failed to send reset email.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in-50 duration-300">
      <div>
        <h1 className="font-display text-3xl font-black text-primary">
          Account Settings
        </h1>
        <p className="text-sm font-medium text-text-secondary mt-1">
          Manage your Mornigami identity, password security, and theme preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-sm">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-text-primary">
              {user?.displayName || 'Anonymous Folder'}
            </h3>
            <p className="text-xs text-text-secondary">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {userNumber && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  User ID: #{userNumber}
                </span>
              )}
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-background border border-border text-text-secondary">
                Role: {userRole}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your username"
            />
          </div>
          <Button type="submit" disabled={saving} size="sm" className="font-bold text-xs h-9">
            {saving ? 'Saving...' : 'Update Display Name'}
          </Button>
        </form>
      </Card>

      {/* Security & Password */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-text-primary">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="font-display text-base font-bold">Password & Security</h3>
        </div>
        <p className="text-xs text-text-secondary">
          Dispatch an automated password reset email link to update your secure login credentials.
        </p>
        <Button variant="outline" size="sm" onClick={handleResetPass} className="text-xs font-bold h-9">
          Send Password Reset Email
        </Button>
      </Card>

      {/* Preferences */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-text-primary">
          <Palette className="w-5 h-5 text-secondary" />
          <h3 className="font-display text-base font-bold">Theme Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary font-bold">
            Current Mode: <span className="capitalize text-text-primary">{theme}</span>
          </span>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="text-xs font-bold h-9">
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </Card>

      {/* Danger Zone / Logout */}
      <Card className="p-6 border-danger/30 space-y-3 bg-danger/5">
        <h3 className="font-display text-base font-bold text-danger">Session Control</h3>
        <p className="text-xs text-text-secondary">
          Sign out of your Mornigami session. Your data remains safely persisted in Cloud Firestore.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={signOut}
          className="text-xs font-bold h-9 gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Hub</span>
        </Button>
      </Card>
    </div>
  );
};
