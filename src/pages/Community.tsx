import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { db, collection, getDocs, doc, setDoc } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Trophy, Users, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LeaderboardUser {
  uid: string;
  displayName: string;
  userLevel: number;
  userXP: number;
  avatar: string;
  userNumber?: number;
}

export const Community: React.FC = () => {
  const { user, userNumber } = useAuth();
  const { userLevel, userXP, activeAvatar } = useGamification();

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [friendsList, setFriendsList] = useState<string[]>(() => {
    const cached = localStorage.getItem('friendsList');
    return cached ? JSON.parse(cached) : [];
  });
  const [friendInput, setFriendInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersList: LeaderboardUser[] = [];
        if (db) {
          const snapshot = await getDocs(collection(db, 'users'));
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status !== 'deleted' && data.status !== 'banned') {
              usersList.push({
                uid: docSnap.id,
                displayName: data.displayName || data.username || 'Anonymous Folder',
                userLevel: data.userLevel || 1,
                userXP: data.userXP || 0,
                avatar: data.activeAvatar || '🌱',
                userNumber: data.userNumber,
              });
            }
          });
        }

        // Fallback or seed if empty
        if (usersList.length === 0) {
          usersList.push(
            { uid: 'mock1', displayName: 'Fold Master 🏆', userLevel: 12, userXP: 340, avatar: '🕊️', userNumber: 1 },
            { uid: 'mock2', displayName: 'Morning Light 🌅', userLevel: 8, userXP: 210, avatar: '🦊', userNumber: 2 },
            { uid: 'mock3', displayName: 'Pomodoro King 🍅', userLevel: 7, userXP: 150, avatar: '🐸', userNumber: 3 },
            {
              uid: user?.uid || 'curr',
              displayName: user?.displayName || 'You',
              userLevel,
              userXP,
              avatar: activeAvatar || '🌱',
              userNumber: userNumber || 4,
            }
          );
        }

        // Sort by level desc, then XP desc
        usersList.sort((a, b) => {
          if (b.userLevel !== a.userLevel) return b.userLevel - a.userLevel;
          return b.userXP - a.userXP;
        });

        setLeaderboard(usersList);
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, userLevel, userXP, activeAvatar, userNumber]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = friendInput.trim();
    if (!name || friendsList.includes(name)) return;

    const updated = [...friendsList, name];
    setFriendsList(updated);
    localStorage.setItem('friendsList', JSON.stringify(updated));
    setFriendInput('');

    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { friends: updated }, { merge: true });
      } catch (err) {
        console.error('Error saving friend to Firestore:', err);
      }
    }
    toast.success(`Added ${name} to your Friends Camp!`);
  };

  const handleRemoveFriend = (friendName: string) => {
    const updated = friendsList.filter((f) => f !== friendName);
    setFriendsList(updated);
    localStorage.setItem('friendsList', JSON.stringify(updated));

    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, { friends: updated }, { merge: true }).catch(() => {});
    }
    toast.info(`Removed ${friendName}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-black text-primary">
          Community & Friends Camp
        </h1>
        <p className="text-sm font-medium text-text-secondary mt-1">
          Compete on the global discipline leaderboard and build your mutual accountability circle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Global Leaderboard (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              <h3 className="font-display text-lg font-bold text-text-primary">
                Top Achievers Leaderboard
              </h3>
            </div>
            <span className="text-xs font-bold text-text-secondary">
              Ranked by Discipline Level & XP
            </span>
          </div>

          <Card className="p-2 divide-y divide-border/60">
            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-text-secondary animate-pulse">
                Folding Community Rankings...
              </div>
            ) : (
              leaderboard.map((item, idx) => {
                const rank = idx + 1;
                const isCurrent = item.uid === user?.uid;

                let rankBadge: React.ReactNode = <span className="text-xs font-black text-text-tertiary">#{rank}</span>;
                if (rank === 1) rankBadge = <span className="text-lg">🥇</span>;
                if (rank === 2) rankBadge = <span className="text-lg">🥈</span>;
                if (rank === 3) rankBadge = <span className="text-lg">🥉</span>;

                return (
                  <div
                    key={item.uid}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-xl transition-colors',
                      isCurrent
                        ? 'bg-primary/10 border border-primary/30 font-bold'
                        : 'hover:bg-background/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {rankBadge}
                      </div>

                      <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-lg shrink-0">
                        {item.avatar}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">
                          {item.displayName}
                          {isCurrent && (
                            <span className="ml-1.5 text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-primary text-primary-foreground">
                              You
                            </span>
                          )}
                        </span>
                        {item.userNumber && (
                          <span className="text-[10px] font-semibold text-text-tertiary">
                            ID: #{item.userNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-primary px-2.5 py-1 rounded-lg bg-background border border-border">
                        Lvl {item.userLevel} ({item.userXP} XP)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>

        {/* Right: Friends Camp (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg font-bold text-text-primary">
              Active Friends Camp
            </h3>
          </div>

          <Card className="p-5 space-y-4">
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <Input
                placeholder="Friend username"
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value)}
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" className="h-9 font-bold shrink-0 text-xs gap-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </form>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {friendsList.length > 0 ? (
                friendsList.map((friend) => (
                  <div
                    key={friend}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-xs">
                        👤
                      </div>
                      <span className="text-xs font-bold text-text-primary">{friend}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveFriend(friend)}
                      className="text-text-tertiary hover:text-danger p-1"
                      title="Remove friend"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-text-secondary">
                  No friends added yet. Enter a username to start tracking together!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
