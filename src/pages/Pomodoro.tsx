import React, { useState } from 'react';
import { usePomodoro, AUDIO_TRACKS, type AudioTrackId } from '@/context/PomodoroContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Play, Pause, RotateCcw, Settings as SettingsIcon, Flame, Clock, Trophy, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Pomodoro: React.FC = () => {
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
    updateSettings,
    activeAudioTrack,
    setAudioTrack,
    toggleAudio,
    isAudioPlaying,
  } = usePomodoro();

  const [zenMode, setZenMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workMins, setWorkMins] = useState(settings.workDuration);
  const [shortMins, setShortMins] = useState(settings.shortBreakDuration);
  const [longMins, setLongMins] = useState(settings.longBreakDuration);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      workDuration: workMins,
      shortBreakDuration: shortMins,
      longBreakDuration: longMins,
    });
    setSettingsOpen(false);
  };

  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in-50 duration-300">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZenMode(false)}
          className="absolute top-6 right-6 font-bold text-xs gap-1.5 rounded-xl"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Zen Mode</span>
        </Button>

        <div className="relative flex flex-col items-center justify-center my-6">
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
              {mode === 'work' ? 'Zen Focus Mode' : 'Rest & Refresh'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Button
            size="lg"
            onClick={isRunning ? pause : start}
            className="h-16 px-10 rounded-2xl font-bold text-lg shadow-lg gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>Start</span>
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
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">
            Pomogami Focus Timer
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Shape distraction-free sessions. Earn +150 XP for every completed block.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZenMode(true)}
            className="rounded-xl"
            title="Enter Zen Mode (Full Screen)"
          >
            <Maximize2 className="w-4 h-4 text-text-secondary" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setWorkMins(settings.workDuration);
              setShortMins(settings.shortBreakDuration);
              setLongMins(settings.longBreakDuration);
              setSettingsOpen(true);
            }}
            className="rounded-xl"
            title="Timer Settings"
          >
            <SettingsIcon className="w-4 h-4 text-text-secondary" />
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
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
      </div>

      {/* Main Circular Timer Display */}
      <div className="relative flex flex-col items-center justify-center my-6">
        <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-border"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-primary transition-all duration-500 ease-out"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Countdown Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-display text-5xl sm:text-6xl font-black text-text-primary tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary mt-1">
            {mode === 'work' ? 'Deep Work Session' : 'Rest & Refresh'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={isRunning ? pause : start}
          className="h-14 px-8 rounded-2xl font-bold text-base shadow-md gap-2"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>Start Session</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          className="h-14 w-14 rounded-2xl border-border"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5 text-text-secondary" />
        </Button>
      </div>

      {/* Session Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <Card className="p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-text-primary">
            {stats.sessionsToday}
          </div>
          <div className="text-[11px] font-bold text-text-secondary mt-0.5">
            Sessions Today
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-text-primary">
            {stats.totalFocusTime}m
          </div>
          <div className="text-[11px] font-bold text-text-secondary mt-0.5">
            Focus Minutes
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-warning/15 text-warning flex items-center justify-center mx-auto mb-2">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div className="text-2xl font-black text-text-primary">
            {stats.currentStreak}
          </div>
          <div className="text-[11px] font-bold text-text-secondary mt-0.5">
            Current Streak
          </div>
        </Card>
      </div>

      {/* Ambient Soundscape Presets Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="font-bold text-sm text-text-primary">Focus Ambience</h4>
            <p className="text-xs text-text-secondary">Loop calming sounds during focus sessions.</p>
          </div>

          <div className="flex items-center gap-2">
            {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => (
              <button
                key={id}
                onClick={() => {
                  setAudioTrack(id);
                  if (!isAudioPlaying) toggleAudio();
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                  activeAudioTrack === id && isAudioPlaying
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-text-secondary hover:bg-surface'
                )}
              >
                {AUDIO_TRACKS[id].name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">
              Timer Durations
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Configure intervals to match your personal focus cadence.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Work Duration (Minutes)</label>
              <Input
                type="number"
                min="1"
                max="120"
                value={workMins}
                onChange={(e) => setWorkMins(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Short Break (Minutes)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={shortMins}
                onChange={(e) => setShortMins(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Long Break (Minutes)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={longMins}
                onChange={(e) => setLongMins(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Apply Timer Settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
