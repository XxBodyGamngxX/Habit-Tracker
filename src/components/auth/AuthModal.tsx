import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setError('');
    setSuccess('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() || !password) {
      setError('Please provide your username or email, and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid username/email or password. Please check your credentials.');
      } else {
        setError(err.message || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('Please enter your preferred username.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(username.trim(), email.trim(), password);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset link has been dispatched to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
            🌱
          </div>
          <DialogTitle className="text-2xl font-display font-black text-primary">
            Welcome to Mornigami
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Shape your morning and fold your habits into structure.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-danger-bg text-danger border border-danger/20 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-success-bg text-success border border-success/20 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {mode !== 'forgot' ? (
          <Tabs
            value={mode}
            onValueChange={(val) => {
              setMode(val as 'signin' | 'signup');
              setError('');
              setSuccess('');
            }}
            className="w-full mt-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3.5 mt-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Email or Username</label>
                  <Input
                    type="text"
                    required
                    placeholder="Username or name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-text-secondary">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-11 font-bold mt-2">
                  {submitting ? 'Authenticating...' : 'Sign In to Hub'}
                </Button>
              </form>
            </TabsContent>

            {/* Create Account Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3.5 mt-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Username</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. MasterFolder"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-11 font-bold mt-2">
                  {submitting ? 'Creating Profile...' : 'Begin Mornigami Journey'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-3.5 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary">Email Address</label>
              <Input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 font-bold">
              {submitting ? 'Sending Link...' : 'Send Password Reset Email'}
            </Button>
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
