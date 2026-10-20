import React, { useState } from 'react';
import { X, Sparkles, Send, Video, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { VideoItem } from '../types/index.ts';

interface SimulateIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestComplete: (video: VideoItem) => void;
}

export const SimulateIngestModal: React.FC<SimulateIngestModalProps> = ({
  isOpen,
  onClose,
  onIngestComplete,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'steak' | 'chicken' | 'burger' | 'custom'>('steak');
  const [videoTitle, setVideoTitle] = useState('Juicy Tomahawk Steak with Honey-Chili Glaze');
  const [fbCaption, setFbCaption] = useState('This giant tomahawk steak just got a sweet honey-chili twist! Sizzling hot animation. 🔥🥩');
  const [fbHashtags, setFbHashtags] = useState('#animation #food #foodanimation #steak #shorts');
  const [ytTitle, setYtTitle] = useState('Juicy Tomahawk Steak with Honey-Chili Glaze 🔥');
  const [ytDescription, setYtDescription] = useState('Discover this delicious animated food creation with secret honey chili glaze! Watch it sizzle to perfection.');
  const [ytTags, setYtTags] = useState('tomahawk steak, honey chili glaze, food animation, steak shorts, asmr food');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: 'steak' | 'chicken' | 'burger' | 'custom') => {
    setSelectedPreset(preset);
    if (preset === 'steak') {
      setVideoTitle('Juicy Tomahawk Steak with Honey-Chili Glaze');
      setFbCaption('This giant tomahawk steak just got a sweet honey-chili twist! Sizzling hot animation. 🔥🥩');
      setFbHashtags('#animation #food #foodanimation #steak #shorts');
      setYtTitle('Juicy Tomahawk Steak with Honey-Chili Glaze 🔥');
      setYtDescription('Discover this delicious animated food creation with secret honey chili glaze! Watch it sizzle to perfection.');
      setYtTags('tomahawk steak, honey chili glaze, food animation, steak shorts, asmr food');
    } else if (preset === 'chicken') {
      setVideoTitle('Crispy Korean Fried Chicken Wings');
      setFbCaption('Golden crunchy wings coated in sticky sweet-spicy glaze! Listen to that crunch. 🔥🍗✨');
      setFbHashtags('#friedchicken #koreanfood #foodanimation #crunchyfood #shorts');
      setYtTitle('Crispy Korean Fried Chicken Wings with Sweet Garlic Glaze 🔥');
      setYtDescription('Experience the ultimate animated Korean fried chicken! Double-fried for maximum crunch and tossed in homemade sauce.');
      setYtTags('korean fried chicken, crispy chicken wings, garlic glaze, animated food, asmr cooking, viral shorts');
    } else if (preset === 'burger') {
      setVideoTitle('Triple Cheese Melt Smash Burger');
      setFbCaption('Layers of gooey cheddar cheese dripping over double beef patties! 🍔🧀🔥');
      setFbHashtags('#smashburger #cheeseburger #foodanimation #burgerlovers #shorts');
      setYtTitle('Triple Cheese Melt Smash Burger 🔥 Animated ASMR');
      setYtDescription('Watch this juicy triple cheese smash burger being assembled with melted cheddar and caramelized onions!');
      setYtTags('smash burger, triple cheese, animated burger, asmr food, food shorts, viral food');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('টেলিগ্রাম থেকে ভিডিও রিসিভ হচ্ছে এবং জেমিনাই এআই পার্স করছে...');

    try {
      const res = await api.simulateIngest({
        videoTitle,
        fbCaption,
        fbHashtags,
        ytTitle,
        ytDescription,
        ytTags,
      });

      setStatusMessage('সফল! ৩টি প্ল্যাটফর্মে শিডিউল তৈরি হয়েছে।');
      setTimeout(() => {
        onIngestComplete(res.video);
        onClose();
      }, 800);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`ত্রুটি: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Muse AI টেলিগ্রাম ইনজেস্ট সিমুলেটর</h3>
              <p className="text-[11px] text-zinc-400">
                টেলিগ্রাম থেকে নতুন ভিডিও ও মেটাডাটা বার্তা আসার সম্পূর্ণ অটোনোমাস প্রবাহ টেস্ট করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-850 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">নমুনা ভিডিও নির্বাচন করুন:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect('steak')}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                selectedPreset === 'steak'
                  ? 'border-violet-500 bg-violet-600/20 text-white font-bold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              🥩 টমাহক স্টেক
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('chicken')}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                selectedPreset === 'chicken'
                  ? 'border-violet-500 bg-violet-600/20 text-white font-bold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              🍗 ক্রিস্পি চিকেন
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('burger')}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${
                selectedPreset === 'burger'
                  ? 'border-violet-500 bg-violet-600/20 text-white font-bold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              🍔 স্ম্যাশ বার্গার
            </button>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-zinc-300">ভিডিও শিরোনাম</label>
            <input
              type="text"
              required
              value={videoTitle}
              onChange={e => setVideoTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-300">Facebook / Instagram ক্যাপশন</label>
            <textarea
              rows={2}
              required
              value={fbCaption}
              onChange={e => setFbCaption(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 focus:border-violet-500 focus:outline-none"
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

          <div>
            <label className="font-semibold text-zinc-300">YouTube SEO ট্যাগ (কমা দিয়ে পৃথক)</label>
            <input
              type="text"
              value={ytTags}
              onChange={e => setYtTags(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-zinc-200 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {statusMessage && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-violet-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 font-semibold text-zinc-400 hover:text-white"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50 transition active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'প্রসেস হচ্ছে...' : 'ভিডিও ইনজেস্ট করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
