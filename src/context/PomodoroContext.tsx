import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { PomodoroMode, PomodoroSettings, PomodoroStats } from '@/types';

export type AudioTrackId = 'lofi' | 'rain' | 'cafe';

export const AUDIO_TRACKS: Record<AudioTrackId, { name: string; url: string }> = {
  lofi: {
    name: 'Lo-Fi Chill Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  rain: {
    name: 'Heavy Ambient Rain',
    url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  },
  cafe: {
    name: 'Cozy Coffee Shop',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop_atmosphere.ogg',
  },
};

interface PomodoroContextType {
  settings: PomodoroSettings;
  stats: PomodoroStats;
  mode: PomodoroMode;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  switchMode: (mode: PomodoroMode) => void;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => void;
  activeAudioTrack: AudioTrackId;
  isAudioPlaying: boolean;
  toggleAudio: () => void;
  setAudioTrack: (track: AudioTrackId) => void;
  audioVolume: number;
  setAudioVolume: (vol: number) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { gainXP } = useGamification();

  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    return loadLocalData<PomodoroSettings>('pomodoroSettings', {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
    });
  });

  const [stats, setStats] = useState<PomodoroStats>(() => {
    return loadLocalData<PomodoroStats>('pomodoroStats', {
      sessionsToday: 0,
      totalFocusTime: 0,
      currentStreak: 0,
      lastSessionDate: null,
    });
  });

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(() => settings.workDuration * 60);
  const [totalTime, setTotalTime] = useState<number>(() => settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Focus Audio State
  const [activeAudioTrack, setActiveAudioTrack] = useState<AudioTrackId>('lofi');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioVolume, setAudioVolumeState] = useState<number>(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(AUDIO_TRACKS[activeAudioTrack].url);
    audio.loop = true;
    audio.volume = audioVolume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch((err) => console.warn('Audio play failed:', err));
    }
  };

  const setAudioTrack = (track: AudioTrackId) => {
    setActiveAudioTrack(track);
    if (!audioRef.current) return;
    const wasPlaying = isAudioPlaying;
    audioRef.current.pause();
    audioRef.current.src = AUDIO_TRACKS[track].url;
    audioRef.current.load();
    if (wasPlaying) {
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch((err) => console.warn('Audio switch error:', err));
    }
  };

  const setAudioVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setAudioVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  // Sync stats from cloud if present
  useEffect(() => {
    if (userDoc?.pomodoroStats) {
      setStats(userDoc.pomodoroStats);
    }
  }, [userDoc]);

  // Check and reset daily stats at midnight
  useEffect(() => {
    const today = new Date().toDateString();
    if (stats.lastSessionDate && stats.lastSessionDate !== today) {
      const resetStats: PomodoroStats = {
        ...stats,
        sessionsToday: 0,
        lastSessionDate: today,
      };
      setStats(resetStats);
      saveLocalData('pomodoroStats', resetStats, user?.uid);
    }
  }, [stats, user]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft <= 0) {
      // Session Completed
      setIsRunning(false);

      if (mode === 'work') {
        const today = new Date().toDateString();
        const newStats: PomodoroStats = {
          sessionsToday: stats.sessionsToday + 1,
          totalFocusTime: stats.totalFocusTime + settings.workDuration,
          currentStreak: stats.currentStreak + 1,
          lastSessionDate: today,
        };
        setStats(newStats);
        saveLocalData('pomodoroStats', newStats, user?.uid);

        // Award Pomodoro XP
        gainXP(150, 'Pomodoro Session Finished');

        // Play ding sound
        try {
          const ding = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          ding.play().catch(() => {});
        } catch (_) {}

        // Switch to break
        if ((newStats.sessionsToday % 4) === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, settings, stats, user, gainXP]);

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    let durationMins = settings.workDuration;
    if (newMode === 'shortBreak') durationMins = settings.shortBreakDuration;
    if (newMode === 'longBreak') durationMins = settings.longBreakDuration;

    const seconds = durationMins * 60;
    setTotalTime(seconds);
    setTimeLeft(seconds);
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    let durationMins = settings.workDuration;
    if (mode === 'shortBreak') durationMins = settings.shortBreakDuration;
    if (mode === 'longBreak') durationMins = settings.longBreakDuration;
    const seconds = durationMins * 60;
    setTotalTime(seconds);
    setTimeLeft(seconds);
  };

  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveLocalData('pomodoroSettings', updated, user?.uid);
    reset();
  };

  return (
    <PomodoroContext.Provider
      value={{
        settings,
        stats,
        mode,
        timeLeft,
        totalTime,
        isRunning,
        start,
        pause,
        reset,
        switchMode,
        updateSettings,
        activeAudioTrack,
        isAudioPlaying,
        toggleAudio,
        setAudioTrack,
        audioVolume,
        setAudioVolume,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = (): PomodoroContextType => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
