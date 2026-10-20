import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  Sliders,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { AppSettings } from '../types/index.ts';
import { api } from '../services/api.ts';
import { toBengaliNumber } from '../utils/bengaliHelpers.ts';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => Promise<void>;
  onResetAllData?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onResetAllData }) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [fbSlotsStr, setFbSlotsStr] = useState(settings.publishing_slots.facebook.join(', '));
  const [igSlotsStr, setIgSlotsStr] = useState(settings.publishing_slots.instagram.join(', '));
  const [ytSlotsStr, setYtSlotsStr] = useState(settings.publishing_slots.youtube.join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [tgRegistrationMessage, setTgRegistrationMessage] = useState<string | null>(null);
  const [isRegisteringTg, setIsRegisteringTg] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const webhookUrl = `${window.location.origin}/api/telegram/webhook`;

  const handleResetAllData = async () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সকল ভিডিও, শিডিউল্ড জব ও হিস্ট্রি মুছে ফেলবেন?')) {
      setIsClearing(true);
      try {
        if (onResetAllData) {
          await onResetAllData();
        } else {
          await api.clearAllData();
        }
        alert('সমস্ত ডেটা সফলভাবে রিসেট করা হয়েছে।');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const parsedFbSlots = fbSlotsStr.split(',').map(s => s.trim()).filter(Boolean);
      const parsedIgSlots = igSlotsStr.split(',').map(s => s.trim()).filter(Boolean);
      const parsedYtSlots = ytSlotsStr.split(',').map(s => s.trim()).filter(Boolean);

      const payload: Partial<AppSettings> = {
        ...formData,
        publishing_slots: {
          facebook: parsedFbSlots,
          instagram: parsedIgSlots,
          youtube: parsedYtSlots,
        },
      };

      await onSave(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleRegisterTelegramWebhook = async () => {
    if (!formData.telegram_bot_token) {
      alert('অনুগ্রহ করে প্রথমে Telegram Bot Token প্রদান করুন');
      return;
    }
    setIsRegisteringTg(true);
    setTgRegistrationMessage(null);
    try {
      const res = await api.registerWebhook(
        formData.telegram_bot_token,
        webhookUrl,
        formData.telegram_webhook_secret
      );
      setTgRegistrationMessage('✅ Telegram ওয়েবহুক সফলভাবে রেজিস্টার ও সংযুক্ত হয়েছে!');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTgRegistrationMessage(`❌ ওয়েবহুক রেজিস্ট্রেশন ত্রুটি: ${errMsg}`);
    } finally {
      setIsRegisteringTg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">সিস্টেম কনফিগারেশন ও সেটিংস</h2>
        <p className="text-xs text-zinc-400 mt-1">
          টাইমজোন, স্বয়ংক্রিয় পাবলিশিং স্লট, এআই আত্মবিশ্বাস থ্রেশহোল্ড এবং টেলিগ্রাম সংযোগ
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* 1. Timezone & Scheduling Slots */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Clock className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">টাইমজোন ও দৈনিক প্রকাশনা স্লট</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300">ডিফল্ট টাইমজোন</label>
              <input
                type="text"
                disabled
                value={formData.timezone}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                বাংলাদেশের স্থানীয় সময় (UTC+6) অনুযায়ী স্বয়ংক্রিয়ভাবে স্লট গণনা হয়।
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">ম্যাচিং উইন্ডো (মিনিট)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={formData.matching_window_minutes}
                onChange={e =>
                  setFormData({ ...formData, matching_window_minutes: parseInt(e.target.value, 10) || 30 })
                }
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                ভিডিও ও পৃথক মেটাডাটা বার্তার মধ্যে সংযোগ খোঁজার সর্বোচ্চ সময়সীমা।
              </span>
            </div>
          </div>

          {/* Daily Slots per Platform */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-zinc-300">
                Facebook Reels দৈনিক স্লট (কমা দিয়ে পৃথক করুন, যেমন 14:00, 19:00, 22:00)
              </label>
              <input
                type="text"
                value={fbSlotsStr}
                onChange={e => setFbSlotsStr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">
                Instagram Reels দৈনিক স্লট (যেমন 13:30, 18:30, 21:30)
              </label>
              <input
                type="text"
                value={igSlotsStr}
                onChange={e => setIgSlotsStr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">
                YouTube Shorts দৈনিক স্লট (যেমন 15:00, 20:00, 23:00)
              </label>
              <input
                type="text"
                value={ytSlotsStr}
                onChange={e => setYtSlotsStr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. AI & Quality Assurance */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">এআই অটোমেশন ও রিট্রাই কন্ট্রোল</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  স্বয়ংক্রিয় পাবলিশিং আত্মবিশ্বাস থ্রেশহোল্ড: {toBengaliNumber(formData.auto_publish_min_confidence)}%
                </label>
              </div>
              <input
                type="range"
                min="50"
                max="98"
                step="1"
                value={formData.auto_publish_min_confidence}
                onChange={e =>
                  setFormData({ ...formData, auto_publish_min_confidence: parseInt(e.target.value, 10) })
                }
                className="mt-2 w-full accent-violet-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                এই স্কোরের নিচে থাকলে ভিডিও স্বয়ংক্রিয়ভাবে পাবলিশ না হয়ে "ম্যানুয়াল রিভিউ" তালিকায় জমা হবে।
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">সর্বোচ্চ পুনঃচেষ্টা (Max Retries)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.max_retries}
                onChange={e => setFormData({ ...formData, max_retries: parseInt(e.target.value, 10) || 3 })}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                নেটওয়ার্ক বা প্ল্যাটফর্ম সাময়িক বিভ্রাটে এক্সপোনেনশিয়াল ব্যাকঅফ সহ পুনঃচেষ্টা হবে।
              </span>
            </div>
          </div>
        </div>

        {/* 3. Telegram Webhook Helper */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Send className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Telegram Webhook সহকারী</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300">ওয়েবহুক URL (Public EndPoint)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300"
                />
                <button
                  type="button"
                  onClick={copyWebhook}
                  className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
                >
                  {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedWebhook ? 'কপি!' : 'কপি'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">Webhook Secret Token</label>
              <input
                type="text"
                value={formData.telegram_webhook_secret || ''}
                onChange={e => setFormData({ ...formData, telegram_webhook_secret: e.target.value })}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRegisterTelegramWebhook}
                disabled={isRegisteringTg}
                className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition active:scale-95 disabled:opacity-50"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRegisteringTg ? 'animate-spin' : ''}`} />
                <span>{isRegisteringTg ? 'রেজিস্ট্রেশন চলছে...' : 'Telegram এ ওয়েবহুক অটো-সেট করুন'}</span>
              </button>
            </div>

            {tgRegistrationMessage && (
              <p className="text-xs mt-2 font-medium">{tgRegistrationMessage}</p>
            )}
          </div>
        </div>

        {/* 4. Data Management */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3">
            <Trash2 className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">ডেটা ব্যবস্থাপনা ও রিসেট</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-zinc-200">সমস্ত ডেমো ও পরীক্ষামূলক ডেটা রিসেট</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                ভিডিও লাইব্রেরি, শিডিউল্ড জব, নোটিফিকেশন ও কার্যক্রমের লগ সম্পূর্ণ শূন্য করুন।
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetAllData}
              disabled={isClearing}
              className="flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isClearing ? 'রিসেট হচ্ছে...' : 'সকল ডেটা রিসেট করুন'}</span>
            </button>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
            </span>
          )}
          {!savedSuccess && <span></span>}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 active:scale-95 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
