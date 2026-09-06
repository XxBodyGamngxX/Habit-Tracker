import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { StoreItem, UnlockedItems } from '@/types';

export const STORE_ITEMS: {
  colors: StoreItem[];
  avatars: StoreItem[];
  borders: StoreItem[];
} = {
  colors: [
    { id: 'color_sakura', name: 'Sakura Pink', value: '#FDA4AF', cost: 300, desc: 'Unlocks a pastel cherry blossom accent color.' },
    { id: 'color_mint', name: 'Mint Sage', value: '#A7F3D0', cost: 300, desc: 'Unlocks a fresh minty green accent color.' },
    { id: 'color_butter', name: 'Butter Cream', value: '#FDE68A', cost: 300, desc: 'Unlocks a warm, creamy morning yellow accent color.' },
    { id: 'color_lavender', name: 'Lavender Mist', value: '#DDD6FE', cost: 300, desc: 'Unlocks a soothing lavender accent color.' },
  ],
  avatars: [
    { id: 'avatar_fox', name: 'Origami Fox', value: '🦊', cost: 500, desc: 'Set foxy origami as your profile avatar.' },
    { id: 'avatar_crane', name: 'Origami Crane', value: '🕊️', cost: 500, desc: 'Set graceful crane as your profile avatar.' },
    { id: 'avatar_frog', name: 'Origami Frog', value: '🐸', cost: 500, desc: 'Set jumping frog as your profile avatar.' },
    { id: 'avatar_dragon', name: 'Origami Dragon', value: '🐉', cost: 1000, desc: 'Set legendary dragon as your profile avatar.' },
  ],
  borders: [
    { id: 'border_spark', name: 'Sparkling Border', value: 'spark-border', cost: 400, desc: 'A subtle gold sparkling animation border for your badge.' },
    { id: 'border_fire', name: 'Fire Border', value: 'fire-border', cost: 400, desc: 'A hot fire flame animation border for your badge.' },
    { id: 'border_rainbow', name: 'Rainbow Border', value: 'rainbow-border', cost: 800, desc: 'A premium cycling rainbow gradient border for your badge.' },
  ],
};

interface GamificationContextType {
  userLevel: number;
  userXP: number;
  spentXP: number;
  xpNeeded: number;
  progressPercent: number;
  unlockedItems: UnlockedItems;
  activeAvatar: string;
  activeBorder: string;
  gainXP: (amount: number, reason?: string) => void;
  buyStoreItem: (category: 'colors' | 'avatars' | 'borders', item: StoreItem) => boolean;
  equipAvatar: (avatar: string) => void;
  equipBorder: (border: string) => void;
  levelUpModalOpen: boolean;
  closeLevelUpModal: () => void;
  newLevelAchieved: number | null;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { setAccentColor } = useTheme();

