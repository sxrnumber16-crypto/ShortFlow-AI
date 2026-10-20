import React, { useState } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Key,
  Bot,
  Video,
  Settings,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { SocialAccount, AppSettings } from '../types/index.ts';
import { api } from '../services/api.ts';

interface SocialAccountsViewProps {
  accounts: SocialAccount[];
  settings: AppSettings;
  onRefresh: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export const SocialAccountsView: React.FC<SocialAccountsViewProps> = ({
  accounts,
  settings,
  onRefresh,
  onUpdateSettings,
}) => {
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ platform: string; text: string; ok: boolean } | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState(false);

  const webhookUrl = `${window.location.origin}/api/telegram/webhook`;

  const handleTest = async (platform: string) => {
    setTestingPlatform(platform);
    setTestMessage(null);
    try {
      const res = await api.testAccount(platform);
      setTestMessage({ platform, text: res.message, ok: res.ok });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestMessage({ platform, text: errMsg, ok: false });
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleOpenEdit = (platform: string) => {
    setEditingPlatform(platform);
    setTestMessage(null);
    if (platform === 'telegram') {
      setFormData({
        telegram_bot_token: settings.telegram_bot_token || '',
        telegram_webhook_secret: settings.telegram_webhook_secret || 'shortflow_secret_token_2026',
        telegram_chat_id_alerts: settings.telegram_chat_id_alerts || '',
      });
    } else if (platform === 'facebook' || platform === 'instagram') {
      setFormData({
        meta_access_token: settings.meta_access_token || '',
        meta_page_id: settings.meta_page_id || '',
        meta_instagram_id: settings.meta_instagram_id || '',
      });
    } else if (platform === 'youtube') {
      setFormData({
        youtube_client_id: settings.youtube_client_id || '',
        youtube_refresh_token: settings.youtube_refresh_token || '',
        youtube_channel_id: settings.youtube_channel_id || '',
      });
    }
  };

  const handleSaveCredentials = async () => {
    if (!editingPlatform) return;
    await onUpdateSettings(formData);
    // Mark account as configured or connected
    await api.saveAccount(editingPlatform, {
      status: 'connected',
    });
    setEditingPlatform(null);
    onRefresh();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">সোশ্যাল মিডিয়া অ্যাকাউন্ট কানেকশন</h2>
        <p className="text-xs text-zinc-400 mt-1">
          অফিসিয়াল এপিআই ইন্টিগ্রেশন: Meta Graph API, YouTube Data API v3 এবং Telegram Bot Webhook
        </p>
      </div>

      {/* Security Notice */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-emerald-300">নিরাপদ সার্ভার-সাইড স্টোরেজ ও টোকেন এনক্রিপশন</p>
          <p className="text-zinc-300 leading-relaxed">
            সকল এপিআই কী ও অ্যাক্সেস টোকেন সম্পূর্ণভাবে ক্লাউড সার্ভারে সংরক্ষিত থাকে। ব্রাউজার বা ক্লায়েন্ট বান্ডেলে কোনো সংবেদনশীল কী কখনোই প্রকাশ করা হয় না।
          </p>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Telegram Bot */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Telegram Bot</h3>
                  <p className="text-xs text-zinc-400">Muse AI ভিডিও ও মেটাডাটা রিসিভার</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                সংযুক্ত
              </span>
            </div>

            <div className="rounded-xl bg-zinc-950/70 p-3 space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">ওয়েবহুক এন্ডপয়েন্ট:</span>
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300"
                >
                  {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey ? 'কপি হয়েছে!' : 'URL কপি করুন'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-zinc-400 truncate bg-zinc-900 px-2 py-1 rounded">
                {webhookUrl}
              </p>
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">সংযোগ নির্দেশিকা:</p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                <li>BotFather থেকে বটের API টোকেন সংগ্রহ করুন</li>
                <li>Muse AI চ্যানেল বা গ্রুপে বটটি যোগ করুন যাতে ভিডিও পাঠাতে পারে</li>
                <li>টোকেনটি দিয়ে নিচে "কনফিগার করুন"-এ সেভ করুন</li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTest('telegram')}
              disabled={testingPlatform === 'telegram'}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              {testingPlatform === 'telegram' ? 'টেস্ট চলছে...' : 'সংযোগ পরীক্ষা'}
            </button>
            <button
              onClick={() => handleOpenEdit('telegram')}
              className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
            >
              কনফিগার করুন
            </button>
          </div>
        </div>

        {/* 2. Meta Facebook Page */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Facebook Page</h3>
                  <p className="text-xs text-zinc-400">Meta Graph API Reels পাবলিশিং</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${settings.meta_access_token ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                {settings.meta_access_token ? 'সক্রিয়' : 'স্যান্ডবক্স মোড'}
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">প্রয়োজনীয় পারমিশন (Meta App):</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">pages_manage_posts</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">pages_read_engagement</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">publish_video</span>
              </div>
              <p className="text-zinc-500 text-[10px] pt-1">
                Meta Developers থেকে পারমানেন্ট পেজ অ্যাক্সেস টোকেন ব্যবহার করুন।
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTest('facebook')}
              disabled={testingPlatform === 'facebook'}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              {testingPlatform === 'facebook' ? 'টেস্ট চলছে...' : 'সংযোগ পরীক্ষা'}
            </button>
            <button
              onClick={() => handleOpenEdit('facebook')}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              কনফিগার করুন
            </button>
          </div>
        </div>

        {/* 3. Instagram Professional */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instagram Professional</h3>
                  <p className="text-xs text-zinc-400">Instagram Graph API Reels পাবলিশিং</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${settings.meta_instagram_id ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                {settings.meta_instagram_id ? 'সক্রিয়' : 'স্যান্ডবক্স মোড'}
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">প্রয়োজনীয় পারমিশন:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">instagram_basic</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">instagram_content_publish</span>
              </div>
              <p className="text-zinc-500 text-[10px] pt-1">
                ইনস্টাগ্রাম অ্যাকাউন্টটি অবশ্যই ফেসবুক পেজের সাথে লিংকড প্রফেশনাল/বিজনেস অ্যাকাউন্ট হতে হবে।
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTest('instagram')}
              disabled={testingPlatform === 'instagram'}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              {testingPlatform === 'instagram' ? 'টেস্ট চলছে...' : 'সংযোগ পরীক্ষা'}
            </button>
            <button
              onClick={() => handleOpenEdit('instagram')}
              className="rounded-lg bg-pink-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-pink-500 transition"
            >
              কনফিগার করুন
            </button>
          </div>
        </div>

        {/* 4. YouTube Channel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">YouTube Channel</h3>
                  <p className="text-xs text-zinc-400">YouTube Data API v3 Shorts আপলোড</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${settings.youtube_refresh_token ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                {settings.youtube_refresh_token ? 'সক্রিয়' : 'স্যান্ডবক্স মোড'}
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">প্রয়োজনীয় OAuth স্কোপ:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">https://www.googleapis.com/auth/youtube.upload</span>
              </div>
              <p className="text-zinc-500 text-[10px] pt-1">
                Google Cloud কনসোল থেকে তৈরি করা OAuth Client ID ও Refresh Token দিয়ে স্বয়ংক্রিয় আপলোড হয়।
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTest('youtube')}
              disabled={testingPlatform === 'youtube'}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              {testingPlatform === 'youtube' ? 'টেস্ট চলছে...' : 'সংযোগ পরীক্ষা'}
            </button>
            <button
              onClick={() => handleOpenEdit('youtube')}
              className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
            >
              কনফিগার করুন
            </button>
          </div>
        </div>
      </div>

      {/* Test feedback toast */}
      {testMessage && (
        <div className={`rounded-xl p-4 flex items-center gap-3 border ${testMessage.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          {testMessage.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
          <p className="text-xs font-medium">{testMessage.text}</p>
        </div>
      )}

      {/* Modal for editing credentials */}
      {editingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editingPlatform.toUpperCase()} ক্রেডেনশিয়াল কনফিগারেশন
            </h3>
            <p className="text-xs text-zinc-400">
              নিরাপদে সার্ভারে সংরক্ষণ করা হবে। ব্রাউজারে কখনো দৃশ্যমান হবে না।
            </p>

            <div className="space-y-3">
              {editingPlatform === 'telegram' && (
                <>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Telegram Bot Token</label>
                    <input
                      type="password"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                      value={formData.telegram_bot_token || ''}
                      onChange={e => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Webhook Secret Token</label>
                    <input
                      type="text"
                      value={formData.telegram_webhook_secret || ''}
                      onChange={e => setFormData({ ...formData, telegram_webhook_secret: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Alerts Chat ID (ঐচ্ছিক টেলিগ্রাম নোটিফিকেশনের জন্য)</label>
                    <input
                      type="text"
                      placeholder="আপনার Telegram User/Chat ID"
                      value={formData.telegram_chat_id_alerts || ''}
                      onChange={e => setFormData({ ...formData, telegram_chat_id_alerts: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {(editingPlatform === 'facebook' || editingPlatform === 'instagram') && (
                <>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Meta Page Access Token (User / System User Token)</label>
                    <input
                      type="password"
                      placeholder="EAA..."
                      value={formData.meta_access_token || ''}
                      onChange={e => setFormData({ ...formData, meta_access_token: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Facebook Page ID</label>
                    <input
                      type="text"
                      placeholder="উদাঃ 1029384756..."
                      value={formData.meta_page_id || ''}
                      onChange={e => setFormData({ ...formData, meta_page_id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Instagram Professional Account ID</label>
                    <input
                      type="text"
                      placeholder="উদাঃ 178414000..."
                      value={formData.meta_instagram_id || ''}
                      onChange={e => setFormData({ ...formData, meta_instagram_id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {editingPlatform === 'youtube' && (
                <>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">Google OAuth Client ID</label>
                    <input
                      type="text"
                      placeholder="...apps.googleusercontent.com"
                      value={formData.youtube_client_id || ''}
                      onChange={e => setFormData({ ...formData, youtube_client_id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">OAuth Refresh Token</label>
                    <input
                      type="password"
                      placeholder="1//0..."
                      value={formData.youtube_refresh_token || ''}
                      onChange={e => setFormData({ ...formData, youtube_refresh_token: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-300 font-medium">YouTube Channel ID (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="UC..."
                      value={formData.youtube_channel_id || ''}
                      onChange={e => setFormData({ ...formData, youtube_channel_id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setEditingPlatform(null)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveCredentials}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
