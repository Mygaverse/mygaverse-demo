'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/scriptoplay/supabase/client';
import Button from '@/components/scriptoplay/ui/Button';
import Badge from '@/components/scriptoplay/ui/Badge';

type AccessStatus = 'waitlist' | 'approved' | 'trainer' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  access_status: AccessStatus;
  created_at: string;
}

interface WaitlistRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  purpose: string;
  message: string;
  status: string;
  created_at: string;
}

export default function UserManagementPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: waitlistData } = await supabase
        .from('waitlist_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) setProfiles(profilesData as UserProfile[]);
      if (waitlistData) setWaitlist(waitlistData as WaitlistRequest[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateStatus = async (id: string, status: AccessStatus) => {
    setActionLoading(id + status);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ access_status: status })
        .eq('id', id);
      if (error) throw error;
      setProfiles(prev => prev.map(u => u.id === id ? { ...u, access_status: status } : u));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadgeVariant = (s: AccessStatus) => {
    if (s === 'admin') return 'default';
    if (s === 'trainer') return 'warning';
    if (s === 'approved') return 'success';
    return 'neutral';
  };

  if (loading) return <div className="p-8 text-white">Loading users...</div>;

  return (
    <div className="p-8 w-full max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Manage user access and trainer promotions. Trainers can generate training data only.</p>
      </div>

      {/* SECTION 1: REGISTERED USERS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          Registered Users <span className="text-sm bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{profiles.length}</span>
        </h2>
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#1a1a1a] text-xs text-gray-400 uppercase">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {profiles.map((user) => (
                <tr key={user.id} className="border-b border-[#262626] hover:bg-[#1a1a1a]/50">
                  <td className="p-4 font-medium text-white">{user.display_name || 'No Name'}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <Badge variant={statusBadgeVariant(user.access_status)}>
                      {user.access_status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Approve from waitlist */}
                      {user.access_status === 'waitlist' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateStatus(user.id, 'approved')}
                          disabled={actionLoading === user.id + 'approved'}
                        >
                          Approve Access
                        </Button>
                      )}

                      {/* Promote approved → trainer */}
                      {user.access_status === 'approved' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateStatus(user.id, 'trainer')}
                          disabled={actionLoading === user.id + 'trainer'}
                        >
                          🎓 Promote to Trainer
                        </Button>
                      )}

                      {/* Revoke trainer → approved */}
                      {user.access_status === 'trainer' && (
                        <>
                          <span className="text-xs text-amber-400 font-medium">Trainer</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatus(user.id, 'approved')}
                            disabled={actionLoading === user.id + 'approved'}
                          >
                            Revoke Trainer
                          </Button>
                        </>
                      )}

                      {/* Admin — no actions */}
                      {user.access_status === 'admin' && (
                        <span className="text-xs text-gray-500 italic">Admin</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No registered users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: WAITLIST REQUESTS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          Waitlist Requests <span className="text-sm bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{waitlist.length}</span>
        </h2>
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#1a1a1a] text-xs text-gray-400 uppercase">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role / Purpose</th>
                <th className="p-4">Message</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {waitlist.map((req) => (
                <tr key={req.id} className="border-b border-[#262626] hover:bg-[#1a1a1a]/50">
                  <td className="p-4 font-medium text-white">
                    {req.name}
                    <div className="text-xs text-gray-500">{req.company}</div>
                  </td>
                  <td className="p-4 text-gray-400">{req.email}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase text-zinc-500">{req.role}</span>
                      <span className="text-xs text-zinc-400">{req.purpose}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-xs truncate" title={req.message}>
                    {req.message}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {waitlist.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No waitlist requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}