  const [userLevel, setUserLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('userLevel') || '1', 10);
  });
  const [userXP, setUserXP] = useState<number>(() => {
    return parseInt(localStorage.getItem('userXP') || '0', 10);
  });
  const [spentXP, setSpentXP] = useState<number>(() => {
    return parseInt(localStorage.getItem('spentXP') || '0', 10);
  });
  const [unlockedItems, setUnlockedItems] = useState<UnlockedItems>(() => {
    return loadLocalData('unlockedItems', { colors: [], avatars: [], borders: [] });
  });
  const [activeAvatar, setActiveAvatar] = useState<string>(() => {
    return localStorage.getItem('activeAvatar') || '🌱';
  });
  const [activeBorder, setActiveBorder] = useState<string>(() => {
    return localStorage.getItem('activeBorder') || '';
  });

  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);
  const [newLevelAchieved, setNewLevelAchieved] = useState<number | null>(null);

  // Sync with Firestore userDoc when it arrives
  useEffect(() => {
    if (userDoc) {
      if (userDoc.userLevel !== undefined) {
        setUserLevel(userDoc.userLevel);
        localStorage.setItem('userLevel', userDoc.userLevel.toString());
      }
      if (userDoc.userXP !== undefined) {
        setUserXP(userDoc.userXP);
        localStorage.setItem('userXP', userDoc.userXP.toString());
      }
      if (userDoc.spentXP !== undefined) {
        setSpentXP(userDoc.spentXP);
        localStorage.setItem('spentXP', userDoc.spentXP.toString());
      }
      if (userDoc.unlockedItems) {
        setUnlockedItems(userDoc.unlockedItems);
        localStorage.setItem('unlockedItems', JSON.stringify(userDoc.unlockedItems));
      }
      if (userDoc.activeAvatar) {
        setActiveAvatar(userDoc.activeAvatar);
        localStorage.setItem('activeAvatar', userDoc.activeAvatar);
      }
      if (userDoc.activeBorder !== undefined) {
        setActiveBorder(userDoc.activeBorder);
        localStorage.setItem('activeBorder', userDoc.activeBorder);
      }
    }
  }, [userDoc]);

  const xpNeeded = userLevel * 500;
  const progressPercent = Math.min(100, Math.round((userXP / xpNeeded) * 100));

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const gainXP = (amount: number) => {
    let currentXP = userXP + amount;
    let currentLvl = userLevel;
    let leveledUp = false;

    while (currentXP >= currentLvl * 500) {
      currentXP -= currentLvl * 500;
      currentLvl++;
      leveledUp = true;
    }

    setUserXP(currentXP);
    setUserLevel(currentLvl);

    localStorage.setItem('userXP', currentXP.toString());
    localStorage.setItem('userLevel', currentLvl.toString());

    if (user) {
      saveLocalData('userXP', currentXP, user.uid);
      saveLocalData('userLevel', currentLvl, user.uid);
    }

    if (leveledUp) {
      setNewLevelAchieved(currentLvl);
      setLevelUpModalOpen(true);
      triggerConfetti();
    }
  };

  const buyStoreItem = (category: 'colors' | 'avatars' | 'borders', item: StoreItem): boolean => {
    if (userXP < item.cost) {
      return false;
    }

    // Deduct cost from XP, add to spentXP
    const nextXP = userXP - item.cost;
    const nextSpent = spentXP + item.cost;

    setUserXP(nextXP);
    setSpentXP(nextSpent);
    localStorage.setItem('userXP', nextXP.toString());
    localStorage.setItem('spentXP', nextSpent.toString());

    const updatedUnlocked: UnlockedItems = {
      ...unlockedItems,
      [category]: [...(unlockedItems[category] || []), item.value],
    };
    setUnlockedItems(updatedUnlocked);
    saveLocalData('unlockedItems', updatedUnlocked, user?.uid);

    if (user) {
      saveLocalData('userXP', nextXP, user.uid);
      saveLocalData('spentXP', nextSpent, user.uid);
    }

    // Automatically equip bought item
    if (category === 'colors') {
      setAccentColor(item.value);
    } else if (category === 'avatars') {
      equipAvatar(item.value);
    } else if (category === 'borders') {
      equipBorder(item.value);
    }

    triggerConfetti();
    return true;
  };

  const equipAvatar = (avatar: string) => {
    setActiveAvatar(avatar);
    localStorage.setItem('activeAvatar', avatar);
    if (user) {
      saveLocalData('activeAvatar', avatar, user.uid);
    }
  };

  const equipBorder = (border: string) => {
    const newVal = activeBorder === border ? '' : border;
    setActiveBorder(newVal);
    localStorage.setItem('activeBorder', newVal);
    if (user) {
      saveLocalData('activeBorder', newVal, user.uid);
    }
  };

  const closeLevelUpModal = () => {
    setLevelUpModalOpen(false);
  };

  return (
    <GamificationContext.Provider
      value={{
        userLevel,
        userXP,
        spentXP,
        xpNeeded,
        progressPercent,
        unlockedItems,
        activeAvatar,
        activeBorder,
        gainXP,
        buyStoreItem,
        equipAvatar,
        equipBorder,
        levelUpModalOpen,
        closeLevelUpModal,
        newLevelAchieved,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
