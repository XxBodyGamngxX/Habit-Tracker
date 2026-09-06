import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useGamification } from '@/context/GamificationContext';

export const LevelUpModal: React.FC = () => {
  const { levelUpModalOpen, closeLevelUpModal, newLevelAchieved } = useGamification();

  return (
    <Dialog open={levelUpModalOpen} onOpenChange={closeLevelUpModal}>
      <DialogContent className="max-w-sm text-center p-6">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto text-5xl mb-2 animate-bounce">🏆</div>
          <DialogTitle className="text-3xl font-display font-black text-primary">
            Level Up!
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-text-primary mt-1">
            Congratulations! You've ascended to{' '}
            <span className="text-primary font-extrabold text-base">
              Level {newLevelAchieved}
            </span>
            !
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-text-secondary leading-relaxed my-2">
          Your discipline and focus have elevated your discipline rank. Keep folding habits and conquering daily bounties!
        </p>

        <DialogFooter className="sm:justify-center">
          <Button onClick={closeLevelUpModal} className="w-full font-bold h-11">
            Keep Going! 🚀
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
