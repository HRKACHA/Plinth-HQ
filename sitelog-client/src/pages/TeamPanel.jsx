import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { inviteApi, teamApi, projectApi } from '../api/index.js';
import AppLayout from '../components/layout/AppLayout';
import { Users, Mail, Shield, Clock, CheckCircle, XCircle, Trash2, ChevronDown, Send, RefreshCw, UserMinus, Folder } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'site_engineer', label: 'Site Engineer', desc: 'Can view and submit logs', color: '#3B82F6' },
  { value: 'accounts', label: 'Accounts', desc: 'Can view budget and expenses', color: '#F59E0B' },
  { value: 'owner', label: 'Owner', desc: 'View-only executive access', color: '#8B5CF6' },
  { value: 'project_manager', label: 'Project Manager', desc: 'Full access', color: '#10B981' },
  { value: 'admin', label: 'Admin', desc: 'Full administrative access', color: '#EF4444' },
  { value: 'contractor', label: 'Contractor', desc: 'Execution and daily logging', color: '#F97316' },
];

const ROLE_COLORS = {
  site_engineer: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  accounts: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  owner: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  project_manager: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  admin: 'bg-red-500/15 text-red-400 border-red-500/30',
  contractor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  PM: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SuperAdmin: 'bg-red-500/15 text-red-400 border-red-500/30',
  Engineer: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Owner: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Accounts: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[role] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {role?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </span>
  );
}

