import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, UserPlus, Shield, CheckCircle2, Clock, Copy, Check, RefreshCw } from 'lucide-react';

export default function UserManagement() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, iRes] = await Promise.all([
        api.users.list().catch(() => ({ users: [] })),
        api.users.getInvites().catch(() => ({ invitations: [] })),
      ]);
      setUsers(uRes?.users || []);
      setInvitations(iRes?.invitations || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.users.invite(inviteEmail, inviteRole, currentUser?.email);
      setFeedback({
        type: 'success',
        message: `Invitation generated for ${inviteEmail}! Token: ${res.invitation?.id}`,
      });
      setInviteEmail('');
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send invite' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="text-xs text-gray-500">Settings & Administration</div>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5 flex items-center gap-2">
            <Users size={20} className="text-coral" /> User Management & Team Access
          </h1>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="Refresh Users"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Invite Member Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-coral flex items-center justify-center">
            <UserPlus size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Invite New Team Member</h2>
            <p className="text-[11px] text-gray-500">
              Internal software team access. Users can set their password using the invitation token and login.
            </p>
          </div>
        </div>

        {feedback.message && (
          <div
            className={`p-3 rounded-lg text-xs mb-4 flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback({ type: '', message: '' })} className="font-bold ml-2">
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-coral focus:ring-1 focus:ring-coral"
            />
          </div>

          <div className="w-40">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-coral bg-white"
            >
              <option value="admin">Admin (Default)</option>
              <option value="super_admin">Super Admin</option>
              <option value="marketer">Marketer</option>
              <option value="reviewer">Reviewer</option>
              <option value="member">Team Member</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-coral text-xs py-2 px-4 whitespace-nowrap flex items-center gap-1.5"
          >
            <Mail size={13} /> {submitting ? 'Creating Invite...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Grid: Active Users & Pending Invites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Database Users Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              <span className="font-bold text-xs text-gray-800">Active Database Users ({users.length})</span>
            </div>
            <span className="text-[11px] text-gray-500">Live RDS User Table</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-[11px] bg-gray-50/30">
                  <th className="py-2.5 px-4 font-semibold">User</th>
                  <th className="py-2.5 px-4 font-semibold">Role</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Joined</th>
                  <th className="py-2.5 px-4 font-semibold">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">
                      {loading ? 'Loading users...' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSuper = u.is_superuser || u.role === 'super_admin';
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {u.first_name ? u.first_name[0] : (u.email ? u.email[0].toUpperCase() : 'U')}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                              </div>
                              <div className="text-[11px] text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              isSuper
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isSuper ? 'Super Admin' : u.role || 'Admin'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invitations Queue & Tokens (1 Col) */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-amber-500" />
              <span className="font-bold text-xs text-gray-800">Pending & Issued Invites</span>
            </div>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
              {invitations.length}
            </span>
          </div>

          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto p-2">
            {invitations.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No pending invitations. Invite someone using the form above!
              </div>
            ) : (
              invitations.map((inv) => (
                <div key={inv.id} className="p-3 hover:bg-gray-50 rounded-lg text-xs transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 truncate">{inv.email}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium ${
                        inv.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                    <span>Role: <strong className="text-gray-700">{inv.role}</strong></span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {inv.status === 'pending' && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between bg-gray-50 p-1.5 rounded">
                      <span className="font-mono text-[10px] text-gray-600 truncate max-w-[170px]" title={inv.id}>
                        Token: {inv.id}
                      </span>
                      <button
                        onClick={() => handleCopy(inv.id, inv.id)}
                        className="text-[10px] text-coral hover:underline flex items-center gap-0.5 font-medium ml-1"
                      >
                        {copiedId === inv.id ? (
                          <>
                            <Check size={11} className="text-emerald-600" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copy Token
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

