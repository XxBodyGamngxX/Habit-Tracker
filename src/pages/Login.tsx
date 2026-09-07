import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import iconLogo from '@/public/icon.png';

export const Login: React.FC = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Modes: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const resetFormState = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    if (newMode !== 'signin' && !email.includes('@')) {
      setEmail('');
    }
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
      toast.success('Welcome back to Mornigami! 🌅');
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Sign in error:', err);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid username/email or password. Please check your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later or reset your password.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Please choose a username for your profile.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(username.trim(), email.trim(), password);
      toast.success('Account created successfully! Welcome to Mornigami 🕊️');
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Sign up error:', err);
      let msg = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already associated with an account. Try signing in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'The email address is not formatted correctly.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
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
      setSuccess('A password reset link has been dispatched to your email. Check your inbox!');
      toast.success('Reset link sent!');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {/* Background Decorative Origami Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <img
            src={iconLogo}
            alt="Mornigami Logo"
            className="w-8 h-8 object-contain rounded-xl shadow-xs"
          />
          <span className="font-display font-black text-lg tracking-tight text-primary">
            Mornigami
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-xl w-9 h-9"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-warning" />
          ) : (
            <Moon className="w-4 h-4 text-text-secondary" />
          )}
        </Button>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <Card className="max-w-md w-full border-border/80 bg-surface/90 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-300">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Header / Brand Welcome */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs text-2xl">
                {mode === 'signin' ? '🌅' : mode === 'signup' ? '🌱' : '🔑'}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h1>
              <p className="text-xs text-text-secondary">
                {mode === 'signin' && 'Enter your credentials to enter your Mornigami hub.'}
                {mode === 'signup' && 'Fold your daily routines into structure and unlock rewards.'}
                {mode === 'forgot' && "We'll send you an email with instructions to reset your password."}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger rounded-2xl p-3.5 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in-50">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success/20 text-success rounded-2xl p-3.5 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in-50">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Mode: Sign In Form */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Username or you@example.com"
                      className="pl-9 h-11 text-xs"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-secondary">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => resetFormState('forgot')}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-11 text-xs"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 font-bold text-xs gap-2 rounded-xl mt-2"
                >
                  {submitting ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Unfold Your Day</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center text-xs text-text-secondary">
                  <span>Don't have an account yet? </span>
                  <button
                    type="button"
                    onClick={() => resetFormState('signup')}
                    className="font-bold text-primary hover:underline ml-0.5"
                  >
                    Create one now
                  </button>
                </div>
              </form>
            )}

            {/* Mode: Sign Up Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="OrigamiFolder"
                      className="pl-9 h-11 text-xs"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 h-11 text-xs"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-11 text-xs"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 h-11 text-xs"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 font-bold text-xs gap-2 rounded-xl mt-2"
                >
                  {submitting ? (
                    <span>Creating account...</span>
                  ) : (
                    <>
                      <span>Create Account & Begin</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center text-xs text-text-secondary">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => resetFormState('signin')}
                    className="font-bold text-primary hover:underline ml-0.5"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {/* Mode: Forgot Password Form */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 h-11 text-xs"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 font-bold text-xs gap-2 rounded-xl"
                >
                  {submitting ? 'Sending link...' : 'Send Password Reset Link'}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => resetFormState('signin')}
                    className="text-xs font-bold text-text-secondary hover:text-primary transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary">
        Mornigami • Shape your Morning, Fold your Routine
      </footer>
    </div>
  );
};
