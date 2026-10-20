import React, { useState } from 'react';
import {
  Search,
  Filter,
  Play,
  Sparkles,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { VideoItem, JobStatus } from '../types/index.ts';
import {
  toBengaliNumber,
  formatDhakaDate,
  formatRelativeDhaka,
  statusLabels,
} from '../utils/bengaliHelpers.ts';

interface VideoLibraryViewProps {
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  onReparse: (video: VideoItem) => Promise<void>;
  onDelete: (video: VideoItem) => Promise<void>;
}

export const VideoLibraryView: React.FC<VideoLibraryViewProps> = ({
  videos,
  onSelectVideo,
  onReparse,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReparsingId, setIsReparsingId] = useState<string | null>(null);

  const filterTabs: { id: string; label: string }[] = [
    { id: 'all', label: 'সকল ভিডিও' },
    { id: 'needs_review', label: 'রিভিউ বাকি' },
    { id: 'scheduled', label: 'শিডিউল্ড' },
    { id: 'published', label: 'প্রকাশিত' },
    { id: 'failed', label: 'ব্যর্থ' },
  ];

  const filteredVideos = videos.filter(v => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.parsed_metadata?.youtube?.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReparseClick = async (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    setIsReparsingId(video.id);
    try {
      await onReparse(video);
    } finally {
      setIsReparsingId(null);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    if (window.confirm(`আপনি কি নিশ্চিত যে "${video.title}" ভিডিওটি লাইব্রেরি থেকে মুছতে চান?`)) {
      await onDelete(video);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">ভিডিও লাইব্রেরি</h2>
          <p className="text-xs text-zinc-400">
            টেলিগ্রাম থেকে সংগৃহীত এবং এআই দ্বারা প্রক্রিয়াকৃত সর্বমোট {toBengaliNumber(videos.length)}টি Shorts ভিডিও
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="ভিডিও বা মেটাডাটা খুঁজুন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9 w-60 rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map(tab => {
          const isActive = statusFilter === tab.id;
          const count =
            tab.id === 'all'
              ? videos.length
              : videos.filter(v => v.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-violet-600 text-white shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-md px-1.5 py-0.2 text-[10px] ${isActive ? 'bg-violet-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                {toBengaliNumber(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Video Cards Grid */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Filter className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">কোনো ভিডিও পাওয়া যায়নি</h3>
          <p className="text-xs text-zinc-500 mt-1">
            আপনার অনুসন্ধান বা নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো ভিডিও নেই।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map(video => {
            const sInfo = statusLabels[video.status] || statusLabels.received;
            const isReparsing = isReparsingId === video.id;
            const confidence = video.parsed_metadata?.confidence || 0;

            return (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="group cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-violet-500/50 hover:bg-zinc-800/50 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail area */}
                  <div className="relative aspect-[9/13] w-full rounded-xl overflow-hidden bg-zinc-950 mb-3 shadow-inner">
                    <img
                      src={video.thumbnail_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'}
                      alt={video.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>

                    {/* Top status & confidence */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${sInfo.bg} ${sInfo.textCol} backdrop-blur border border-white/5`}>
                        {sInfo.text}
                      </span>

                      {confidence > 0 && (
                        <span className="rounded-md bg-zinc-950/70 border border-zinc-700/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur">
                          AI: {toBengaliNumber(confidence)}%
                        </span>
                      )}
                    </div>

                    {/* Bottom metadata */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3 text-white" />
                          {toBengaliNumber(video.duration || 30)}s
                        </span>
                        <span>•</span>
                        <span>{video.resolution || '1080x1920'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & info */}
                  <h3 className="text-xs font-bold text-zinc-100 line-clamp-2 group-hover:text-violet-300 transition leading-snug">
                    {video.title}
                  </h3>

                  <p className="text-[11px] text-zinc-500 mt-1">
                    গৃহীত: {formatRelativeDhaka(video.received_at)}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectVideo(video);
                    }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>বিস্তারিত</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => handleReparseClick(e, video)}
                      disabled={isReparsing}
                      title="Gemini AI দিয়ে পুনরায় পার্স করুন"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-violet-600/20 hover:text-violet-300 transition"
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${isReparsing ? 'animate-spin text-violet-400' : ''}`} />
                    </button>

                    <button
                      onClick={e => handleDeleteClick(e, video)}
                      title="মুছে ফেলুন"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
