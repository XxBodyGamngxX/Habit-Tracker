import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KeyRound, Palette, LogOut, Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';

export const Settings: React.FC = () => {
  const { user, userDoc, userRole, userNumber, updateUserProfile, resetPassword, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profilePic = userDoc?.profilePicUrl || userDoc?.photoURL || user?.photoURL;

  const resizeImageToBase64 = (file: File, maxDimension = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    setUploadingPic(true);
    try {
      const base64 = await resizeImageToBase64(file, 160);
      await updateUserProfile(displayName || user?.displayName || 'User', base64);
      toast.success('Profile picture updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(`Failed to update picture: ${msg}`);
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    const ok = await confirm({
      title: 'Remove Profile Picture',
      message: 'Are you sure you want to remove your profile picture?',
      confirmText: 'Remove Picture',
      variant: 'danger',
    });
    if (!ok) return;
    setUploadingPic(true);
    try {
      await updateUserProfile(displayName || user?.displayName || 'User', '');
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(displayName.trim(), profilePic || undefined);
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
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Display */}
          <div className="relative group shrink-0">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile Avatar"
                className="w-20 h-20 rounded-2xl object-cover shadow-sm border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground font-black text-3xl flex items-center justify-center shadow-sm">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          {/* User Details and Picture Upload Controls */}
          <div className="space-y-2 flex-1">
            <h3 className="font-display text-xl font-bold text-text-primary">
              {user?.displayName || 'Anonymous Folder'}
            </h3>
            <p className="text-xs text-text-secondary">{user?.email}</p>

            <div className="flex items-center gap-2 pt-1">
              {userNumber && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  User ID: #{userNumber}
                </span>
              )}
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-background border border-border text-text-secondary">
                Role: {userRole}
              </span>
            </div>

            {/* Picture Upload Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePictureUpload}
                className="hidden"
              />

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingPic}
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 text-xs font-bold gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{uploadingPic ? 'Uploading...' : 'Upload Picture'}</span>
              </Button>

              {profilePic && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploadingPic}
                  onClick={handleRemovePicture}
                  className="h-8 px-2.5 text-xs font-bold text-danger hover:bg-danger/10 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3 pt-3 border-t border-border/60">
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
          onClick={handleSignOut}
          className="text-xs font-bold h-9 gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Hub</span>
        </Button>
      </Card>
    </div>
  );
};
