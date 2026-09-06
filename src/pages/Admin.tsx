import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, collection, getDocs, doc, setDoc, getDoc } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Shield, Search, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { UserDoc } from '@/types';

export const Admin: React.FC = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState<Array<UserDoc & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<(UserDoc & { id: string }) | null>(null);

  // Override balances
  const [overrideIncome, setOverrideIncome] = useState<number>(0);
  const [overrideSavings, setOverrideSavings] = useState<number>(0);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);

  const fetchAllUsers = async () => {
    if (userRole !== 'admin' || !db) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: Array<UserDoc & { id: string }> = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as UserDoc) });
      });
      setUsers(list);

      // Fetch announcement
      const annSnap = await getDoc(doc(db, 'settings', 'announcements'));
      if (annSnap.exists()) {
        const d = annSnap.data();
        setAnnouncementText(d.text || '');
        setAnnouncementActive(d.active === true);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'announcements'), {
        text: announcementText.trim(),
        active: announcementActive,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast.success('System announcement updated!');
    } catch {
      toast.error('Failed to update announcement');
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [userRole]);

  if (userRole !== 'admin') {
    return (
      <Card className="p-12 text-center max-w-md mx-auto my-12 border-dashed">
        <Shield className="w-12 h-12 text-danger mx-auto mb-3" />
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Access Restricted
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          You need Administrator permissions to view the Mornigami moderation portal.
        </p>
      </Card>
    );
  }

  const handleSelectUser = (u: UserDoc & { id: string }) => {
    setSelectedUser(u);
    setOverrideIncome(u.financeData?.monthlyIncome || 0);
    setOverrideSavings(u.financeData?.savingsBalance || 0);
  };

  const handleSaveOverrides = async () => {
    if (!selectedUser || !db) return;
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const updatedFinance = {
        ...(selectedUser.financeData || {}),
        monthlyIncome: overrideIncome,
        savingsBalance: overrideSavings,
      };
      await setDoc(userRef, { financeData: updatedFinance }, { merge: true });
      toast.success(`Updated financial overrides for ${selectedUser.displayName || selectedUser.email}`);
      fetchAllUsers();
    } catch {
      toast.error('Failed to save overrides');
    }
  };

  const handleToggleBan = async (u: UserDoc & { id: string }) => {
    if (!db) return;
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    try {
      const userRef = doc(db, 'users', u.id);
      await setDoc(userRef, { status: newStatus }, { merge: true });
      toast.success(`User status changed to ${newStatus}`);
      fetchAllUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.userNumber && u.userNumber.toString().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-primary flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-primary" />
            <span>Admin Portal</span>
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Oversee user accounts, inspect ledgers, and manage balance overrides.
          </p>
        </div>

        <Button onClick={fetchAllUsers} size="sm" variant="outline" className="font-bold text-xs">
          Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-text-tertiary" />
              <Input
                placeholder="Search users by name, email, or #ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-background/60 border-b border-border font-bold uppercase text-[10px] text-text-secondary">
                    <th className="p-3 pl-4">User</th>
                    <th className="p-3">ID</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">
                        Loading users list...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className={cn(
                          'hover:bg-background/40 transition-colors cursor-pointer',
                          selectedUser?.id === u.id && 'bg-primary/5 font-semibold'
                        )}
                        onClick={() => handleSelectUser(u)}
                      >
                        <td className="p-3 pl-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary">{u.displayName || 'Unnamed'}</span>
                            <span className="text-[11px] text-text-secondary truncate max-w-[140px]">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-primary">#{u.userNumber || '—'}</td>
                        <td className="p-3 uppercase font-bold text-[10px]">{u.role || 'user'}</td>
                        <td className="p-3">
                          <span
                            className={cn(
                              'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                              u.status === 'banned' ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'
                            )}
                          >
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="p-3 text-right pr-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBan(u);
                            }}
                            className="h-7 text-[11px] font-bold text-danger hover:bg-danger-bg"
                          >
                            {u.status === 'banned' ? 'Unban' : 'Ban'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* User Inspector Details (1 col) */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-text-primary">
            Account Inspector
          </h3>

          {selectedUser ? (
            <Card className="p-5 space-y-4">
              <div>
                <h4 className="font-bold text-base text-text-primary">
                  {selectedUser.displayName || selectedUser.email}
                </h4>
                <p className="text-xs text-text-secondary">ID: #{selectedUser.userNumber} • UID: {selectedUser.id}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Monthly Spendable Income</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={overrideIncome}
                    onChange={(e) => setOverrideIncome(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Savings Vault Balance</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={overrideSavings}
                    onChange={(e) => setOverrideSavings(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <Button onClick={handleSaveOverrides} className="w-full h-9 font-bold text-xs mt-2">
                  Save Balance Overrides
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed text-text-secondary text-xs">
              Select a user from the list to inspect their profile and apply overrides.
            </Card>
          )}

          {/* System Announcement Manager */}
          <Card className="p-5 space-y-3 border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm text-text-primary">System Announcement</h4>
            </div>
            <p className="text-[11px] text-text-secondary">
              Broadcast an alert banner across the entire Mornigami app.
            </p>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3">
              <div className="space-y-1">
                <Input
                  placeholder="e.g., Welcome to Mornigami 2.0!"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announcementActiveCheckbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary"
                />
                <label htmlFor="announcementActiveCheckbox" className="text-xs font-bold text-text-primary cursor-pointer">
                  Activate Live Banner
                </label>
              </div>

              <Button type="submit" size="sm" className="w-full h-8 text-xs font-bold">
                Broadcast Announcement
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
