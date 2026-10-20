import React from 'react';
import {
  LayoutDashboard,
  Video,
  ListOrdered,
  CalendarDays,
  Share2,
  Sparkles,
  ScrollText,
  Bell,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliHelpers.ts';

export type ActiveTab =
  | 'dashboard'
  | 'library'
  | 'queue'
  | 'calendar'
  | 'accounts'
  | 'parser'
  | 'logs'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  needsReviewCount: number;
  unreadNotifsCount: number;
  queuedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  needsReviewCount,
  unreadNotifsCount,
  queuedCount,
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    {
      id: 'library',
      label: 'ভিডিও লাইব্রেরি',
      icon: Video,
      badge: needsReviewCount > 0 ? `${toBengaliNumber(needsReviewCount)} রিভিউ` : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    {
      id: 'queue',
      label: 'পাবলিশিং কিউ',
      icon: ListOrdered,
      badge: queuedCount > 0 ? toBengaliNumber(queuedCount) : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: CalendarDays },
    { id: 'accounts', label: 'সোশ্যাল অ্যাকাউন্ট', icon: Share2 },
    { id: 'parser', label: 'AI কনটেন্ট পার্সার', icon: Sparkles },
    { id: 'logs', label: 'কার্যক্রমের লগ', icon: ScrollText },
    {
      id: 'notifications',
      label: 'নোটিফিকেশন',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? toBengaliNumber(unreadNotifsCount) : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    { id: 'settings', label: 'সেটিংস', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 hidden md:flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            প্রধান মেনু
          </span>
          <nav className="mt-2 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition group ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 transition ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${item.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="h-3.5 w-3.5 text-violet-400" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Cloud Automation Info Widget */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="font-semibold text-zinc-300">অটোনোমাস ক্লাউড</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          ওয়েবসাইট বা কম্পিউটার বন্ধ থাকলেও ক্লাউড ব্যাকগ্রাউন্ডে ভিডিও শিডিউলিং ও প্রকাশনা চলতে থাকবে।
        </p>
      </div>
    </aside>
  );
};
