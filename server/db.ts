import fs from 'node:fs';
import path from 'node:path';
import {
  VideoItem,
  TelegramMessage,
  PublishingJob,
  SocialAccount,
  AutomationLog,
  AppNotification,
  AppSettings,
  ParsedMetadata,
} from '../src/types/index.ts';

interface DatabaseSchema {
  videos: VideoItem[];
  messages: TelegramMessage[];
  jobs: PublishingJob[];
  accounts: SocialAccount[];
  logs: AutomationLog[];
  notifications: AppNotification[];
  settings: AppSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'shortflow_db.json');

// Initial default settings
const defaultSettings: AppSettings = {
  timezone: 'Asia/Dhaka',
  auto_publish_min_confidence: 85,
  matching_window_minutes: 30,
  publishing_slots: {
    facebook: ['14:00', '19:00', '22:00'],
    instagram: ['13:30', '18:30', '21:30'],
    youtube: ['15:00', '20:00', '23:00'],
  },
  max_retries: 3,
  telegram_bot_token: '',
  telegram_webhook_secret: 'shortflow_secret_token_2026',
  telegram_chat_id_alerts: '',
  notify_telegram_on_success: true,
  notify_telegram_on_failure: true,
  notify_telegram_on_review: true,
  meta_access_token: '',
  meta_page_id: '',
  meta_instagram_id: '',
  youtube_client_id: '',
  youtube_refresh_token: '',
  youtube_channel_id: '',
};

// Clean initial data schema without any demo videos, jobs, or logs
function getInitialData(): DatabaseSchema {
  return {
    videos: [],
    messages: [],
    jobs: [],
    accounts: [
      {
        platform: 'telegram',
        name: 'Telegram Bot (Muse AI Receiver)',
        status: 'not_configured',
      },
      {
        platform: 'facebook',
        name: 'Facebook Page (Meta Graph API)',
        status: 'not_configured',
      },
      {
        platform: 'instagram',
        name: 'Instagram Professional',
        status: 'not_configured',
      },
      {
        platform: 'youtube',
        name: 'YouTube Channel (Data API v3)',
        status: 'not_configured',
      },
    ],
    logs: [],
    notifications: [],
    settings: defaultSettings,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...getInitialData(),
          ...parsed,
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
        };
      }
    } catch (e) {
      console.error('Error loading db file, re-initializing default data:', e);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const content = JSON.stringify(dataToSave || this.data, null, 2);
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, content, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
      console.error('Failed to persist database to disk:', e);
    }
  }

  // Videos
  getVideos(): VideoItem[] {
    return [...this.data.videos].filter(v => !v.is_archived);
  }

  getAllVideosIncludingArchived(): VideoItem[] {
    return [...this.data.videos];
  }

  getVideoById(id: string): VideoItem | undefined {
    return this.data.videos.find(v => v.id === id);
  }

  saveVideo(video: VideoItem): void {
    const idx = this.data.videos.findIndex(v => v.id === video.id);
    if (idx >= 0) {
      this.data.videos[idx] = video;
    } else {
      this.data.videos.unshift(video);
    }
    this.save();
  }

  deleteVideo(id: string): boolean {
    const initialLen = this.data.videos.length;
    this.data.videos = this.data.videos.filter(v => v.id !== id);
    // Also cancel or remove associated pending jobs
    this.data.jobs = this.data.jobs.filter(j => j.video_id !== id || j.status === 'published');
    this.save();
    return this.data.videos.length < initialLen;
  }

  // Messages
  getMessages(): TelegramMessage[] {
    return [...this.data.messages];
  }

  saveMessage(msg: TelegramMessage): void {
    const idx = this.data.messages.findIndex(m => m.id === msg.id);
    if (idx >= 0) {
      this.data.messages[idx] = msg;
    } else {
      this.data.messages.unshift(msg);
    }
    this.save();
  }

  getUnmatchedMessages(chatId: number | string, windowMinutes: number): TelegramMessage[] {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    return this.data.messages.filter(
      m => String(m.chat_id) === String(chatId) &&
           !m.matched_video_id &&
           new Date(m.created_at).getTime() >= cutoff
    );
  }

  // Publishing Jobs
  getJobs(): PublishingJob[] {
    return [...this.data.jobs];
  }

  getJobById(id: string): PublishingJob | undefined {
    return this.data.jobs.find(j => j.id === id);
  }

  getJobsByVideoId(videoId: string): PublishingJob[] {
    return this.data.jobs.filter(j => j.video_id === videoId);
  }

  saveJob(job: PublishingJob): void {
    const idx = this.data.jobs.findIndex(j => j.id === job.id);
    job.updated_at = new Date().toISOString();
    if (idx >= 0) {
      this.data.jobs[idx] = job;
    } else {
      this.data.jobs.push(job);
    }
    this.save();
  }

  // Accounts
  getAccounts(): SocialAccount[] {
    return [...this.data.accounts];
  }

  saveAccount(account: SocialAccount): void {
    const idx = this.data.accounts.findIndex(a => a.platform === account.platform);
    if (idx >= 0) {
      this.data.accounts[idx] = { ...this.data.accounts[idx], ...account };
    } else {
      this.data.accounts.push(account);
    }
    this.save();
  }

  // Logs
  getLogs(limit = 100): AutomationLog[] {
    return [...this.data.logs].slice(0, limit);
  }

  addLog(
    module: AutomationLog['module'],
    level: AutomationLog['level'],
    event_type: string,
    message: string,
    details?: Record<string, unknown>,
    videoId?: string
  ): AutomationLog {
    const log: AutomationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      event_type,
      video_id: videoId,
      message,
      details,
    };
    this.data.logs.unshift(log);
    // Keep max 500 logs
    if (this.data.logs.length > 500) {
      this.data.logs = this.data.logs.slice(0, 500);
    }
    this.save();
    return log;
  }

  // Notifications
  getNotifications(): AppNotification[] {
    return [...this.data.notifications];
  }

  addNotification(
    type: AppNotification['type'],
    title: string,
    message: string,
    videoId?: string,
    actionUrl?: string
  ): AppNotification {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      read: false,
      video_id: videoId,
      action_url: actionUrl,
    };
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 200) {
      this.data.notifications = this.data.notifications.slice(0, 200);
    }
    this.save();
    return notif;
  }

  markNotificationAsRead(id: string): void {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.save();
    }
  }

  markAllNotificationsAsRead(): void {
    this.data.notifications.forEach(n => (n.read = true));
    this.save();
  }

  // Settings
  getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
    return this.data.settings;
  }

  clearAllData(): void {
    const clean = getInitialData();
    this.data.videos = [];
    this.data.messages = [];
    this.data.jobs = [];
    this.data.logs = [];
    this.data.notifications = [];
    this.data.accounts = clean.accounts;
    this.save();
  }
}

export const db = new Database();
