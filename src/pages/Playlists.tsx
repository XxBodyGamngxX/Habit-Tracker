import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
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
import { Plus, Trash2, Youtube } from 'lucide-react';
import type { Playlist } from '@/types';
import { toast } from 'sonner';

export const Playlists: React.FC = () => {
  const { user } = useAuth();

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    return loadLocalData<Playlist[]>('playlists', [
      {
        id: 'default1',
        title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
        youtubeId: 'jfKfPfyJRdk',
      },
    ]);
  });

  const [activeVideoId, setActiveVideoId] = useState<string>(playlists[0]?.youtubeId || 'jfKfPfyJRdk');
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');

  const savePlaylists = (newList: Playlist[]) => {
    setPlaylists(newList);
    saveLocalData('playlists', newList, user?.uid);
  };

  const handleAddPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeInput.trim()) return;

    // Extract YouTube ID from URL or raw ID
    let vidId = youtubeInput.trim();
    if (vidId.includes('v=')) {
      vidId = vidId.split('v=')[1]?.split('&')[0] || vidId;
    } else if (vidId.includes('youtu.be/')) {
      vidId = vidId.split('youtu.be/')[1]?.split('?')[0] || vidId;
    }

    const newP: Playlist = {
      id: Date.now().toString(),
      title: title.trim(),
      youtubeId: vidId,
    };

    savePlaylists([newP, ...playlists]);
    setActiveVideoId(vidId);
    setTitle('');
    setYoutubeInput('');
    setModalOpen(false);
    toast.success('Playlist added!');
  };

  const handleDeletePlaylist = (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    savePlaylists(updated);
    toast.info('Playlist removed');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">
            Playlist Tracker & Focus Video
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Import educational course videos, listen to focus soundtracks, and track progress.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="h-10 px-4 font-bold gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add YouTube Video</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Embedded Player (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="aspect-video w-full rounded-3xl overflow-hidden border-2 border-border shadow-md bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=0&enablejsapi=1`}
              title="Mornigami Focus Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Playlists List (1 col) */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-text-primary">
            Saved Focus Playlists
          </h3>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {playlists.map((pl) => (
              <Card
                key={pl.id}
                onClick={() => setActiveVideoId(pl.youtubeId)}
                className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  activeVideoId === pl.youtubeId
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {pl.title}
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      ID: {pl.youtubeId}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlaylist(pl.id);
                  }}
                  className="text-text-tertiary hover:text-danger p-1 shrink-0"
                  title="Delete playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Playlist Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">
              Add YouTube Playlist or Video
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Paste the URL or ID of any study stream or educational playlist.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPlaylist} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Playlist Title</label>
              <Input
                required
                placeholder="e.g. Ambient Coding Music"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">YouTube URL or Video ID</label>
              <Input
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              Save to Focus Playlists
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
