import React from 'react';
import { usePomodoro, AUDIO_TRACKS, type AudioTrackId } from '@/context/PomodoroContext';
import { Button } from '@/components/ui/Button';
import { Play, Pause, RotateCcw, Flame, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StandalonePomodoro: React.FC = () => {
  const {
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
    activeAudioTrack,
    setAudioTrack,
    isAudioPlaying,
    toggleAudio,
  } = usePomodoro();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center max-w-lg w-full space-y-8 animate-in fade-in-50 duration-300">
      {/* Mode Switcher */}
      <div className="inline-flex p-1.5 rounded-2xl bg-surface border border-border shadow-xs gap-1.5">
        <button
          onClick={() => switchMode('work')}
          className={cn(
            'px-5 py-2 rounded-xl text-xs font-bold transition-all',
            mode === 'work'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Work ({settings.workDuration}m)
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={cn(
            'px-5 py-2 rounded-xl text-xs font-bold transition-all',
            mode === 'shortBreak'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Short Break ({settings.shortBreakDuration}m)
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={cn(
            'px-5 py-2 rounded-xl text-xs font-bold transition-all',
            mode === 'longBreak'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Long Break ({settings.longBreakDuration}m)
        </button>
      </div>

      {/* SVG Timer */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-80 h-80 sm:w-96 sm:h-96 -rotate-90 transform">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-border"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-primary transition-all duration-500 ease-out"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-display text-6xl sm:text-7xl font-black text-text-primary tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary mt-2">
            {mode === 'work' ? 'Deep Work Session' : 'Rest & Refresh'}
          </span>
        </div>
      </div>

      {/* Primary Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={isRunning ? pause : start}
          className="h-16 px-10 rounded-2xl font-bold text-lg shadow-lg gap-2"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>Start Focus</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          className="h-16 w-16 rounded-2xl border-border"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5 text-text-secondary" />
        </Button>
      </div>

      {/* Ambience Presets */}
      <div className="flex items-center gap-2 pt-2">
        {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => (
          <button
            key={id}
            onClick={() => {
              setAudioTrack(id);
              if (!isAudioPlaying) toggleAudio();
            }}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all',
              activeAudioTrack === id && isAudioPlaying
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-text-secondary hover:text-text-primary'
            )}
          >
            {AUDIO_TRACKS[id].name}
          </button>
        ))}
      </div>

      {/* Stats Quick Footer */}
      <div className="flex items-center gap-6 text-xs font-bold text-text-secondary pt-2">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-secondary" />
          <span>{stats.totalFocusTime}m focused today</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-warning fill-current" />
          <span>{stats.currentStreak} streak</span>
        </span>
      </div>
    </div>
  );
};
