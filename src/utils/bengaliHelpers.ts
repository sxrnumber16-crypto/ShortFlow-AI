import { JobStatus, Platform } from '../types/index.ts';

export const statusLabels: Record<JobStatus, { text: string; bg: string; textCol: string }> = {
  received: { text: 'গৃহীত হয়েছে', bg: 'bg-blue-500/10', textCol: 'text-blue-500' },
  parsing: { text: 'এআই পার্সিং চলছে', bg: 'bg-amber-500/10', textCol: 'text-amber-500' },
  needs_review: { text: 'পর্যালোচনা আবশ্যক', bg: 'bg-orange-500/10', textCol: 'text-orange-500' },
  ready: { text: 'প্রস্তুত', bg: 'bg-emerald-500/10', textCol: 'text-emerald-500' },
  scheduled: { text: 'শিডিউল্ড', bg: 'bg-purple-500/10', textCol: 'text-purple-500' },
  publishing: { text: 'প্রকাশনা চলছে...', bg: 'bg-indigo-500/10', textCol: 'text-indigo-500' },
  published: { text: 'প্রকাশিত', bg: 'bg-green-500/10', textCol: 'text-green-500' },
  retrying: { text: 'পুনঃচেষ্টা হচ্ছে', bg: 'bg-amber-500/10', textCol: 'text-amber-500' },
  failed: { text: 'ব্যর্থ হয়েছে', bg: 'bg-red-500/10', textCol: 'text-red-500' },
  cancelled: { text: 'বাতিল', bg: 'bg-gray-500/10', textCol: 'text-gray-400' },
};

export const platformNames: Record<Platform, { name: string; iconColor: string; bg: string }> = {
  facebook: { name: 'Facebook Reels', iconColor: 'text-blue-500', bg: 'bg-blue-500/10' },
  instagram: { name: 'Instagram Reels', iconColor: 'text-pink-500', bg: 'bg-pink-500/10' },
  youtube: { name: 'YouTube Shorts', iconColor: 'text-red-500', bg: 'bg-red-500/10' },
};

export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bnDigits[parseInt(d, 10)]);
}

export function formatDhakaDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatRelativeDhaka(iso: string): string {
  try {
    const target = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.round((target - now) / 1000);

    if (diffSec < 0) {
      const pastSec = Math.abs(diffSec);
      if (pastSec < 60) return 'এইমাত্র';
      if (pastSec < 3600) return `${toBengaliNumber(Math.floor(pastSec / 60))} মিনিট আগে`;
      if (pastSec < 86400) return `${toBengaliNumber(Math.floor(pastSec / 3600))} ঘণ্টা আগে`;
      return `${toBengaliNumber(Math.floor(pastSec / 86400))} দিন আগে`;
    } else {
      if (diffSec < 60) return '১ মিনিটের মধ্যে';
      if (diffSec < 3600) return `${toBengaliNumber(Math.floor(diffSec / 60))} মিনিট পর`;
      if (diffSec < 86400) return `${toBengaliNumber(Math.floor(diffSec / 3600))} ঘণ্টা পর`;
      return `${toBengaliNumber(Math.floor(diffSec / 86400))} দিন পর`;
    }
  } catch {
    return iso;
  }
}
