import React from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Video,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AppNotification } from '../types/index.ts';
import { formatDhakaDate, formatRelativeDhaka, toBengaliNumber } from '../utils/bengaliHelpers.ts';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onSelectVideoById?: (videoId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectVideoById,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'failed':
      case 'account_expired':
        return <XCircle className="h-4 w-4 text-rose-400" />;
      case 'needs_review':
      case 'retry_warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'video_received':
        return <Video className="h-4 w-4 text-sky-400" />;
      default:
        return <Bell className="h-4 w-4 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">নোটিফিকেশন সেন্টার</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-xs font-bold text-rose-400">
                {toBengaliNumber(unreadCount)} অপঠিত
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            সিস্টেমের গুরুত্বপূর্ণ আপডেট, প্রকাশনা ফলাফল ও পর্যালোচনা নোটিস
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <CheckCheck className="h-4 w-4" />
            <span>সব পঠিত হিসেবে চিহ্নিত করুন</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">বর্তমানে কোনো নোটিফিকেশন নেই</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {notifications.map(item => (
              <div
                key={item.id}
                onClick={() => !item.read && onMarkRead(item.id)}
                className={`p-4 transition flex items-start justify-between gap-4 cursor-pointer ${
                  item.read ? 'hover:bg-zinc-850/30' : 'bg-violet-950/15 border-l-2 border-violet-500 hover:bg-violet-950/25'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0 rounded-lg bg-zinc-850 p-2 border border-zinc-750">
                    {getIcon(item.type)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-100">{item.title}</h4>
                      {!item.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{item.message}</p>
                    <p className="text-[10px] text-zinc-500 pt-0.5">
                      {formatDhakaDate(item.timestamp)} ({formatRelativeDhaka(item.timestamp)})
                    </p>
                  </div>
                </div>

                {item.action_url && (
                  <a
                    href={item.action_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300"
                  >
                    <span>দেখুন</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
