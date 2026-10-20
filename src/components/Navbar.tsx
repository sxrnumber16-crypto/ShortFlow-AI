import React, { useEffect, useState } from 'react';
import {
  Bell,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
  Server,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliHelpers.ts';
import { AppNotification } from '../types/index.ts';

interface NavbarProps {
  onOpenSimulate: () => void;
  onNavigateToNotifications: () => void;
  notifications: AppNotification[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSimulate,
  onNavigateToNotifications,
  notifications,
  onRefresh,
  isRefreshing,
}) => {
  const [dhakaTime, setDhakaTime] = useState('');
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDhakaTime(
        now.toLocaleTimeString('bn-BD', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 shadow-md shadow-indigo-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">ShortFlow AI</h1>
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400 border border-violet-500/30">
              অটোনোমাস v2.4
            </span>
          </div>
          <p className="text-xs text-zinc-400 hidden sm:block">
            Muse AI টেলিগ্রাম বট থেকে স্বয়ংক্রিয় প্রকাশনা ইঞ্জিন
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dhaka Time Clock */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-zinc-500">ঢাকা সময়:</span>
          <span className="font-mono font-medium text-zinc-200">{dhakaTime || 'লোড হচ্ছে...'}</span>
        </div>

        {/* Server Background Status */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Server className="h-3 w-3 ml-0.5" />
          <span>ক্লাউড অটোমেশন সক্রিয়</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="তথ্য রিফ্রেশ করুন"
          title="ডাটা রিফ্রেশ করুন"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-violet-400' : ''}`} />
        </button>

        {/* Notification bell */}
        <button
          onClick={onNavigateToNotifications}
          aria-label="নোটিফিকেশন দেখুন"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
              {toBengaliNumber(unreadCount)}
            </span>
          )}
        </button>

        {/* Ingest / Test Simulator Trigger */}
        <button
          onClick={onOpenSimulate}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">ইনজেস্ট সিমুলেটর</span>
          <span className="sm:hidden">ইনজেস্ট</span>
        </button>
      </div>
    </header>
  );
};
