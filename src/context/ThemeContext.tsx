import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('accentColor') || '';
  });

  const applyAccentColor = (color: string, currentTheme: Theme) => {
    const root = document.documentElement;
    if (color) {
      root.style.setProperty('--color-primary', color);
      // Ensure high-contrast foreground text for light pastel accents
      root.style.setProperty('--color-primary-contrast', '#0F172A');
    } else {
      if (currentTheme === 'dark') {
        root.style.setProperty('--color-primary', '#FFFFFF');
        root.style.setProperty('--color-primary-contrast', '#0F172A');
      } else {
        root.style.setProperty('--color-primary', '#0F172A');
        root.style.setProperty('--color-primary-contrast', '#FFFFFF');
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light-theme');
    } else {
      root.classList.remove('dark');
      root.classList.add('light-theme');
    }
    localStorage.setItem('theme', theme);
    applyAccentColor(accentColor, theme);
  }, [theme, accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    if (color) {
      localStorage.setItem('accentColor', color);
    } else {
      localStorage.removeItem('accentColor');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
