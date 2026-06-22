import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Shield, Lock, Smartphone, LogOut, Trash2 } from 'lucide-react';

export default function Settings() {
  const { user, updateUser, logout, deleteAccount } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateUser({ name, phone });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      if (confirm('Please confirm again. All your personal data will be erased.')) {
        await deleteAccount();
      }
    }
  };

  return (
    <AppLayout title="Account Settings">
      <div className="mx-auto max-w-3xl space-y-6 animate-fadeIn">
        <div className="card">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-glass-border)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange/10 text-orange-dark">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy text-lg">Profile Information</h3>
              <p className="text-sm text-muted">Update your personal details and contact info.</p>
            </div>
          </div>
          
          <div className="space-y-5 max-w-xl">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">Email Address</label>
              <input type="email" value={user?.email || ''} disabled className="input-field bg-surface text-muted cursor-not-allowed" />
              <p className="mt-1.5 text-xs text-muted">Email address cannot be changed. Contact support if needed.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pl-10" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="pt-2">
              <button type="button" onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : saved ? 'Saved Successfully!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-glass-border)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy text-lg">Notification Preferences</h3>
              <p className="text-sm text-muted">Manage how and when you receive alerts.</p>
            </div>
          </div>
          <div className="space-y-4 max-w-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--color-glass-border)] text-orange focus:ring-orange" defaultChecked />
              <div>
                <p className="text-sm font-semibold text-navy">Daily Digest</p>
                <p className="text-xs text-muted">Receive a daily summary of all site activity at 6:00 PM.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--color-glass-border)] text-orange focus:ring-orange" defaultChecked />
              <div>
                <p className="text-sm font-semibold text-navy">Budget Alerts</p>
                <p className="text-xs text-muted">Get notified instantly when expenses exceed 80% of budget.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--color-glass-border)] text-orange focus:ring-orange" />
              <div>
                <p className="text-sm font-semibold text-navy">SMS Notifications</p>
                <p className="text-xs text-muted">Receive urgent alerts via SMS to your registered mobile number.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-glass-border)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 dark:bg-white/5 text-navy">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy text-lg">Security & Privacy</h3>
              <p className="text-sm text-muted">Manage your password and security settings.</p>
            </div>
          </div>
          <div className="space-y-4 max-w-xl">
            <div>
              <button className="btn-secondary text-sm">Change Password</button>
            </div>
            <div className="pt-4 border-t border-[var(--color-glass-border)]">
              <h4 className="text-sm font-semibold text-navy mb-2">Active Sessions</h4>
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-glass-border)] p-3 bg-surface">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-navy">Current Session (Windows, Chrome)</p>
                    <p className="text-xs text-muted">Last active: Just now</p>
                  </div>
                </div>
                <span className="badge bg-success/10 text-success">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-red-500/20">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-glass-border)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy text-lg">Account Actions</h3>
              <p className="text-sm text-muted">Log out or permanently delete your account.</p>
            </div>
          </div>
          <div className="space-y-4 max-w-xl">
            <div>
              <button onClick={logout} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
            <div className="pt-4 border-t border-[var(--color-glass-border)]">
              <p className="text-sm text-muted mb-3">Once you delete your account, there is no going back. Please be certain.</p>
              <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
