import React, { useState } from 'react';
import {
  X,
  Play,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Share2,
  Trash2,
  Layers,
} from 'lucide-react';
import { VideoItem, ParsedMetadata, JobStatus } from '../types/index.ts';
import { toBengaliNumber, formatDhakaDate, statusLabels, platformNames } from '../utils/bengaliHelpers.ts';

interface VideoDetailModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, payload: { title?: string; status?: JobStatus; parsed_metadata?: ParsedMetadata }) => Promise<void>;
  onReparse: (video: VideoItem) => Promise<void>;
  onDelete: (video: VideoItem) => Promise<void>;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({
  video,
  isOpen,
  onClose,
  onSave,
  onReparse,
  onDelete,
}) => {
  if (!isOpen || !video) return null;

  const [activeTab, setActiveTab] = useState<'fb' | 'ig' | 'yt' | 'raw'>('fb');
  const [title, setTitle] = useState(video.title);
  const [status, setStatus] = useState<JobStatus>(video.status);

  // Metadata editable copies
  const meta = video.parsed_metadata || {
    video_title: video.title,
    facebook: { caption: '', hashtags: [] },
    instagram: { caption: '', hashtags: [] },
    youtube: { title: video.title, description: '', hashtags: [], tags: [] },
    language: 'bn',
    confidence: 80,
    needs_review: false,
    missing_fields: [],
  };

  const [fbCaption, setFbCaption] = useState(meta.facebook?.caption || '');
  const [fbHashtags, setFbHashtags] = useState((meta.facebook?.hashtags || []).join(' '));
  const [igCaption, setIgCaption] = useState(meta.instagram?.caption || '');
  const [igHashtags, setIgHashtags] = useState((meta.instagram?.hashtags || []).join(' '));
  const [ytTitle, setYtTitle] = useState(meta.youtube?.title || video.title);
  const [ytDescription, setYtDescription] = useState(meta.youtube?.description || '');
  const [ytHashtags, setYtHashtags] = useState((meta.youtube?.hashtags || []).join(' '));
  const [ytTags, setYtTags] = useState((meta.youtube?.tags || []).join(', '));

  const [isSaving, setIsSaving] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);

  const handleSave = async (approve = false) => {
    setIsSaving(true);
    try {
      const updatedMeta: ParsedMetadata = {
        ...meta,
        video_title: title,
        facebook: {
          caption: fbCaption,
          hashtags: fbHashtags.split(/\s+/).filter(Boolean),
        },
        instagram: {
          caption: igCaption || fbCaption,
          hashtags: igHashtags.split(/\s+/).filter(Boolean),
        },
        youtube: {
          title: ytTitle,
          description: ytDescription,
          hashtags: ytHashtags.split(/\s+/).filter(Boolean),
          tags: ytTags.split(',').map(t => t.trim()).filter(Boolean),
        },
        needs_review: approve ? false : status === 'needs_review',
      };

      const newStatus = approve ? 'scheduled' : status;
      await onSave(video.id, {
        title,
        status: newStatus,
        parsed_metadata: updatedMeta,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReparse = async () => {
    setIsReparsing(true);
    try {
      await onReparse(video);
      onClose();
    } finally {
      setIsReparsing(false);
    }
  };

  const sInfo = statusLabels[video.status] || statusLabels.received;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-6 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${sInfo.bg} ${sInfo.textCol}`}>
                {sInfo.text}
              </span>
              <span className="text-xs text-zinc-500">
                গৃহীত: {formatDhakaDate(video.received_at)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{video.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-850 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Left Video Player, Right Metadata Editor */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Video Player */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-[9/15] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-lg">
              <video
                src={video.file_url}
                controls
                poster={video.thumbnail_url}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="rounded-xl bg-zinc-900/60 p-3 text-xs space-y-1 text-zinc-400 border border-zinc-800/80">
              <div className="flex justify-between">
                <span>রেজোলিউশন:</span>
                <span className="text-zinc-200 font-mono">{video.resolution || '1080x1920'}</span>
              </div>
              <div className="flex justify-between">
                <span>সময়কাল:</span>
                <span className="text-zinc-200">{toBengaliNumber(video.duration || 30)} সেকেন্ড</span>
              </div>
              <div className="flex justify-between">
                <span>এআই আত্মবিশ্বাস:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {toBengaliNumber(meta.confidence || 0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Metadata Editor */}
          <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Platform Switcher Tabs */}
              <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('fb')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'fb' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ig')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'ig' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('yt')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'yt' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  YouTube SEO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'raw' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  মূল বার্তা
                </button>
              </div>

              {/* Form Tab 1: Facebook */}
              {activeTab === 'fb' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300">Facebook Reels ক্যাপশন</label>
                    <textarea
                      rows={5}
                      value={fbCaption}
                      onChange={e => setFbCaption(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-300">হ্যাশট্যাগ (Hashtags)</label>
                    <input
                      type="text"
                      value={fbHashtags}
                      onChange={e => setFbHashtags(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Tab 2: Instagram */}
              {activeTab === 'ig' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300">Instagram Reels ক্যাপশন</label>
                    <textarea
                      rows={5}
                      value={igCaption}
                      onChange={e => setIgCaption(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-300">হ্যাশট্যাগ (Hashtags)</label>
                    <input
                      type="text"
                      value={igHashtags}
                      onChange={e => setIgHashtags(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Tab 3: YouTube */}
              {activeTab === 'yt' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-300">YouTube Shorts শিরোনাম (সর্বোচ্চ ১০০ অক্ষর)</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={ytTitle}
                      onChange={e => setYtTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-300">বর্ণনা (Description)</label>
                    <textarea
                      rows={4}
                      value={ytDescription}
                      onChange={e => setYtDescription(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-300">SEO ট্যাগ (Tags, কমা দিয়ে পৃথক)</label>
                    <input
                      type="text"
                      value={ytTags}
                      onChange={e => setYtTags(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Tab 4: Raw Telegram Text */}
              {activeTab === 'raw' && (
                <div className="space-y-2 text-xs">
                  <span className="font-semibold text-zinc-300">টেলিগ্রাম থেকে প্রাপ্ত মূল টেক্সট বার্তা</span>
                  <pre className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {video.original_text || 'কোনো পৃথক টেক্সট বার্তা পাওয়া যায়নি।'}
                  </pre>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReparse}
                  disabled={isReparsing}
                  className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <Sparkles className={`h-3.5 w-3.5 text-violet-400 ${isReparsing ? 'animate-spin' : ''}`} />
                  <span>পুনরায় পার্স</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(video)}
                  className="flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>মুছুন</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {video.status === 'needs_review' && (
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>অনুমোদন ও শিডিউল করুন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 active:scale-95 transition"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
