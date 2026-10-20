import React from 'react';
import {
  Video,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Play,
  Flame,
  Zap,
} from 'lucide-react';
import {
  VideoItem,
  PublishingJob,
  SocialAccount,
  AutomationLog,
} from '../types/index.ts';
import {
  toBengaliNumber,
  formatDhakaDate,
  formatRelativeDhaka,
  platformNames,
  statusLabels,
} from '../utils/bengaliHelpers.ts';

interface DashboardViewProps {
  videos: VideoItem[];
  jobs: PublishingJob[];
  accounts: SocialAccount[];
  logs: AutomationLog[];
  onNavigate: (tab: string) => void;
  onSelectVideo: (video: VideoItem) => void;
  onOpenSimulate: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  videos,
  jobs,
  accounts,
  logs,
  onNavigate,
  onSelectVideo,
  onOpenSimulate,
}) => {
  const totalVideos = videos.length;
  const needsReview = videos.filter(v => v.status === 'needs_review').length;
  const scheduledJobs = jobs.filter(j => j.status === 'scheduled');
  const publishedJobs = jobs.filter(j => j.status === 'published');
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const retryingJobs = jobs.filter(j => j.status === 'retrying');

  const upcomingJobs = [...scheduledJobs]
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4);

  const recentVideos = [...videos].slice(0, 3);
  const recentLogs = [...logs].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-zinc-900/60 to-zinc-950 p-6 md:p-8 backdrop-blur shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              <span>স্বয়ংক্রিয় এআই পাইপলাইন সক্রিয়</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              স্বাগতম, ShortFlow AI ড্যাশবোর্ডে
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Muse AI টেলিগ্রাম বট থেকে আসা সমাপ্ত Shorts ভিডিও সরাসরি গ্রহণ, জেমিনাই এআই দ্বারা মেটাডাটা
              পার্সিং এবং এশিয়া/ঢাকা টাইমজোন স্লট অনুযায়ী Facebook, Instagram ও YouTube-এ স্বয়ংক্রিয় প্রকাশনা
              প্রস্তুত।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSimulate}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 active:scale-95 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>টেস্ট ভিডিও ইনজেস্ট করুন</span>
            </button>
            <button
              onClick={() => onNavigate('queue')}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 active:scale-95 transition"
            >
              <span>পাবলিশিং কিউ দেখুন</span>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Videos */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">মোট ভিডিও</span>
            <Video className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{toBengaliNumber(totalVideos)}</p>
          <span className="text-[11px] text-zinc-500">টেলিগ্রাম থেকে সংগৃহীত</span>
        </div>

        {/* Needs Review */}
        <div
          onClick={() => onNavigate('library')}
          className="cursor-pointer rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 transition hover:border-orange-500/40"
        >
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-xs font-medium">পর্যালোচনা বাকি</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-300">{toBengaliNumber(needsReview)}</p>
          <span className="text-[11px] text-orange-400/70">ম্যানুয়াল রিভিউ দরকার</span>
        </div>

        {/* Scheduled */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 transition hover:border-purple-500/40">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-medium">শিডিউল্ড পোস্ট</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-300">{toBengaliNumber(scheduledJobs.length)}</p>
          <span className="text-[11px] text-purple-400/70">আগামী প্রকাশনা স্লট</span>
        </div>

        {/* Published */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition hover:border-emerald-500/40">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">প্রকাশিত হয়েছে</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{toBengaliNumber(publishedJobs.length)}</p>
          <span className="text-[11px] text-emerald-400/70">সোশ্যালে লাইভ</span>
        </div>

        {/* Failed / Retrying */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 transition hover:border-red-500/40">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-medium">ত্রুটি / পুনঃচেষ্টা</span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-300">
            {toBengaliNumber(failedJobs.length + retryingJobs.length)}
          </p>
          <span className="text-[11px] text-red-400/70">
            {retryingJobs.length > 0 ? `${toBengaliNumber(retryingJobs.length)}টি পুনঃচেষ্টা হচ্ছে` : 'লগ চেক করুন'}
          </span>
        </div>

        {/* Connected Accounts */}
        <div
          onClick={() => onNavigate('accounts')}
          className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">সোশ্যাল অ্যাকাউন্ট</span>
            <Share2 className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {toBengaliNumber(accounts.filter(a => a.status === 'connected').length)} / {toBengaliNumber(accounts.length)}
          </p>
          <span className="text-[11px] text-zinc-500">সংযুক্ত চ্যানেল</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Queue & Recent Videos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Publications Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">আসন্ন প্রকাশনা সময়সূচী (ঢাকা টাইম)</h3>
              </div>
              <button
                onClick={() => onNavigate('queue')}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 transition"
              >
                সব দেখুন →
              </button>
            </div>

            {upcomingJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <Clock className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-400">বর্তমানে কোনো শিডিউল্ড জব নেই</p>
                <p className="text-[11px] text-zinc-600 mt-1">Muse AI থেকে নতুন ভিডিও আসলে স্বয়ংক্রিয়ভাবে স্লট নির্ধারিত হবে</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {upcomingJobs.map(job => {
                  const pInfo = platformNames[job.platform];
                  return (
                    <div key={job.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${pInfo.bg} ${pInfo.iconColor}`}>
                          {pInfo.name}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{job.video_title}</p>
                          <p className="text-[11px] text-zinc-500">
                            শিডিউল: {formatDhakaDate(job.scheduled_at)} ({formatRelativeDhaka(job.scheduled_at)})
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                          স্বয়ংক্রিয় শিডিউল
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Videos Received */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">সম্প্রতি সংগৃহীত Shorts ভিডিও</h3>
              </div>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 transition"
              >
                লাইব্রেরি দেখুন →
              </button>
            </div>

            {recentVideos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <Video className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-400">কোনো ভিডিও পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentVideos.map(video => {
                  const sInfo = statusLabels[video.status] || statusLabels.received;
                  return (
                    <div
                      key={video.id}
                      onClick={() => onSelectVideo(video)}
                      className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 hover:border-violet-500/40 hover:bg-zinc-800/80 transition"
                    >
                      <div className="relative aspect-[9/14] w-full rounded-lg overflow-hidden bg-zinc-950 mb-2.5">
                        <img
                          src={video.thumbnail_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'}
                          alt={video.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute top-2 right-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${sInfo.bg} ${sInfo.textCol} backdrop-blur`}>
                            {sInfo.text}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                            <Play className="h-3 w-3 text-white" />
                            <span>{toBengaliNumber(video.duration || 30)} সেকেন্ড</span>
                          </div>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-violet-300 transition">
                        {video.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        গৃহীত: {formatRelativeDhaka(video.received_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Connected Accounts & Activity Logs */}
        <div className="space-y-6">
          {/* Connected Accounts Status */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">সংযুক্ত অ্যাকাউন্ট</h3>
              </div>
              <button
                onClick={() => onNavigate('accounts')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition"
              >
                ব্যবস্থাপনা →
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.map(acc => {
                const isConnected = acc.status === 'connected';
                return (
                  <div
                    key={acc.platform}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{acc.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {acc.page_name || acc.channel_title || acc.bot_username || acc.account_name || 'কনফিগারেশন বাকি'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        isConnected
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isConnected ? 'সক্রিয়' : 'অসংযুক্ত'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Automation Logs */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">স্বয়ংক্রিয় কার্যক্রমের লগ</h3>
              <button
                onClick={() => onNavigate('logs')}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 transition"
              >
                সকল লগ →
              </button>
            </div>

            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="text-xs space-y-1 border-l-2 border-zinc-700 pl-3 py-0.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-400 uppercase tracking-wider">
                      {log.module} • {log.event_type}
                    </span>
                    <span>{formatRelativeDhaka(log.timestamp)}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
