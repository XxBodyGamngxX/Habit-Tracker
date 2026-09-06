import React, { useState } from 'react';
import { useGamification, STORE_ITEMS } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ShoppingBag, Sparkles, Check, Palette, Smile, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StoreItem } from '@/types';

export const Store: React.FC = () => {
  const {
    userXP,
    unlockedItems,
    activeAvatar,
    activeBorder,
    buyStoreItem,
    equipAvatar,
    equipBorder,
  } = useGamification();

  const { accentColor, setAccentColor } = useTheme();

  const [activeTab, setActiveTab] = useState<'colors' | 'avatars' | 'borders'>('colors');

  const handleAction = (category: 'colors' | 'avatars' | 'borders', item: StoreItem) => {
    const isUnlocked = unlockedItems[category]?.includes(item.value);

    if (isUnlocked) {
      if (category === 'colors') {
        setAccentColor(item.value);
        toast.success(`Equipped ${item.name} accent!`);
      } else if (category === 'avatars') {
        equipAvatar(item.value);
        toast.success(`Equipped ${item.name} avatar!`);
      } else if (category === 'borders') {
        equipBorder(item.value);
        toast.success(`Equipped ${item.name} animated border!`);
      }
    } else {
      if (userXP < item.cost) {
        toast.error(`You need ${item.cost} XP to unlock this item. Complete habits, tasks, or pomodoros!`);
        return;
      }
      const ok = buyStoreItem(category, item);
      if (ok) {
        toast.success(`Successfully purchased and equipped ${item.name}!`);
      }
    }
  };

  const renderItemCard = (category: 'colors' | 'avatars' | 'borders', item: StoreItem) => {
    const isUnlocked = unlockedItems[category]?.includes(item.value);
    let isEquipped = false;
    if (category === 'colors') isEquipped = accentColor === item.value;
    if (category === 'avatars') isEquipped = activeAvatar === item.value;
    if (category === 'borders') isEquipped = activeBorder === item.value;

    return (
      <Card
        key={item.id}
        className={cn(
          'p-5 flex flex-col justify-between transition-all duration-200 border-2',
          isEquipped
            ? 'border-primary bg-primary/5 shadow-xs'
            : isUnlocked
            ? 'border-border bg-surface hover:border-primary/40'
            : 'border-border/80 bg-surface'
        )}
      >
        <div className="space-y-3">
          {/* Visual Preview */}
          <div className="flex items-center justify-between">
            {category === 'colors' && (
              <div
                className="w-12 h-12 rounded-2xl border-2 border-border shadow-xs"
                style={{ backgroundColor: item.value }}
              />
            )}
            {category === 'avatars' && (
              <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-3xl shadow-xs">
                {item.value}
              </div>
            )}
            {category === 'borders' && (
              <div
                className={cn(
                  'w-12 h-12 rounded-full bg-surface border-2 border-border flex items-center justify-center text-xl shadow-xs transition-all',
                  item.value
                )}
              >
                🌱
              </div>
            )}

            <div className="text-right">
              {isUnlocked ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-success-bg text-success border border-success/30">
                  Unlocked
                </span>
              ) : (
                <span className="text-xs font-black text-warning">
                  {item.cost} XP
                </span>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display text-base font-bold text-text-primary">
              {item.name}
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              {item.desc}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <Button
            size="sm"
            onClick={() => handleAction(category, item)}
            disabled={isEquipped}
            className={cn(
              'w-full h-9 text-xs font-bold transition-all',
              isEquipped
                ? 'bg-primary/20 text-primary cursor-default'
                : isUnlocked
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : userXP >= item.cost
                ? 'bg-warning text-slate-900 hover:bg-warning/90'
                : 'bg-surface border border-border text-text-tertiary cursor-not-allowed'
            )}
          >
            {isEquipped ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Active Equipped
              </span>
            ) : isUnlocked ? (
              'Equip Item'
            ) : userXP >= item.cost ? (
              `Unlock for ${item.cost} XP`
            ) : (
              `Need ${item.cost} XP`
            )}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-border bg-gradient-to-r from-warning/10 via-surface to-primary/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-warning">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Rewards & Customization Store</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text-primary">
            Fold Your Aesthetic
          </h1>
          <p className="text-xs text-text-secondary max-w-md">
            Exchange your hard-earned XP progression points for custom pastel morning accents, origami avatars, and glowing badge animations.
          </p>
        </div>

        {/* User XP Vault Indicator */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface border-2 border-warning/40 shadow-xs shrink-0 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center text-xl">
            <Sparkles className="w-5 h-5 text-warning fill-warning" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-secondary uppercase">Available XP</div>
            <div className="text-xl font-black text-text-primary">{userXP.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="h-11">
          <TabsTrigger value="colors" className="gap-2 text-xs font-bold px-4">
            <Palette className="w-4 h-4" />
            <span>Accent Colors</span>
          </TabsTrigger>
          <TabsTrigger value="avatars" className="gap-2 text-xs font-bold px-4">
            <Smile className="w-4 h-4" />
            <span>Origami Avatars</span>
          </TabsTrigger>
          <TabsTrigger value="borders" className="gap-2 text-xs font-bold px-4">
            <Shield className="w-4 h-4" />
            <span>Animated Borders</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STORE_ITEMS.colors.map((item) => renderItemCard('colors', item))}
          </div>
        </TabsContent>

        <TabsContent value="avatars" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STORE_ITEMS.avatars.map((item) => renderItemCard('avatars', item))}
          </div>
        </TabsContent>

        <TabsContent value="borders" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STORE_ITEMS.borders.map((item) => renderItemCard('borders', item))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
