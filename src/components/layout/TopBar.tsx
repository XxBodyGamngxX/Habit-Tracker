import React from 'react';
import { Sun, Moon, Palette, LogIn, User as UserIcon, Shield, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGamification, STORE_ITEMS } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TopBarProps {
  onOpenAuth?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAuth }) => {
  const { user, userDoc, userRole, userNumber, signOut } = useAuth();
  const { userLevel, userXP, xpNeeded, progressPercent, activeAvatar, activeBorder, unlockedItems } = useGamification();
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const navigate = useNavigate();
  const userAvatarUrl = userDoc?.profilePicUrl || userDoc?.photoURL || user?.photoURL;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const unlockedColors = Array.isArray(unlockedItems?.colors) ? unlockedItems.colors : [];
  const unlockedColorItems = STORE_ITEMS.colors.filter((c) =>
    unlockedColors.includes(c.value)
  );

  const safeLevel = userLevel || 1;
  const safeXP = userXP || 0;
  const safeXPNeeded = xpNeeded || 500;
  const safeProgress = Math.max(0, Math.min(100, progressPercent || 0));

  return (
    <header className="h-16 px-6 border-b border-border bg-surface flex items-center justify-end sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {/* 1. Accent Color Picker Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl w-9 h-9"
              title="Change Accent Color"
            >
              <Palette className="w-4 h-4 text-text-secondary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Accent Colors</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAccentColor('')} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-border bg-slate-900 dark:bg-white" />
              <span>Theme Default</span>
            </DropdownMenuItem>
            {unlockedColorItems.length > 0 ? (
              unlockedColorItems.map((color) => (
                <DropdownMenuItem
                  key={color.id}
                  onClick={() => setAccentColor(color.value)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: color.value }}
                  />
                  <span>{color.name}</span>
                  {accentColor === color.value && <span className="ml-auto text-xs text-primary font-bold">✓</span>}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem
                onClick={() => navigate('/store')}
                className="text-xs text-text-tertiary"
              >
                Unlock more in Store 🛍️
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Dark/Light Mode Toggle Button */}
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

        {/* 3. XP Progression Bar Widget */}
        <div className="flex items-center gap-3 bg-background px-3.5 py-1.5 rounded-2xl border border-border w-56 sm:w-64 md:w-72 shadow-xs shrink-0">
          {/* Level Badge */}
          <div className="bg-primary text-primary-foreground text-xs font-black px-2 py-0.5 rounded-lg shadow-xs shrink-0">
            L{safeLevel}
          </div>

          {/* Avatar with Animated Border */}
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-base bg-surface border-2 border-border shrink-0 transition-all',
              activeBorder || ''
            )}
            title={`Level ${safeLevel} Achiever`}
          >
            {activeAvatar || '🌱'}
          </div>

          {/* Progress Bar & Details */}
          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <div className="flex justify-between text-[10px] font-bold text-text-secondary leading-none">
              <span>XP Progress</span>
              <span>
                {safeXP} / {safeXPNeeded} XP
              </span>
            </div>
            <Progress value={safeProgress} className="h-1.5" />
          </div>
        </div>

        {/* 4. User Profile / Login */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl border border-border bg-background hover:bg-surface transition-all"
                title="Account Menu"
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-text-primary truncate max-w-[90px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  {userNumber && (
                    <span className="text-[10px] font-semibold text-text-tertiary">
                      #{userNumber}
                    </span>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex items-center gap-2.5 py-2.5">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shrink-0">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-text-primary text-xs truncate">
                    {user.displayName || 'User'}
                  </span>
                  <span className="text-[11px] text-text-secondary truncate font-normal">
                    {user.email}
                  </span>
                  {userNumber && (
                    <span className="text-[10px] text-primary font-bold">
                      User ID: #{userNumber}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <UserIcon className="w-4 h-4 mr-2" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/store')}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                <span>Rewards Store</span>
              </DropdownMenuItem>
              {userRole === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-danger focus:text-danger focus:bg-danger-bg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={onOpenAuth || (() => navigate('/login'))}
            className="rounded-xl h-9 px-3.5 text-xs font-bold gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
};
