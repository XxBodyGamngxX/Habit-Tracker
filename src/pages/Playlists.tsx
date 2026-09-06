import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import {
  Plus,
  Trash2,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Clock,
  Flame,
  RotateCcw,
  Layers,
  Edit2,
  CheckCircle2,
  ListVideo,
  Gauge,
  X,
} from 'lucide-react';
import type {
  Playlist,
  PlaylistVideo,
  PlaylistGroup,
  PlaylistGroupColor,
  MotivationalSettings,
} from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const YOUTUBE_API_KEY = 'AIzaSyDOpHgt8xrp_SlMs0rWT8YDxeQsyeB3kvc';

const GROUP_COLORS: { id: PlaylistGroupColor; name: string; bgClass: string; textClass: string; borderClass: string; barClass: string; swatchClass: string }[] = [
  { id: 'default', name: 'Default', bgClass: 'bg-surface', textClass: 'text-text-primary', borderClass: 'border-border', barClass: 'bg-primary', swatchClass: 'bg-slate-400' },
  { id: 'rose', name: 'Rose', bgClass: 'bg-rose-50 dark:bg-rose-950/40', textClass: 'text-rose-900 dark:text-rose-200', borderClass: 'border-rose-300 dark:border-rose-800', barClass: 'bg-rose-500', swatchClass: 'bg-rose-500' },
  { id: 'amber', name: 'Amber', bgClass: 'bg-amber-50 dark:bg-amber-950/40', textClass: 'text-amber-900 dark:text-amber-200', borderClass: 'border-amber-300 dark:border-amber-800', barClass: 'bg-amber-500', swatchClass: 'bg-amber-500' },
  { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40', textClass: 'text-emerald-900 dark:text-emerald-200', borderClass: 'border-emerald-300 dark:border-emerald-800', barClass: 'bg-emerald-500', swatchClass: 'bg-emerald-500' },
  { id: 'sky', name: 'Sky', bgClass: 'bg-sky-50 dark:bg-sky-950/40', textClass: 'text-sky-900 dark:text-sky-200', borderClass: 'border-sky-300 dark:border-sky-800', barClass: 'bg-sky-500', swatchClass: 'bg-sky-500' },
  { id: 'violet', name: 'Violet', bgClass: 'bg-violet-50 dark:bg-violet-950/40', textClass: 'text-violet-900 dark:text-violet-200', borderClass: 'border-violet-300 dark:border-violet-800', barClass: 'bg-violet-500', swatchClass: 'bg-violet-500' },
  { id: 'slate', name: 'Slate', bgClass: 'bg-slate-50 dark:bg-slate-900/40', textClass: 'text-slate-900 dark:text-slate-200', borderClass: 'border-slate-300 dark:border-slate-700', barClass: 'bg-slate-500', swatchClass: 'bg-slate-500' },
];

const MOTIVATIONAL_MESSAGES = [
  'Unstoppable! You completed your videos in a row. Keep riding this wave of momentum!',
  'Consistency is the key to mastery. Outstanding work on checking off these videos!',
  'Boom! You are turning learning into a habit. Keep crushing it!',
  'Awesome streak! Your future self is thanking you right now!',
  'You are on fire! What is stopping you from doing more?',
  'Success is the sum of small efforts repeated day in and day out. Amazing learning streak!',
  'Completed your target, and you are just getting started! Keep feeding your brain.',
  'Your dedication to growth is inspiring. Let us keep this momentum going!',
  'Progress, not perfection, but this learning streak is pretty close to perfect! Keep it up!',
  'Fantastic focus! Completing videos in a row takes real dedication. You have got this!',
  'You are building momentum with every checkmark. Outstanding progress!',
  'Every lesson you watch is an investment in yourself. Excellent job!',
  'Streak alert! Keep showing up for yourself and your aspirations.',
  'Small wins lead to massive victories. Celebrating your learning streak today!',
  'Look at you go! Keep pushing the boundaries of your knowledge!',
  'Mastery is a journey, and you just took giant steps forward. Proud of your progress!',
  'The secret of getting ahead is getting started, and you are well on your way!',
  'Discipline beats motivation, but today you have both. Keep going!',
  'You are leveling up! Keep learning, keep growing!',
  'Amazing determination! Completing your lessons proves you have what it takes.',
];

// Helpers
const parseISO8601Duration = (iso?: string): number => {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const extractPlaylistId = (url: string): string | null => {
  const trimmed = url.trim();
  const reg = /[?&]list=([^#&?]+)/;
  const match = trimmed.match(reg);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
};

const parseRangeSpecification = (inputString: string): { start: number; end: number }[] => {
  const regex = /(\d+)[\s:-]+(\d+)/g;
  const ranges: { start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(inputString)) !== null) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (start > 0 && end >= start) {
      ranges.push({ start, end });
    }
  }
  return ranges;
};

export const Playlists: React.FC = () => {
  const { user, userDoc } = useAuth();
  const { gainXP } = useGamification();

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const raw = loadLocalData<Playlist[]>('playlists', []);
    return Array.isArray(raw) ? raw : [];
  });

  // Motivational Streak State
  const [motivationalSettings, setMotivationalSettings] = useState<MotivationalSettings>(() => {
    return loadLocalData<MotivationalSettings>('motivationalSettings', {
      enabled: true,
      targetCount: 5,
      streakCount: 0,
    });
  });

  // Active Embedded Video Viewer
  const [activeWatchVideo, setActiveWatchVideo] = useState<{ id: string; title: string } | null>(null);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');
  const [importing, setImporting] = useState(false);

  // Group Modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [groupTab, setGroupTab] = useState<'single' | 'quick'>('single');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupStartInput, setGroupStartInput] = useState(1);
  const [groupEndInput, setGroupEndInput] = useState(10);
  const [groupColorInput, setGroupColorInput] = useState<PlaylistGroupColor>('default');
  const [quickRangesInput, setQuickRangesInput] = useState('');

  // Motivational Popup
  const [motivationalModalOpen, setMotivationalModalOpen] = useState(false);
  const [currentMotivationalMsg, setCurrentMotivationalMsg] = useState('');

  // Sync with Firestore on userDoc arrival
  useEffect(() => {
    if (userDoc?.playlists && Array.isArray(userDoc.playlists)) {
      setPlaylists(userDoc.playlists);
      localStorage.setItem('playlists', JSON.stringify(userDoc.playlists));
    }
    if (userDoc?.motivationalSettings) {
      setMotivationalSettings(userDoc.motivationalSettings);
      localStorage.setItem('motivationalSettings', JSON.stringify(userDoc.motivationalSettings));
    }
  }, [userDoc]);

  const savePlaylistsData = (updated: Playlist[]) => {
    setPlaylists(updated);
    saveLocalData('playlists', updated, user?.uid);
  };

  const saveMotivationalData = (updated: MotivationalSettings) => {
    setMotivationalSettings(updated);
    saveLocalData('motivationalSettings', updated, user?.uid);
  };

  // Import YouTube Playlist
  const handleImportPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = extractPlaylistId(playlistUrlInput);
    if (!pid) {
      toast.error('Invalid YouTube Playlist URL or ID.');
      return;
    }

    if (playlists.some((p) => p.id === pid)) {
      toast.error('This playlist is already added.');
      return;
    }

    setImporting(true);
    try {
      // 1. Fetch Playlist Details
      const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${pid}&key=${YOUTUBE_API_KEY}`;
      const detailsResp = await fetch(detailsUrl);
      const detailsData = await detailsResp.json();

      if (detailsData.error) {
        throw new Error(detailsData.error.message);
      }

      if (!detailsData.items || detailsData.items.length === 0) {
        throw new Error('Playlist not found or is set to private.');
      }

      const snippet = detailsData.items[0].snippet;

      // 2. Fetch Playlist Items (all pages)
      let videos: PlaylistVideo[] = [];
      let nextPageToken = '';

      do {
        const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pid}&maxResults=50&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const itemsResp = await fetch(itemsUrl);
        const itemsData = await itemsResp.json();

        if (itemsData.error) throw new Error(itemsData.error.message);

        if (itemsData.items) {
          const mapped: PlaylistVideo[] = itemsData.items
            .map((item: any) => ({
              id: item.snippet?.resourceId?.videoId,
              title: item.snippet?.title || 'Untitled Lesson',
              thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
              channelTitle: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || snippet.channelTitle,
              completed: false,
              durationSeconds: 0,
            }))
            .filter((v: PlaylistVideo) => v.id && v.title !== 'Private video' && v.title !== 'Deleted video');

          videos = [...videos, ...mapped];
        }

        nextPageToken = itemsData.nextPageToken || '';
      } while (nextPageToken);

      // 3. Fetch Durations in batches of 50
      const videoIds = videos.map((v) => v.id);
      const durationMap: Record<string, number> = {};

      for (let i = 0; i < videoIds.length; i += 50) {
        const batch = videoIds.slice(i, i + 50);
        try {
          const durUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${YOUTUBE_API_KEY}`;
          const durResp = await fetch(durUrl);
          const durData = await durResp.json();
          if (durData.items) {
            durData.items.forEach((item: any) => {
              durationMap[item.id] = parseISO8601Duration(item.contentDetails?.duration);
            });
          }
        } catch (err) {
          console.warn('Batch duration fetch failed:', err);
        }
      }

      videos.forEach((v) => {
        v.durationSeconds = durationMap[v.id] || 0;
      });

      const newPlaylist: Playlist = {
        id: pid,
        title: snippet.title,
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        channel: snippet.channelTitle,
        videos,
        groups: [],
        speed: 1.0,
        expanded: true,
      };

      const updated = [newPlaylist, ...playlists];
      savePlaylistsData(updated);
      setPlaylistUrlInput('');
      setAddModalOpen(false);
      toast.success(`Imported "${newPlaylist.title}" with ${videos.length} videos!`);
    } catch (err: any) {
      console.error('Playlist import error:', err);
      toast.error(err.message || 'Failed to import YouTube playlist.');
    } finally {
      setImporting(false);
    }
  };

  // Expand / Collapse Card
  const toggleExpand = (playlistId: string) => {
    const updated = playlists.map((p) =>
      p.id === playlistId ? { ...p, expanded: !p.expanded } : p
    );
    savePlaylistsData(updated);
  };

  // Playback Speed Adjustment
  const setPlaylistSpeed = (playlistId: string, speedValue: number) => {
    if (isNaN(speedValue) || speedValue <= 0) return;
    const rounded = Math.round(speedValue * 100) / 100;
    const updated = playlists.map((p) =>
      p.id === playlistId ? { ...p, speed: rounded } : p
    );
    savePlaylistsData(updated);
    toast.info(`Playback speed set to ${rounded}x`);
  };

  // Toggle Video Completion
  const toggleVideo = (playlistId: string, videoId: string) => {
    const targetPlaylist = playlists.find((p) => p.id === playlistId);
    if (!targetPlaylist) return;

    const previouslyCompletedGroups = (targetPlaylist.groups || []).filter((g) => {
      const startIdx = g.start - 1;
      const endIdx = g.end - 1;
      for (let i = startIdx; i <= endIdx; i++) {
        if (targetPlaylist.videos[i] && !targetPlaylist.videos[i].completed) {
          return false;
        }
      }
      return true;
    });

    let completedNow = false;
    let videoTitle = '';

    const updatedVideos = targetPlaylist.videos.map((v) => {
      if (v.id === videoId) {
        completedNow = !v.completed;
        videoTitle = v.title;
        return { ...v, completed: completedNow };
      }
      return v;
    });

    const updatedPlaylist: Playlist = {
      ...targetPlaylist,
      videos: updatedVideos,
    };

    const updatedPlaylists = playlists.map((p) =>
      p.id === playlistId ? updatedPlaylist : p
    );
    savePlaylistsData(updatedPlaylists);

    // Motivational Streak Handling
    if (motivationalSettings.enabled) {
      const currentStreak = motivationalSettings.streakCount || 0;
      const target = motivationalSettings.targetCount || 5;

      if (completedNow) {
        const nextStreak = currentStreak + 1;
        saveMotivationalData({ ...motivationalSettings, streakCount: nextStreak });

        if (nextStreak >= target) {
          const randomMsg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
          setCurrentMotivationalMsg(randomMsg);
          setMotivationalModalOpen(true);
        }
      } else {
        if (currentStreak > 0) {
          saveMotivationalData({ ...motivationalSettings, streakCount: currentStreak - 1 });
        }
      }
    }

    // XP Awards
    if (completedNow) {
      gainXP(40, `Video Completed: ${videoTitle}`);

      // Check if newly completed groups
      const currentlyCompletedGroups = (updatedPlaylist.groups || []).filter((g) => {
        const startIdx = g.start - 1;
        const endIdx = g.end - 1;
        for (let i = startIdx; i <= endIdx; i++) {
          if (updatedPlaylist.videos[i] && !updatedPlaylist.videos[i].completed) {
            return false;
          }
        }
        return true;
      });

      if (currentlyCompletedGroups.length > previouslyCompletedGroups.length) {
        gainXP(200, 'Learning Group Completed!');
        toast.success('🎉 Learning Group Completed! +200 XP');
      }
    }
  };

  // Copy Playlist Link
  const handleCopyLink = (playlistId: string) => {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    navigator.clipboard.writeText(url);
    toast.success('Playlist link copied to clipboard!');
  };

  // Delete Playlist
  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm('Are you sure you want to delete this course playlist?')) {
      const updated = playlists.filter((p) => p.id !== playlistId);
      savePlaylistsData(updated);
      toast.info('Playlist removed');
    }
  };

  // Download Playlist .bat script (legacy feature)
  const handleDownloadBatch = (playlist: Playlist) => {
    const safeTitle = playlist.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `download_${safeTitle}.bat`;
    const cleanTitle = playlist.title.replace(/[&|<>^%"]/g, '');

    const scriptContent = `@echo off
set "playlist_url=https://www.youtube.com/playlist?list=${playlist.id}"

echo ==========================================
echo Downloading Playlist: ${cleanTitle}
echo ==========================================
echo.
echo This script will auto-configure everything needed.
echo.

:: ------------------------------------------------
:: 1. CHECK FOR YT-DLP
:: ------------------------------------------------
:CHECK_YTDLP
if exist "yt-dlp.exe" goto UPDATE_YTDLP
echo [1/3] Downloading yt-dlp...
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp.exe
if %errorlevel% neq 0 goto ERROR_YTDLP
goto CHECK_FFMPEG

:UPDATE_YTDLP
echo [1/3] Checking for yt-dlp updates...
yt-dlp.exe -U
goto CHECK_FFMPEG

:: ------------------------------------------------
:: 2. CHECK FOR FFMPEG
:: ------------------------------------------------
:CHECK_FFMPEG
if exist "ffmpeg.exe" goto START_DOWNLOAD
echo.
echo [2/3] FFmpeg not found. Downloading... 
echo This fixes "HTTP 403" errors. Please wait...

curl -L -o ffmpeg.zip "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
if %errorlevel% neq 0 goto ERROR_FFMPEG

echo Extracting FFmpeg...
powershell -Command "Expand-Archive -Path ffmpeg.zip -DestinationPath . -Force"

echo Setting up FFmpeg...
for /d %%I in (ffmpeg-master-*) do (
    if exist "%%I\\bin\\ffmpeg.exe" (
        move "%%I\\bin\\ffmpeg.exe" . >nul
        move "%%I\\bin\\ffprobe.exe" . >nul
    )
)

:: Cleanup
if exist "ffmpeg.zip" del "ffmpeg.zip"
for /d %%I in (ffmpeg-master-*) do rd /s /q "%%I"

if not exist "ffmpeg.exe" goto ERROR_FFMPEG_INSTALL
goto START_DOWNLOAD

:: ------------------------------------------------
:: 3. START DOWNLOAD
:: ------------------------------------------------
:START_DOWNLOAD
echo.
echo [3/3] Starting download...
echo.

if not exist "yt-dlp.exe" goto ERROR_YTDLP

yt-dlp.exe -i --ffmpeg-location . -o "%%(playlist_index)s - %%(title)s.%%(ext)s" "%playlist_url%"

echo.
echo ==========================================
echo Download Complete!
echo ==========================================
goto END

:: ------------------------------------------------
:: ERROR HANDLERS
:: ------------------------------------------------
:ERROR_YTDLP
echo.
echo ERROR: Could not download or find yt-dlp.exe.
echo Please check your internet connection.
goto END

:ERROR_FFMPEG
echo.
echo ERROR: Could not download FFmpeg.
goto END

:ERROR_FFMPEG_INSTALL
echo.
echo WARNING: FFmpeg extraction failed. Downloads might still fail.
goto START_DOWNLOAD

:END
pause
`;

    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Download script generated! Run the .bat file in an empty folder.');
  };

  // Open Group Modal
  const openGroupModal = (playlistId: string, groupId: string = '') => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    setTargetPlaylistId(playlistId);
    setTargetGroupId(groupId);

    const maxVideos = pl.videos.length;

    if (groupId) {
      const group = (pl.groups || []).find((g) => g.id === groupId);
      if (group) {
        setGroupNameInput(group.name);
        setGroupStartInput(group.start);
        setGroupEndInput(group.end);
        setGroupColorInput(group.color || 'default');
      }
      setGroupTab('single');
    } else {
      setGroupNameInput('');
      setGroupStartInput(1);
      setGroupEndInput(Math.min(10, maxVideos));
      setGroupColorInput('default');
      setQuickRangesInput('');
      setGroupTab('single');
    }

    setGroupModalOpen(true);
  };

  // Handle Group Submit
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pl = playlists.find((p) => p.id === targetPlaylistId);
    if (!pl) return;

    const maxVideos = pl.videos.length;
    let existingGroups = [...(pl.groups || [])];

    if (groupTab === 'quick') {
      const ranges = parseRangeSpecification(quickRangesInput);
      if (ranges.length === 0) {
        toast.error('No valid ranges found. Specify ranges like 1-10, 11-20.');
        return;
      }

      const parsedRanges = ranges.map((r) => ({
        start: Math.min(maxVideos, Math.max(1, r.start)),
        end: Math.min(maxVideos, Math.max(1, r.end)),
      }));

      // Internal overlaps
      for (let i = 0; i < parsedRanges.length; i++) {
        const r1 = parsedRanges[i];
        if (r1.start > r1.end) {
          toast.error('Start video number cannot exceed end video number.');
          return;
        }
        for (let j = i + 1; j < parsedRanges.length; j++) {
          const r2 = parsedRanges[j];
          if (r1.start <= r2.end && r1.end >= r2.start) {
            toast.error(`Ranges overlap: (${r1.start}-${r1.end}) and (${r2.start}-${r2.end})`);
            return;
          }
        }
      }

      // Overlaps with existing
      for (const r of parsedRanges) {
        const conflict = existingGroups.find((g) => r.start <= g.end && r.end >= g.start);
        if (conflict) {
          toast.error(`Range ${r.start}-${r.end} overlaps with existing group "${conflict.name}" (${conflict.start}-${conflict.end})`);
          return;
        }
      }

      const colors: PlaylistGroupColor[] = ['rose', 'amber', 'emerald', 'sky', 'violet', 'slate'];
      const newGroups: PlaylistGroup[] = parsedRanges.map((r, idx) => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        name: `Group ${existingGroups.length + idx + 1} (${r.start}-${r.end})`,
        start: r.start,
        end: r.end,
        color: colors[idx % colors.length],
      }));

      existingGroups = [...existingGroups, ...newGroups];
    } else {
      if (!groupNameInput.trim()) {
        toast.error('Please provide a group name.');
        return;
      }
      const clampedStart = Math.min(maxVideos, Math.max(1, groupStartInput));
      const clampedEnd = Math.min(maxVideos, Math.max(1, groupEndInput));

      if (clampedStart > clampedEnd) {
        toast.error('Start video number cannot exceed end video number.');
        return;
      }

      // Check overlap
      const conflict = existingGroups.find(
        (g) => (!targetGroupId || g.id !== targetGroupId) && clampedStart <= g.end && clampedEnd >= g.start
      );
      if (conflict) {
        toast.error(`Conflict: Range (${clampedStart}-${clampedEnd}) overlaps with "${conflict.name}" (${conflict.start}-${conflict.end})`);
        return;
      }

      if (targetGroupId) {
        existingGroups = existingGroups.map((g) =>
          g.id === targetGroupId
            ? { ...g, name: groupNameInput.trim(), start: clampedStart, end: clampedEnd, color: groupColorInput }
            : g
        );
      } else {
        existingGroups.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          name: groupNameInput.trim(),
          start: clampedStart,
          end: clampedEnd,
          color: groupColorInput,
        });
      }
    }

    const updated = playlists.map((p) =>
      p.id === targetPlaylistId ? { ...p, groups: existingGroups } : p
    );
    savePlaylistsData(updated);
    setGroupModalOpen(false);
    toast.success('Learning group saved!');
  };

  // Delete Group
  const deleteGroup = (playlistId: string, groupId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    const filtered = (pl.groups || []).filter((g) => g.id !== groupId);
    const updated = playlists.map((p) =>
      p.id === playlistId ? { ...p, groups: filtered } : p
    );
    savePlaylistsData(updated);
    toast.info('Group deleted');
  };

  // Clear All Groups
  const clearAllGroups = (playlistId: string) => {
    if (confirm('Are you sure you want to delete all learning groups for this playlist?')) {
      const updated = playlists.map((p) =>
        p.id === playlistId ? { ...p, groups: [] } : p
      );
      savePlaylistsData(updated);
      toast.info('All groups cleared');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-primary">
            Playlist Tracker
          </h1>
          <p className="text-xs sm:text-sm font-medium text-text-secondary mt-1">
            Unfold focus tracks to flow with your morning folding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Motivational Streak Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-semibold shadow-xs">
            <Flame className="w-4 h-4 text-warning fill-warning" />
            <span className="text-text-secondary">Streak:</span>
            {motivationalSettings.enabled ? (
              <span className="text-primary font-black">
                {motivationalSettings.streakCount || 0} / {motivationalSettings.targetCount || 5}
              </span>
            ) : (
              <span className="text-text-tertiary">Off</span>
            )}

            {motivationalSettings.enabled && (
              <button
                onClick={() => saveMotivationalData({ ...motivationalSettings, streakCount: 0 })}
                className="text-text-tertiary hover:text-text-primary p-0.5 rounded transition-colors"
                title="Reset Streak"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <Switch
              checked={motivationalSettings.enabled}
              onCheckedChange={(checked) =>
                saveMotivationalData({ ...motivationalSettings, enabled: checked })
              }
              title="Toggle Motivational Learning Streak"
            />
          </div>

          {/* Add Playlist Button */}
          <Button
            onClick={() => setAddModalOpen(true)}
            className="h-10 px-4 font-bold gap-2 shadow-sm rounded-2xl"
          >
            <Plus className="w-4 h-4" />
            <span>Add Playlist</span>
          </Button>
        </div>
      </div>

      {/* Playlists List */}
      {playlists.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-surface/50 p-12 text-center rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <ListVideo className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-display text-lg font-bold text-text-primary">
              No Playlists Yet
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Import a YouTube playlist to track watched lessons, time investments, and learning modules.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl font-bold text-xs gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Import Playlist</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {playlists.map((playlist) => {
            const total = playlist.videos.length;
            const completed = playlist.videos.filter((v) => v.completed).length;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            const speed = playlist.speed || 1.0;
            const totalSeconds = playlist.videos.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
            const watchedSeconds = playlist.videos
              .filter((v) => v.completed)
              .reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
            const leftSeconds = Math.max(0, totalSeconds - watchedSeconds);

            const adjustedTotal = Math.round(totalSeconds / speed);
            const adjustedWatched = Math.round(watchedSeconds / speed);
            const adjustedLeft = Math.round(leftSeconds / speed);

            const groups = playlist.groups || [];
            const completedGroups = groups.filter((g) => {
              const startIdx = g.start - 1;
              const endIdx = g.end - 1;
              for (let i = startIdx; i <= endIdx; i++) {
                if (playlist.videos[i] && !playlist.videos[i].completed) return false;
              }
              return true;
            });
            const groupProgress = groups.length === 0 ? 0 : Math.round((completedGroups.length / groups.length) * 100);

            return (
              <Card
                key={playlist.id}
                className="border border-border bg-surface rounded-3xl shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Playlist Card Header */}
                <div
                  onClick={() => toggleExpand(playlist.id)}
                  className="p-5 sm:p-6 cursor-pointer hover:bg-background/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <img
                      src={playlist.thumbnail || '/icon.png'}
                      alt=""
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-border shrink-0 bg-background"
                    />

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-text-primary truncate">
                          {playlist.title}
                        </h3>

                        {/* YouTube Link Badge */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-background border border-border text-[11px] font-mono text-text-secondary"
                        >
                          <span className="truncate max-w-[140px]">
                            list={playlist.id}
                          </span>
                          <button
                            onClick={() => handleCopyLink(playlist.id)}
                            className="text-text-tertiary hover:text-primary transition-colors p-0.5"
                            title="Copy Playlist Link"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary font-medium">
                        {completed} / {total} watched • {playlist.channel || 'YouTube Course'}
                      </p>

                      {/* Main Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                          <span>Overall Progress</span>
                          <span className="text-primary font-black">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Groups Progress Bar if present */}
                      {groups.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-text-tertiary">
                            <span>Learning Groups</span>
                            <span>
                              {completedGroups.length}/{groups.length} ({groupProgress}%)
                            </span>
                          </div>
                          <Progress value={groupProgress} className="h-1.5 bg-primary/10" />
                        </div>
                      )}

                      {/* Time Duration Stats & Speed */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-text-secondary pt-1"
                      >
                        <span className="flex items-center gap-1" title={`Original: ${formatDuration(totalSeconds)}`}>
                          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                          <span>Total: {formatDuration(adjustedTotal)}{speed !== 1 ? ` (${speed}x)` : ''}</span>
                        </span>

                        <span className="flex items-center gap-1 text-success" title={`Original: ${formatDuration(watchedSeconds)}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Watched: {formatDuration(adjustedWatched)}{speed !== 1 ? ` (${speed}x)` : ''}</span>
                        </span>

                        <span className="flex items-center gap-1 text-warning" title={`Original: ${formatDuration(leftSeconds)}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Left: {formatDuration(adjustedLeft)}{speed !== 1 ? ` (${speed}x)` : ''}</span>
                        </span>

                        {/* Speed Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-border bg-background text-text-primary hover:border-primary transition-colors text-[11px] font-bold"
                              title="Adjust Playback Speed calculation"
                            >
                              <Gauge className="w-3.5 h-3.5 text-primary" />
                              <span>Speed: {speed}x</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-36">
                            {[1, 1.25, 1.5, 1.75, 2].map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => setPlaylistSpeed(playlist.id, s)}
                                className={cn(
                                  'flex items-center justify-between text-xs font-bold',
                                  speed === s && 'text-primary'
                                )}
                              >
                                <span>{s}x</span>
                                {speed === s && <span>✓</span>}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 self-end sm:self-center shrink-0"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownloadBatch(playlist)}
                      className="w-9 h-9 rounded-xl text-text-secondary hover:text-text-primary"
                      title="Download Offline Batch Script (.bat)"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="w-9 h-9 rounded-xl text-danger border-danger/20 hover:bg-danger-bg hover:text-danger"
                      title="Delete Course Playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="w-8 h-8 flex items-center justify-center text-text-tertiary">
                      {playlist.expanded ? (
                        <ChevronUp className="w-5 h-5 transition-transform" />
                      ) : (
                        <ChevronDown className="w-5 h-5 transition-transform" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content (Groups & Video List) */}
                {playlist.expanded && (
                  <div className="border-t border-border/80 bg-background/50 p-5 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {/* Learning Groups Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary">
                            Learning Groups & Study Modules
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGroupModal(playlist.id)}
                            className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Group</span>
                          </Button>

                          {groups.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => clearAllGroups(playlist.id)}
                              className="h-8 px-2.5 text-xs font-bold text-danger hover:bg-danger-bg hover:text-danger rounded-xl"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>

                      {groups.length === 0 ? (
                        <p className="text-xs text-text-tertiary italic">
                          No custom video groups defined. Click "Add Group" to specify learning sections or batch ranges.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {groups.map((group) => {
                            const colorDef = GROUP_COLORS.find((c) => c.id === group.color) || GROUP_COLORS[0];
                            const start = Math.min(group.start, group.end);
                            const end = Math.max(group.start, group.end);

                            let groupTotal = 0;
                            let groupCompleted = 0;
                            const videoCells: { index: number; video?: PlaylistVideo }[] = [];

                            for (let vNum = start; vNum <= end; vNum++) {
                              const v = playlist.videos[vNum - 1];
                              if (v) {
                                groupTotal++;
                                if (v.completed) groupCompleted++;
                                videoCells.push({ index: vNum, video: v });
                              }
                            }

                            const gProgress = groupTotal === 0 ? 0 : Math.round((groupCompleted / groupTotal) * 100);
                            const isAllDone = groupCompleted === groupTotal && groupTotal > 0;

                            return (
                              <div
                                key={group.id}
                                className={cn(
                                  'p-4 rounded-2xl border flex flex-col justify-between relative transition-all shadow-xs',
                                  colorDef.bgClass,
                                  colorDef.borderClass,
                                  colorDef.textClass
                                )}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-start justify-between gap-2 pr-12">
                                    <h5 className="font-display font-bold text-sm truncate" title={group.name}>
                                      {group.name}
                                    </h5>
                                  </div>
                                  <p className="text-[11px] opacity-75 font-medium">
                                    Videos {group.start} - {group.end}
                                  </p>

                                  <div className="flex items-center gap-2 pt-1 text-[11px] font-bold">
                                    <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                      <div
                                        className={cn('h-full rounded-full transition-all', colorDef.barClass)}
                                        style={{ width: `${gProgress}%` }}
                                      />
                                    </div>
                                    <span>{isAllDone ? 'Completed' : `${groupCompleted}/${groupTotal}`}</span>
                                  </div>
                                </div>

                                {/* Clickable Video Cell Checkboxes */}
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 mt-3 pt-2 border-t border-current/10">
                                  {videoCells.map((cell) => {
                                    const isDone = cell.video?.completed;
                                    return (
                                      <button
                                        key={cell.index}
                                        type="button"
                                        onClick={() => cell.video && toggleVideo(playlist.id, cell.video.id)}
                                        title={`Video ${cell.index}: ${cell.video?.title || ''}`}
                                        className={cn(
                                          'aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all border',
                                          isDone
                                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                            : 'bg-background/60 hover:bg-background text-text-secondary border-current/20'
                                        )}
                                      >
                                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : cell.index}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Group Actions (Edit, Delete) */}
                                <div className="absolute top-3 right-3 flex items-center gap-1">
                                  <button
                                    onClick={() => openGroupModal(playlist.id, group.id)}
                                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                                    title="Edit Group"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteGroup(playlist.id, group.id)}
                                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-danger opacity-70 hover:opacity-100"
                                    title="Delete Group"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Video Lessons List */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                          Course Lesson Checkmarks ({playlist.videos.length} Videos)
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                        {playlist.videos.map((video, idx) => (
                          <div
                            key={video.id}
                            className={cn(
                              'flex items-center gap-3 p-2.5 rounded-2xl border transition-all',
                              video.completed
                                ? 'bg-surface/40 border-border/50 opacity-80'
                                : 'bg-surface border-border hover:border-primary/40'
                            )}
                          >
                            <span className="text-xs font-bold text-text-tertiary w-6 text-right shrink-0">
                              {idx + 1}.
                            </span>

                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleVideo(playlist.id, video.id)}
                              className={cn(
                                'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                                video.completed
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border hover:border-primary bg-background'
                              )}
                              title={video.completed ? 'Mark unwatched' : 'Mark watched (+40 XP)'}
                            >
                              {video.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            {/* Thumbnail */}
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="w-14 h-9 rounded-lg object-cover border border-border bg-black shrink-0 cursor-pointer"
                              onClick={() => setActiveWatchVideo({ id: video.id, title: video.title })}
                            />

                            {/* Video Title & Channel */}
                            <div className="flex-1 min-w-0">
                              <h6
                                onClick={() => setActiveWatchVideo({ id: video.id, title: video.title })}
                                className={cn(
                                  'text-xs font-bold truncate cursor-pointer hover:text-primary transition-colors',
                                  video.completed ? 'line-through text-text-tertiary' : 'text-text-primary'
                                )}
                                title={video.title}
                              >
                                {video.title}
                              </h6>
                              <p className="text-[11px] text-text-tertiary truncate">
                                {video.channelTitle}
                              </p>
                            </div>

                            {/* Duration Badge */}
                            {video.durationSeconds ? (
                              <span className="text-[11px] font-mono text-text-tertiary px-2 py-0.5 rounded-md bg-background border border-border shrink-0">
                                {formatDuration(video.durationSeconds)}
                              </span>
                            ) : null}

                            {/* Watch on YouTube button */}
                            <a
                              href={`https://www.youtube.com/watch?v=${video.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-text-tertiary hover:text-primary p-1 shrink-0"
                              title="Watch on YouTube"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Import Playlist Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              Add YouTube Playlist
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Paste the full link or playlist ID of any public or unlisted YouTube playlist.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportPlaylist} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">
                YouTube Playlist URL or List ID
              </label>
              <Input
                type="url"
                required
                value={playlistUrlInput}
                onChange={(e) => setPlaylistUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PL..."
                className="h-10 text-xs"
              />
              <p className="text-[11px] text-text-tertiary">
                E.g. <span className="font-mono">https://www.youtube.com/playlist?list=PLxxxx...</span>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={importing}
                className="font-bold text-xs gap-2"
              >
                {importing ? 'Importing Playlist...' : 'Import Playlist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Playlist Group Modal */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              {targetGroupId ? 'Edit Learning Group' : 'Create Learning Group'}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Divide your course videos into digestible sections, chapters, or milestone batches.
            </DialogDescription>
          </DialogHeader>

          {!targetGroupId && (
            <div className="flex gap-2 border-b border-border pb-2 pt-1">
              <button
                type="button"
                onClick={() => setGroupTab('single')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                  groupTab === 'single'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-secondary hover:bg-background'
                )}
              >
                Single Group
              </button>
              <button
                type="button"
                onClick={() => setGroupTab('quick')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                  groupTab === 'quick'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-secondary hover:bg-background'
                )}
              >
                Quick Ranges Split
              </button>
            </div>
          )}

          <form onSubmit={handleGroupSubmit} className="space-y-4 pt-2">
            {groupTab === 'single' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Group Name</label>
                  <Input
                    required
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    placeholder="e.g. Module 1: Foundations"
                    className="h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">Start Video #</label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={groupStartInput}
                      onChange={(e) => setGroupStartInput(parseInt(e.target.value, 10) || 1)}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">End Video #</label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={groupEndInput}
                      onChange={(e) => setGroupEndInput(parseInt(e.target.value, 10) || 1)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Color Swatch Radio Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary">Card Color Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setGroupColorInput(c.id)}
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center transition-all border-2',
                          c.swatchClass,
                          groupColorInput === c.id ? 'border-text-primary ring-2 ring-primary/40 scale-110' : 'border-transparent'
                        )}
                        title={c.name}
                      >
                        {groupColorInput === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary">Specify Ranges</label>
                <Input
                  required
                  value={quickRangesInput}
                  onChange={(e) => setQuickRangesInput(e.target.value)}
                  placeholder="e.g. 1-10, 11-20, 21-30"
                  className="h-10 text-xs font-mono"
                />
                <p className="text-[11px] text-text-tertiary">
                  Comma or dash separated video number ranges. Each range creates an auto-colored group!
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGroupModalOpen(false)}
                className="font-bold text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="font-bold text-xs">
                {targetGroupId ? 'Save Changes' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Motivational Streak Congratulatory Popup */}
      <Dialog open={motivationalModalOpen} onOpenChange={setMotivationalModalOpen}>
        <DialogContent className="max-w-sm text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-warning/20 text-warning mx-auto flex items-center justify-center text-3xl shadow-sm animate-bounce">
            🔥
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="font-display text-2xl font-black text-text-primary">
              Streak Milestone!
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-text-secondary leading-relaxed">
              {currentMotivationalMsg}
            </DialogDescription>
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button
              onClick={() => {
                setMotivationalModalOpen(false);
                saveMotivationalData({ ...motivationalSettings, streakCount: 0 });
              }}
              className="w-full font-bold h-10 text-xs"
            >
              Keep Flowing 🚀
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Embedded Video Watcher Dialog */}
      {activeWatchVideo && (
        <Dialog open={Boolean(activeWatchVideo)} onOpenChange={() => setActiveWatchVideo(null)}>
          <DialogContent className="max-w-4xl p-4 sm:p-6 bg-black text-white border-zinc-800">
            <div className="flex items-center justify-between pb-3">
              <h4 className="font-bold text-sm truncate max-w-xl text-zinc-200">
                {activeWatchVideo.title}
              </h4>
              <button
                onClick={() => setActiveWatchVideo(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeWatchVideo.id}?autoplay=1`}
                title={activeWatchVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
