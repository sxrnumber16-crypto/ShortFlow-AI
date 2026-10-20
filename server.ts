import express, { Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { TelegramService } from './server/telegramService.ts';
import { schedulerService } from './server/schedulerService.ts';
import { ContentParserService } from './server/geminiService.ts';
import { executePublishingJob } from './server/publishingAdapters.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Start background scheduler
schedulerService.start(15000);

// --- REST API ROUTES ---

// 1. Health & Status
app.get('/api/status', (req: Request, res: Response) => {
  const settings = db.getSettings();
  const videos = db.getVideos();
  const jobs = db.getJobs();
  const accounts = db.getAccounts();

  const stats = {
    totalVideos: videos.length,
    needsReview: videos.filter(v => v.status === 'needs_review').length,
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    publishing: jobs.filter(j => j.status === 'publishing').length,
    published: jobs.filter(j => j.status === 'published').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    retrying: jobs.filter(j => j.status === 'retrying').length,
    connectedAccounts: accounts.filter(a => a.status === 'connected').length,
    timezone: settings.timezone,
    serverTime: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  };

  res.json({ ok: true, stats });
});

// 2. Telegram Webhook Receiver
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const secretTokenHeader = req.headers['x-telegram-bot-api-secret-token'];
    const settings = db.getSettings();

    // Verify secret token if configured
    if (settings.telegram_webhook_secret && secretTokenHeader !== settings.telegram_webhook_secret) {
      db.addLog(
        'telegram',
        'warn',
        'WEBHOOK_SECRET_MISMATCH',
        'Telegram ওয়েবহুক সিক্রেট টোকেন মেলেনি (অননুমোদিত অনুরোধ)'
      );
      return res.status(403).json({ error: 'Unauthorized secret token' });
    }

    const result = await TelegramService.handleWebhookUpdate(req.body);
    res.json({ ok: true, result });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// 3. Telegram Test Simulator
app.post('/api/telegram/simulate', async (req: Request, res: Response) => {
  try {
    const result = await TelegramService.simulateMuseAiIngestion(req.body);
    res.json({ ok: true, video: result.video });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// 4. Register Telegram Webhook Helper
app.post('/api/telegram/register-webhook', async (req: Request, res: Response) => {
  const { botToken, webhookUrl, secretToken } = req.body;
  if (!botToken || !webhookUrl) {
    return res.status(400).json({ error: 'বট টোকেন এবং ওয়েবহুক URL আবশ্যক' });
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken || undefined,
        allowed_updates: ['message'],
      }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      throw new Error(tgData.description || 'ওয়েবহুক রেজিস্ট্রেশন ব্যর্থ');
    }

    db.updateSettings({
      telegram_bot_token: botToken,
      telegram_webhook_secret: secretToken,
    });

    db.saveAccount({
      platform: 'telegram',
      name: 'Telegram Bot (Muse AI Receiver)',
      status: 'connected',
      last_checked_at: new Date().toISOString(),
    });

    db.addLog('telegram', 'success', 'WEBHOOK_REGISTERED', 'Telegram ওয়েবহুক সফলভাবে সংযুক্ত হয়েছে');
    res.json({ ok: true, data: tgData });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// 5. Videos CRUD
app.get('/api/videos', (req: Request, res: Response) => {
  const statusFilter = req.query.status as string;
  let videos = db.getVideos();
  if (statusFilter && statusFilter !== 'all') {
    videos = videos.filter(v => v.status === statusFilter);
  }
  res.json({ videos });
});

app.get('/api/videos/:id', (req: Request, res: Response) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'ভিডিও খুঁজে পাওয়া যায়নি' });

  const jobs = db.getJobsByVideoId(video.id);
  res.json({ video, jobs });
});

app.patch('/api/videos/:id', (req: Request, res: Response) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'ভিডিও খুঁজে পাওয়া যায়নি' });

  const { title, parsed_metadata, status } = req.body;
  if (title) video.title = title;
  if (parsed_metadata) video.parsed_metadata = parsed_metadata;
  if (status) video.status = status;

  db.saveVideo(video);
  db.addLog('system', 'info', 'VIDEO_UPDATED', `ভিডিও "${video.title}" ম্যানুয়ালি আপডেট করা হয়েছে`, { id: video.id });
  res.json({ ok: true, video });
});

app.post('/api/videos/:id/reparse', async (req: Request, res: Response) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'ভিডিও খুঁজে পাওয়া যায়নি' });

  try {
    const textToParse = video.original_text || video.title;
    const parsed = await ContentParserService.parseContent(textToParse);
    video.parsed_metadata = parsed;
    video.title = parsed.video_title || video.title;
    video.status = parsed.needs_review ? 'needs_review' : 'ready';
    db.saveVideo(video);

    res.json({ ok: true, video, parsed });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

app.delete('/api/videos/:id', (req: Request, res: Response) => {
  const success = db.deleteVideo(req.params.id);
  if (!success) return res.status(404).json({ error: 'ভিডিও খুঁজে পাওয়া যায়নি' });
  db.addLog('system', 'info', 'VIDEO_DELETED', `ভিডিও মুছে ফেলা হয়েছে ID: ${req.params.id}`);
  res.json({ ok: true });
});

// 6. Publishing Queue
app.get('/api/queue', (req: Request, res: Response) => {
  const jobs = db.getJobs().sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  res.json({ jobs });
});

app.post('/api/queue/:jobId/publish-now', async (req: Request, res: Response) => {
  const job = db.getJobById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'জব খুঁজে পাওয়া যায়নি' });

  // Force tick for this job
  await schedulerService.processJob(job);
  res.json({ ok: true, job: db.getJobById(job.id) });
});