function timeAgo(date) {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

import CustomSelectMenu from '../components/common/CustomSelectMenu';

export default function TeamPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'site_engineer', projectId: '' });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [roleDropdown, setRoleDropdown] = useState(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isManager = ['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(user?.role);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isManager) {
        const [m, i, p] = await Promise.all([teamApi.members(), inviteApi.list(), projectApi.list()]);
        setMembers(m);
        setInvites(i);
        setProjects(p.data || p); // projectApi.list returns paginated data sometimes, handle both
      } else {
        const [m, p] = await Promise.all([teamApi.members(), projectApi.list()]);
        setMembers(m);
        setInvites([]);
        setProjects(p.data || p);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.projectId) {
      showToast('Email and Project are required', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await inviteApi.send(inviteForm);
      showToast(res.message || `Invite sent to ${inviteForm.email}`);
      if (res.data?.inviteLink) {
        setGeneratedInviteLink(res.data.inviteLink);
      }
      setInviteForm({ email: '', role: 'site_engineer', projectId: inviteForm.projectId });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send invite', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await inviteApi.revoke(id);
      showToast('Invite revoked');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke', 'error');
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await teamApi.changeRole(memberId, newRole);
      showToast('Role updated');
      setRoleDropdown(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleDeactivate = async (memberId) => {
    if (!confirm('Deactivate this member? They will no longer be able to log in.')) return;
    try {
      await teamApi.deactivate(memberId);
      showToast('Member deactivated');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate', 'error');
    }
  };

  const handleDelete = async (memberId) => {
    if (!confirm('Permanently remove this member from your team? This action cannot be undone.')) return;
    try {
      await teamApi.deleteMember(memberId);
      showToast('Member completely removed');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  return (
    <AppLayout>
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium backdrop-blur-xl border animate-fadeIn ${toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400/30' : 'bg-emerald-500/90 text-white border-emerald-400/30'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
              <Users size={24} className="text-blue-400" />
            </div>
            Team Management
          </h1>
          <p className="text-muted mt-1 text-sm">Invite members, manage roles, and track your team.</p>
        </div>

        {/* Invite Form */}
        {isManager && (
          <div className="bg-card border border-white/[0.06] rounded-2xl p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail size={18} className="text-orange" /> Send Invitation
          </h2>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted mb-1">Email Address</label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                required
              />
            </div>
            <div className="min-w-[240px]">
              <label className="block text-xs text-muted mb-1">Assign Role</label>
              <CustomSelectMenu
                value={inviteForm.role}
                onChange={(val) => setInviteForm((f) => ({ ...f, role: val }))}
                options={ROLE_OPTIONS}
                placeholder="Select Role..."
                title="Available Roles"
              />
            </div>
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs text-muted mb-1">Project</label>
              <CustomSelectMenu
                value={inviteForm.projectId}
                onChange={(val) => setInviteForm((f) => ({ ...f, projectId: val }))}
                options={(Array.isArray(projects) ? projects : []).map(p => ({ value: p.id || p._id, label: p.name }))}
                placeholder="Select Project..."
                title="Your Projects"
                icon={Folder}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Send Invite
            </button>
          </form>

          {/* Generated Invite Link Alert */}
          {generatedInviteLink && (
            <div className="mt-4 p-4 rounded-xl bg-orange/10 border border-orange/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div>
                <h4 className="text-sm font-semibold text-orange mb-1">Invite Link Generated</h4>
                <p className="text-xs text-orange/80">
                  If your SMTP email service is not configured, you can manually share this link with the user.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5 w-full sm:w-auto">
                <code className="text-xs text-white px-2 truncate max-w-[200px] sm:max-w-[300px]">
                  {generatedInviteLink}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink);
                    showToast('Link copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-card border border-white/[0.06] rounded-xl p-1 w-fit">
          {[
            { key: 'members', label: 'Team Members', icon: Users, show: true },
            { key: 'invites', label: 'Pending Invites', icon: Mail, show: isManager },
          ].filter(t => t.show).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${tab === key ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
            >
              <Icon size={16} /> {label}
              {key === 'invites' && invites.filter((i) => !i.used).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange/20 text-orange rounded-full">
                  {invites.filter((i) => !i.used).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {tab === 'members' && (
          <div className="bg-card border border-white/[0.06] rounded-2xl pb-6">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Name', 'Email', 'Role', 'Project', 'Last Active', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted">Loading...</td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted">No team members found.</td></tr>
                  ) : members.map((m) => (
                    <tr key={m._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {m.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted text-sm">{m.email}</td>
                      <td className="px-6 py-4 relative">
                        {isManager && m._id !== user._id ? (
                          <button onClick={() => setRoleDropdown(roleDropdown === m._id ? null : m._id)} className="flex items-center gap-1 hover:bg-white/5 px-2 py-1 -ml-2 rounded transition">
                            <RoleBadge role={m.role} />
                            <ChevronDown size={12} className="text-muted" />
                          </button>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                        {roleDropdown === m._id && isManager && (
                          <div className="absolute z-50 mt-1 w-56 bg-card border border-white/10 rounded-xl shadow-2xl py-1 left-0">
                            {ROLE_OPTIONS.map((r) => (
                              <button
                                key={r.value}
                                onClick={() => handleChangeRole(m._id, r.value)}
                                className="w-full text-left px-4 py-2 hover:bg-white/5 transition flex flex-col items-start gap-0.5"
                              >
                                <span className="text-sm font-semibold text-white">{r.label}</span>
                                <span className="text-xs text-muted leading-tight">{r.desc}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white text-sm font-medium">
                        {m.projects && m.projects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.projects.map(p => (
                              <span key={p.id} className="px-2 py-1 text-[10px] bg-white/[0.08] border border-white/[0.1] rounded text-gray-200">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted text-sm">
                        <span className="flex items-center gap-1"><Clock size={14} /> {timeAgo(m.lastSeen || m.lastLogin)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {m.isActive ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isManager && m._id !== user._id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeactivate(m._id)}
                              className="p-1.5 rounded-lg text-muted hover:text-amber-400 hover:bg-amber-500/10 transition"
                              title="Deactivate"
                            >
                              <UserMinus size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(m._id)}
                              className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Delete Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden p-3 space-y-3">
              {loading ? (
                <div className="text-center py-12 text-muted">Loading...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-muted">No team members found.</div>
              ) : members.map((m) => (
                <div key={m._id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {m.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                        <p className="text-xs text-muted truncate">{m.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${m.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.isActive ? <><CheckCircle size={10} /> Active</> : <><XCircle size={10} /> Off</>}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                    <RoleBadge role={m.role} />
                    {m.projects && m.projects.length > 0 && m.projects.map(p => (
                      <span key={p.id} className="px-2 py-0.5 text-[10px] bg-white/[0.08] border border-white/[0.1] rounded text-gray-200">
                        {p.name}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted flex items-center gap-1 ml-auto">
                      <Clock size={10} /> {timeAgo(m.lastSeen || m.lastLogin)}
                    </span>
                  </div>
                  {isManager && m._id !== user._id && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04]">
                      <button onClick={() => setRoleDropdown(roleDropdown === m._id ? null : m._id)} className="text-xs text-muted hover:text-white transition flex items-center gap-1">
                        Change Role <ChevronDown size={10} />
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => handleDeactivate(m._id)} className="p-1.5 rounded-lg text-muted hover:text-amber-400 hover:bg-amber-500/10 transition" title="Deactivate">
                        <UserMinus size={14} />
                      </button>
                      <button onClick={() => handleDelete(m._id)} className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition" title="Delete Member">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {roleDropdown === m._id && isManager && (
                    <div className="mt-2 bg-card border border-white/10 rounded-xl shadow-2xl py-1">
                      {ROLE_OPTIONS.map((r) => (
                        <button key={r.value} onClick={() => handleChangeRole(m._id, r.value)} className="w-full text-left px-4 py-2 hover:bg-white/5 transition flex flex-col items-start gap-0.5">
                          <span className="text-sm font-semibold text-white">{r.label}</span>
                          <span className="text-xs text-muted leading-tight">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invites Tab */}
        {tab === 'invites' && (
          <div className="bg-card border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Email', 'Role', 'Sent', 'Expires', 'Status', 'Action'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted">Loading...</td></tr>
                  ) : invites.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted">No invites sent yet.</td></tr>
                  ) : invites.map((inv) => (
                    <tr key={inv._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 text-white text-sm">{inv.email}</td>
                      <td className="px-6 py-4"><RoleBadge role={inv.role} /></td>
                      <td className="px-6 py-4 text-muted text-sm">{timeAgo(inv.createdAt)}</td>
                      <td className="px-6 py-4 text-muted text-sm">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {inv.used ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <CheckCircle size={12} /> Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!inv.used && (
                          <button
                            onClick={() => handleRevoke(inv._id)}
                            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Revoke"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </AppLayout>
  );
}
