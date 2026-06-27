import { Link } from 'react-router-dom';
import { Bell, Check, CheckCircle2, Clock, Info, ShieldAlert } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAsync } from '../hooks/useAsync';
import { notificationApi } from '../api/index';
import { useState } from 'react';

export default function NotificationsPage() {
  const { data: initialNotifications, loading, refresh } = useAsync(() => notificationApi.list(), []);
  const [marking, setMarking] = useState(false);

  if (loading) return <AppLayout title="Notifications"><div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy/20 border-t-orange" /></div></AppLayout>;

  const notifications = initialNotifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    if (unreadCount === 0 || marking) return;
    setMarking(true);
    try {
      await notificationApi.markAllRead();
      refresh();
    } finally {
      setMarking(false);
    }
  };

  const markRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationApi.markRead(id);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'budgetAlert': return <ShieldAlert className="h-5 w-5 text-danger" />;
      case 'newLog': return <CheckCircle2 className="h-5 w-5 text-success" />;
      default: return <Info className="h-5 w-5 text-orange" />;
    }
  };

  return (
    <AppLayout title="Notifications">
      <div className="mx-auto max-w-4xl animate-fadeIn">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-navy" />
            <h2 className="text-xl font-bold text-navy">Your Notifications</h2>
            {unreadCount > 0 && (
              <span className="badge bg-danger text-white ml-2">{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={marking} className="btn-secondary text-sm">
              <Check className="h-4 w-4" /> Mark all as read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-[var(--color-glass-border)]">
              {notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`flex items-start gap-4 p-5 transition-colors ${!n.isRead ? 'bg-orange/5' : 'hover:bg-surface/50'}`}
                  onClick={() => markRead(n._id, n.isRead)}
                >
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${!n.isRead ? 'bg-card shadow-sm' : 'bg-surface'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={n.link || '#'} className={`text-sm font-semibold block truncate hover:text-orange transition ${!n.isRead ? 'text-navy' : 'text-navy/80'}`}>
                        {n.title}
                      </Link>
                      <span className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                        <Clock className="h-3 w-3" /> {n.time}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${!n.isRead ? 'text-navy/90' : 'text-muted'}`}>{n.body}</p>
                  </div>
                  {!n.isRead && (
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange self-center" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-glass-border)] bg-card p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy/5 dark:bg-white/5">
              <Bell className="h-8 w-8 text-muted/40" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-orange">All caught up!</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">You don't have any notifications at the moment. We'll let you know when something needs your attention.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
