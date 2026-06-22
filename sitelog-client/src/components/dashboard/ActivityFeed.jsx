import { useEffect, useState } from 'react';
import { activityApi } from '../../api/index';
import { Clipboard, Receipt, UserPlus, Package, Wrench, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const data = await activityApi.feed();
        setActivities(data);
      } catch (err) {
        setError('Failed to load activity feed');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'daily_log': return <Clipboard className="h-4 w-4 text-blue-500" />;
      case 'expense': return <Receipt className="h-4 w-4 text-green-500" />;
      case 'new_member': return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'material': return <Package className="h-4 w-4 text-orange-500" />;
      case 'equipment': return <Wrench className="h-4 w-4 text-yellow-500" />;
      default: return <Clipboard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'daily_log': return 'bg-blue-500/10 border-blue-500/20';
      case 'expense': return 'bg-green-500/10 border-green-500/20';
      case 'new_member': return 'bg-purple-500/10 border-purple-500/20';
      case 'material': return 'bg-orange-500/10 border-orange-500/20';
      case 'equipment': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="card h-full flex flex-col">
        <h3 className="font-bold font-display text-navy border-b border-[var(--color-glass-border)] pb-4 mb-4">Recent Activity</h3>
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 relative">
              <div className="w-px h-full bg-navy/10 dark:bg-white/10 absolute left-[15px] top-8" />
              <div className="h-8 w-8 rounded-full skeleton shrink-0 z-10" />
              <div className="flex-1 pt-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card h-full">
        <h3 className="font-bold font-display text-navy border-b border-[var(--color-glass-border)] pb-4 mb-4">Recent Activity</h3>
        <div className="p-4 text-center text-sm text-danger bg-danger/10 rounded-xl border border-danger/20">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <h3 className="font-bold font-display text-navy border-b border-[var(--color-glass-border)] pb-4 mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted text-sm italic">
          No recent activity found.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6">
            {activities.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex gap-4 relative group">
                {/* Timeline Line */}
                {index !== activities.length - 1 && (
                  <div className="w-px h-[calc(100%+1.5rem)] bg-[var(--color-glass-border)] absolute left-[15px] top-8 -z-0" />
                )}
                
                {/* Icon */}
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 z-10 ${getBgColor(item.type)}`}>
                  {getIcon(item.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1 pb-1">
                  <p className="text-sm font-semibold text-navy">
                    {item.title} <span className="text-xs font-normal text-muted ml-1">• {item.projectName || item.user}</span>
                  </p>
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">{item.description}</p>
                  <p className="text-[10px] text-muted/60 mt-1 uppercase tracking-wider font-semibold">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
