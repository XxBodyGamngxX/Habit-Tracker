import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, CloudRain, Coffee, ChevronUp, ChevronDown } from 'lucide-react';
import { usePomodoro, AUDIO_TRACKS, type AudioTrackId } from '@/context/PomodoroContext';
import { cn } from '@/lib/utils';

export const FocusAudioPlayer: React.FC = () => {
  const {
    activeAudioTrack,
    isAudioPlaying,
    toggleAudio,
    setAudioTrack,
    audioVolume,
    setAudioVolume,
  } = usePomodoro();

  const [expanded, setExpanded] = useState(false);

  const trackIcons: Record<AudioTrackId, React.ReactNode> = {
    lofi: <Music className="w-3.5 h-3.5" />,
    rain: <CloudRain className="w-3.5 h-3.5" />,
    cafe: <Coffee className="w-3.5 h-3.5" />,
  };

  return (
    <div className="fixed bottom-20 right-3 md:bottom-4 md:right-4 z-40 max-w-[calc(100vw-24px)]">
      <div
        className={cn(
          'flex flex-col bg-surface border border-border rounded-2xl shadow-lg transition-all duration-300 p-2.5 backdrop-blur-md',
          expanded ? 'w-72 max-w-[calc(100vw-24px)]' : 'w-auto'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={toggleAudio}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-primary-foreground font-bold transition-transform active:scale-95 shadow-xs',
              isAudioPlaying ? 'bg-primary' : 'bg-primary/80 hover:bg-primary'
            )}
            title={isAudioPlaying ? 'Pause Ambience' : 'Play Ambient Sound'}
          >
            {isAudioPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Current track indicator */}
          <div
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5 text-xs font-bold text-text-primary hover:text-primary transition-colors"
          >
            <span className="text-secondary">{trackIcons[activeAudioTrack]}</span>
            <span className="truncate max-w-[120px] font-sans">
              {AUDIO_TRACKS[activeAudioTrack].name}
            </span>
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-text-tertiary" />
            )}
          </div>
        </div>

        {/* Expanded Controls */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2.5 animate-in fade-in-50 duration-200">
            {/* Track Selector Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setAudioTrack(id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold border transition-all',
                    activeAudioTrack === id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-secondary hover:bg-surface'
                  )}
                >
                  {trackIcons[id]}
                  <span className="capitalize">{id}</span>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => setAudioVolume(audioVolume === 0 ? 0.5 : 0)}
                className="text-text-tertiary hover:text-text-primary"
              >
                {audioVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-semibold text-text-tertiary w-6 text-right">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
