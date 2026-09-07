import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { GamificationProvider } from './GamificationContext';
import { PomodoroProvider } from './PomodoroContext';
import { HabitsProvider } from './HabitsContext';
import { TasksProvider } from './TasksContext';
import { FinanceProvider } from './FinanceContext';
import { BountiesProvider } from './BountiesContext';
import { ConfirmProvider } from './ConfirmContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <AuthProvider>
          <GamificationProvider>
            <PomodoroProvider>
              <HabitsProvider>
                <TasksProvider>
                  <FinanceProvider>
                    <BountiesProvider>{children}</BountiesProvider>
                  </FinanceProvider>
                </TasksProvider>
              </HabitsProvider>
            </PomodoroProvider>
          </GamificationProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
};
