import { useState, useEffect } from 'react';
import { Mail, Plus, Shield, ShieldAlert, ShieldCheck, MoreVertical, Search, CheckCircle2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
import { authApi } from '../api/index';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data: users, loading, reload } = useAsync(() => authApi.listUsers(), []);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Engineer');
  const [inviteName, setInviteName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const safeUsers = users || [];
  const filteredUsers = safeUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.inviteUser({ name: inviteName, email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Engineer');
      reload();
      alert('Team member added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'PM': return <ShieldAlert className="h-4 w-4 text-orange" />;
      case 'Owner': return <ShieldCheck className="h-4 w-4 text-success" />;
      default: return <Shield className="h-4 w-4 text-navy/80" />;
    }
  };

  if (loading) return <AppLayout title="Team Management"><div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" /></div></AppLayout>;

  return (
    <AppLayout title="Team Management">
      <div className="animate-fadeIn">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          {currentUser?.role === 'PM' && (
            <button onClick={() => setShowInviteModal(true)} className="btn-accent shrink-0">
              <Plus className="h-4 w-4" /> Add Member
            </button>
          )}
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface border-b border-[var(--color-glass-border)] text-xs uppercase text-muted">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Last Active</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="transition-colors hover:bg-surface/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 dark:bg-white/5 text-xs font-bold text-navy">
                          {u.avatar || u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-navy">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(u.role)}
                        <span className="font-medium">{u.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge bg-success/10 text-success">Active</span>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true
                      }) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted hover:text-navy transition p-1 rounded-md hover:bg-navy/5 dark:hover:bg-white/5">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted">
                      No team members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showInviteModal && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-md p-6">
              <div className="mb-5 flex items-center justify-between border-b border-[var(--color-glass-border)] pb-4">
                <h3 className="font-display text-xl font-bold text-navy">Invite Team Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-muted hover:text-navy">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>


                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Name</label>
                    <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="input-field" placeholder="e.g. Ramesh Patel" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="input-field pl-10" placeholder="colleague@company.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy">Role</label>
                    <CustomSelectMenu 
                      value={inviteRole} 
                      onChange={setInviteRole} 
                      options={[
                        {value: 'Engineer', label: 'Site Engineer', desc: 'Can view and submit logs'},
                        {value: 'Accounts', label: 'Accounts', desc: 'Can view budget and expenses'},
                        {value: 'Owner', label: 'Owner', desc: 'View-only executive access'},
                        {value: 'PM', label: 'Project Manager', desc: 'Full access'},
                        {value: 'contractor', label: 'Contractor', desc: 'Execution and daily logging'}
                      ]}
                      placeholder="Select Role"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-glass-border)]">
                    <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary">
                      {submitting ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