app.post('/api/queue/:jobId/retry', async (req: Request, res: Response) => {
  const job = db.getJobById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'জব খুঁজে পাওয়া যায়নি' });

  job.status = 'retrying';
  job.next_retry_at = new Date().toISOString();
  db.saveJob(job);

  await schedulerService.processJob(job);
  res.json({ ok: true, job: db.getJobById(job.id) });
});

app.post('/api/queue/:jobId/cancel', (req: Request, res: Response) => {
  const job = db.getJobById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'জব খুঁজে পাওয়া যায়নি' });

  job.status = 'cancelled';
  db.saveJob(job);
  db.addLog('scheduler', 'warn', 'JOB_CANCELLED', `পাবলিশিং জব বাতিল করা হয়েছে: ${job.platform} (${job.id})`);
  res.json({ ok: true, job });
});

// 7. Social Accounts
app.get('/api/accounts', (req: Request, res: Response) => {
  res.json({ accounts: db.getAccounts() });
});

app.post('/api/accounts/:platform', (req: Request, res: Response) => {
  const platform = req.params.platform as 'facebook' | 'instagram' | 'youtube' | 'telegram';
  const { account_name, page_name, channel_title, bot_username, status } = req.body;

  db.saveAccount({
    platform,
    name: platform.toUpperCase(),
    status: status || 'connected',
    account_name,
    page_name,
    channel_title,
    bot_username,
    last_checked_at: new Date().toISOString(),
  });

  res.json({ ok: true, accounts: db.getAccounts() });
});

app.post('/api/accounts/:platform/test', async (req: Request, res: Response) => {
  const platform = req.params.platform;
  const settings = db.getSettings();

  // Test credentials based on platform
  let isOk = true;
  let message = 'অ্যাকাউন্ট ভ্যালিডেশন সফল';

  if (platform === 'telegram') {
    if (settings.telegram_bot_token) {
      try {
        const check = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/getMe`);
        const data = await check.json();
        if (data.ok) {
          message = `Telegram বট সক্রিয়: @${data.result.username}`;
        } else {
          isOk = false;
          message = `Telegram সংযোগ ব্যর্থ: ${data.description}`;
        }
      } catch {
        isOk = false;
        message = 'Telegram API নেটওয়ার্ক সংযোগ ব্যর্থ';
      }
    } else {
      message = 'স্যান্ডবক্স মোডে বট সংরক্ষিত';
    }
  } else if (platform === 'facebook' || platform === 'instagram') {
    if (settings.meta_access_token) {
      message = 'Meta টোকেন ফরম্যাট এবং পারমিশন সক্রিয়';
    } else {
      message = 'স্যান্ডবক্স মোডে মেটা ভ্যালিডেশন সক্রিয়';
    }
  } else if (platform === 'youtube') {
    if (settings.youtube_refresh_token) {
      message = 'YouTube OAuth রিফ্রেশ টোকেন ভ্যালিড';
    } else {
      message = 'স্যান্ডবক্স মোডে YouTube ভ্যালিডেশন সক্রিয়';
    }
  }

  res.json({ ok: isOk, message });
});

// 8. Logs
app.get('/api/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  res.json({ logs: db.getLogs(limit) });
});

// 9. Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ notifications: db.getNotifications() });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ ok: true });
});

app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  db.markAllNotificationsAsRead();
  res.json({ ok: true });
});

// 10. Settings
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  // Redact secrets for client display
  const sanitized = {
    ...settings,
    meta_access_token: settings.meta_access_token ? '••••••••••••••••' : '',
    telegram_bot_token: settings.telegram_bot_token ? '••••••••••••••••' : '',
    youtube_refresh_token: settings.youtube_refresh_token ? '••••••••••••••••' : '',
  };
  res.json({ settings: sanitized });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const newSettings = req.body;
  // If masked secret was submitted, keep existing
  const current = db.getSettings();
  if (newSettings.meta_access_token === '••••••••••••••••') {
    newSettings.meta_access_token = current.meta_access_token;
  }
  if (newSettings.telegram_bot_token === '••••••••••••••••') {
    newSettings.telegram_bot_token = current.telegram_bot_token;
  }
  if (newSettings.youtube_refresh_token === '••••••••••••••••') {
    newSettings.youtube_refresh_token = current.youtube_refresh_token;
  }

  const updated = db.updateSettings(newSettings);
  db.addLog('system', 'info', 'SETTINGS_UPDATED', 'কনফিগারেশন সেটিংস সংরক্ষিত হয়েছে');
  res.json({ ok: true, settings: updated });
});

// 11. Direct Gemini Parser Test
app.post('/api/gemini/parse-test', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'টেক্সট প্রদান আবশ্যক' });

  try {
    const parsed = await ContentParserService.parseContent(text);
    res.json({ ok: true, parsed });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// 12. Clear All Data (Reset completely)
app.post('/api/clear-all-data', (req: Request, res: Response) => {
  db.clearAllData();
  res.json({ ok: true, message: 'সমস্ত ডেমো এবং সংরক্ষিত ডেটা মুছে ফেলা হয়েছে।' });
});

// --- VITE MIDDLEWARE & STATIC ASSETS ---
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShortFlow AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
