import React, { useState } from 'react';
import {
  Clock,
  PlayCircle,
  RotateCw,
  XCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Filter,
} from 'lucide-react';
import { PublishingJob, Platform } from '../types/index.ts';
import {
  toBengaliNumber,
  formatDhakaDate,
  formatRelativeDhaka,
  platformNames,
  statusLabels,
} from '../utils/bengaliHelpers.ts';

interface PublishingQueueViewProps {
  jobs: PublishingJob[];
  onPublishNow: (jobId: string) => Promise<void>;
  onRetry: (jobId: string) => Promise<void>;
  onCancel: (jobId: string) => Promise<void>;
}

export const PublishingQueueView: React.FC<PublishingQueueViewProps> = ({
  jobs,
  onPublishNow,
  onRetry,
  onCancel,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  const filteredJobs = jobs.filter(j => {
    const matchesPlatform = platformFilter === 'all' || j.platform === platformFilter;
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesPlatform && matchesStatus;
  });

  const handleAction = async (action: () => Promise<void>, jobId: string) => {
    setProcessingJobId(jobId);
    try {
      await action();
    } finally {
      setProcessingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">পাবলিশিং কিউ (Publishing Queue)</h2>
          <p className="text-xs text-zinc-400">
            স্বাধীন প্ল্যাটফর্মভিত্তিক শিডিউলিং, তাৎক্ষণিক প্রকাশনা ও ব্যাকগ্রাউন্ড ট্র্যাকিং
          </p>
        </div>

        {/* Platform Filters */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              platformFilter === 'all' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            সকল প্ল্যাটফর্ম
          </button>
          <button
            onClick={() => setPlatformFilter('facebook')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              platformFilter === 'facebook' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Facebook
          </button>
          <button
            onClick={() => setPlatformFilter('instagram')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              platformFilter === 'instagram' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Instagram
          </button>
          <button
            onClick={() => setPlatformFilter('youtube')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              platformFilter === 'youtube' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            YouTube
          </button>
        </div>
      </div>

      {/* Status Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'scheduled', 'publishing', 'published', 'retrying', 'failed'].map(st => {
          const isActive = statusFilter === st;
          const label = st === 'all' ? 'সকল স্ট্যাটাস' : statusLabels[st as keyof typeof statusLabels]?.text || st;
          const count = st === 'all' ? jobs.length : jobs.filter(j => j.status === st).length;

          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition border ${
                isActive
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span>{label}</span>
              <span className="rounded-md bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300">
                {toBengaliNumber(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Jobs Table / List */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Clock className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">কিউতে কোনো জব নেই</h3>
          <p className="text-xs text-zinc-500 mt-1">নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো প্রকাশনা জব নেই।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map(job => {
            const pInfo = platformNames[job.platform];
            const sInfo = statusLabels[job.status] || statusLabels.scheduled;
            const isProcessing = processingJobId === job.id;

            return (
              <div
                key={job.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Platform badge & Video Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className={`rounded-xl px-3 py-2 text-xs font-bold shrink-0 ${pInfo.bg} ${pInfo.iconColor}`}>
                    {pInfo.name}
                  </span>

                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-bold text-zinc-100 truncate">{job.video_title}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span>শিডিউল: {formatDhakaDate(job.scheduled_at)}</span>
                        <span className="text-zinc-500">({formatRelativeDhaka(job.scheduled_at)})</span>
                      </span>

                      {job.published_at && (
                        <span className="text-emerald-400">
                          প্রকাশিত: {formatDhakaDate(job.published_at)}
                        </span>
                      )}

                      {job.attempts > 0 && (
                        <span className="text-zinc-500">
                          চেষ্টা: {toBengaliNumber(job.attempts)} / {toBengaliNumber(job.max_attempts || 3)}
                        </span>
                      )}
                    </div>

                    {job.last_error && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>ত্রুটি: {job.last_error}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status badge & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${sInfo.bg} ${sInfo.textCol} border border-white/5`}>
                    {sInfo.text}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Live link if published */}
                    {job.result_post_url && (
                      <a
                        href={job.result_post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>পোস্ট দেখুন</span>
                      </a>
                    )}

                    {/* Publish Now Button (for scheduled/failed/retrying) */}
                    {job.status !== 'published' && job.status !== 'publishing' && (
                      <button
                        onClick={() => handleAction(() => onPublishNow(job.id), job.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 active:scale-95 transition disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>এখনই পাবলিশ</span>
                      </button>
                    )}

                    {/* Retry Button if failed or retrying */}
                    {(job.status === 'failed' || job.status === 'retrying') && (
                      <button
                        onClick={() => handleAction(() => onRetry(job.id), job.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 active:scale-95 transition disabled:opacity-50"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>পুনঃচেষ্টা</span>
                      </button>
                    )}

                    {/* Cancel Button */}
                    {job.status === 'scheduled' && (
                      <button
                        onClick={() => handleAction(() => onCancel(job.id), job.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>বাতিল</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
