import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

export type ConfirmFunction = (optionsOrMessage: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmOptions>({
    title: 'Confirm Action',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm: ConfirmFunction = useCallback((optionsOrMessage) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;

      if (typeof optionsOrMessage === 'string') {
        const isDelete =
          optionsOrMessage.toLowerCase().includes('delete') ||
          optionsOrMessage.toLowerCase().includes('remove') ||
          optionsOrMessage.toLowerCase().includes('clear');

        setConfig({
          title: isDelete ? 'Confirm Deletion' : 'Confirmation',
          message: optionsOrMessage,
          confirmText: isDelete ? 'Delete' : 'Confirm',
          cancelText: 'Cancel',
          variant: isDelete ? 'danger' : 'primary',
        });
      } else {
        const isDelete =
          (optionsOrMessage.message || '').toLowerCase().includes('delete') ||
          (optionsOrMessage.message || '').toLowerCase().includes('remove') ||
          (optionsOrMessage.message || '').toLowerCase().includes('clear');

        setConfig({
          title: optionsOrMessage.title || (isDelete ? 'Confirm Deletion' : 'Confirmation'),
          message: optionsOrMessage.message,
          confirmText: optionsOrMessage.confirmText || (isDelete ? 'Delete' : 'Confirm'),
          cancelText: optionsOrMessage.cancelText || 'Cancel',
          variant: optionsOrMessage.variant || (isDelete ? 'danger' : 'primary'),
        });
      }

      setIsOpen(true);
    });
  }, []);

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  };

  const getVariantStyles = () => {
    switch (config.variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-danger" />,
          iconBg: 'bg-rose-500/10 text-danger border border-rose-500/20',
          confirmBtn: 'bg-danger hover:bg-danger/90 text-white shadow-xs',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-warning" />,
          iconBg: 'bg-amber-500/10 text-warning border border-amber-500/20',
          confirmBtn: 'bg-warning hover:bg-warning/90 text-slate-900 shadow-xs',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-secondary" />,
          iconBg: 'bg-sky-500/10 text-secondary border border-sky-500/20',
          confirmBtn: 'bg-secondary hover:bg-secondary/90 text-white shadow-xs',
        };
      default:
        return {
          icon: <HelpCircle className="w-5 h-5 text-primary" />,
          iconBg: 'bg-primary/10 text-primary border border-primary/20',
          confirmBtn: 'bg-primary text-primary-contrast shadow-xs',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose(false)}>
        <DialogContent className="max-w-md w-[calc(100vw-28px)] sm:w-full p-5 sm:p-6 bg-surface border border-border rounded-2xl shadow-2xl">
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-2xl shrink-0 flex items-center justify-center', styles.iconBg)}>
              {styles.icon}
            </div>
            <div className="space-y-1 flex-1 min-w-0 pt-0.5">
              <DialogTitle className="text-base sm:text-lg font-display font-bold text-text-primary tracking-tight">
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-text-secondary leading-relaxed break-words">
                {config.message}
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              className="h-9 px-4 text-xs font-bold rounded-xl"
            >
              {config.cancelText || 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={() => handleClose(true)}
              className={cn('h-9 px-4 text-xs font-bold rounded-xl transition-all', styles.confirmBtn)}
              autoFocus
            >
              {config.confirmText || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFunction => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
