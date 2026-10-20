import React, { useState } from 'react';
import {
  ScrollText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AutomationLog } from '../types/index.ts';
import { formatDhakaDate, formatRelativeDhaka, toBengaliNumber } from '../utils/bengaliHelpers.ts';

interface ActivityLogsViewProps {
  logs: AutomationLog[];
  onRefresh: () => void;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({ logs, onRefresh }) => {
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesModule && matchesLevel;
  });

  const getLevelBadge = (level: AutomationLog['level']) => {
    switch (level) {
      case 'success':
        return (
          <span className="flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>সফল</span>
          </span>
        );
      case 'warn':
        return (
          <span className="flex items-center gap-1 rounded bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[10px] font-bold border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span>সতর্কতা</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 px-2 py-0.5 text-[10px] font-bold border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            <span>ত্রুটি</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded bg-blue-500/10 text-blue-400 px-2 py-0.5 text-[10px] font-bold border border-blue-500/20">
            <Info className="h-3 w-3" />
            <span>তথ্য</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">কার্যক্রমের অডিট লগ</h2>
          <p className="text-xs text-zinc-400">
            টেলিগ্রাম ওয়েবহুক, এআই পার্সার, ব্যাকগ্রাউন্ড শিডিউলার ও সোশ্যাল মিডিয়া এপিআই ইভেন্ট হিস্ট্রি
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>লগ রিফ্রেশ</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
          <span className="text-zinc-500 px-2">মডিউল:</span>
          {['all', 'telegram', 'gemini', 'scheduler', 'facebook', 'instagram', 'youtube'].map(m => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`rounded-lg px-2.5 py-1 capitalize transition ${
                moduleFilter === m ? 'bg-violet-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {m === 'all' ? 'সকল' : m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
          <span className="text-zinc-500 px-2">লেভেল:</span>
          {['all', 'info', 'warn', 'error', 'success'].map(l => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`rounded-lg px-2.5 py-1 capitalize transition ${
                levelFilter === l ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {l === 'all' ? 'সকল' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">কোনো লগ ইভেন্ট নেই</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-zinc-850/40 transition space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getLevelBadge(log.level)}
                    <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-300 uppercase">
                      {log.module}
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-400">
                      {log.event_type}
                    </span>
                  </div>

                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-600" />
                    <span>{formatDhakaDate(log.timestamp)}</span>
                    <span>({formatRelativeDhaka(log.timestamp)})</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed pl-1">{log.message}</p>

                {log.details && Object.keys(log.details).length > 0 && (
                  <pre className="mt-1 rounded-lg bg-zinc-950 p-2 text-[10px] font-mono text-zinc-400 overflow-x-auto border border-zinc-850">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
