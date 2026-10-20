import { db } from './db.ts';
import { executePublishingJob } from './publishingAdapters.ts';
import { calculateBackoffMs } from '../src/utils/schedulerLogic.ts';
import { PublishingJob } from '../src/types/index.ts';

class SchedulerService {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  start(intervalMs = 15000) {
    if (this.intervalTimer) return;
    db.addLog(
      'scheduler',
      'info',
      'SCHEDULER_STARTED',
      `ব্যাকগ্রাউন্ড পাবলিশিং শিডিউলার সক্রিয় হয়েছে (প্রতি ${intervalMs / 1000} সেকেন্ডে চেক)`
    );

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, intervalMs);

    // Initial tick on start
    setTimeout(() => this.tick(), 2000);
  }

  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  async tick() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const jobs = db.getJobs();

      // Find jobs ready to publish
      const readyJobs = jobs.filter(job => {
        if (job.status === 'scheduled') {
          return new Date(job.scheduled_at) <= now;
        }
        if (job.status === 'retrying') {
          return job.next_retry_at ? new Date(job.next_retry_at) <= now : true;
        }
        return false;
      });

      for (const job of readyJobs) {
        await this.processJob(job);
      }
    } catch (err) {
      console.error('Scheduler error during tick:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  async processJob(job: PublishingJob) {
    // Acquire lock
    job.status = 'publishing';
    job.attempts += 1;
    job.updated_at = new Date().toISOString();
    db.saveJob(job);

    db.addLog(
      job.platform,
      'info',
      'PUBLISH_ATTEMPT',
      `প্ল্যাটফর্মে প্রকাশনা প্রক্রিয়াধীন: ${job.platform.toUpperCase()} (চেষ্টা #${job.attempts})`,
      { jobId: job.id, videoId: job.video_id },
      job.video_id
    );

    const result = await executePublishingJob(job);

    if (result.success) {
      job.status = 'published';
      job.published_at = new Date().toISOString();
      job.result_post_id = result.postId;
      job.result_post_url = result.postUrl;
      job.last_error = undefined;
      db.saveJob(job);

      // Check if all jobs for this video are published
      const siblingJobs = db.getJobsByVideoId(job.video_id);
      const allPublished = siblingJobs.every(j => j.status === 'published');
      if (allPublished) {
        const video = db.getVideoById(job.video_id);
        if (video) {
          video.status = 'published';
          db.saveVideo(video);
        }
      }

      db.addLog(
        job.platform,
        'success',
        'PUBLISH_SUCCESS',
        `${job.platform.toUpperCase()}-এ প্রকাশনা সফল হয়েছে! পোস্ট URL: ${result.postUrl || result.postId}`,
        { postId: result.postId, postUrl: result.postUrl },
        job.video_id
      );

      db.addNotification(
        'published',
        `${job.platform.toUpperCase()} প্রকাশনা সফল`,
        `ভিডিও "${job.video_title}" সফলভাবে ${job.platform}-এ প্রকাশিত হয়েছে।`,
        job.video_id,
        result.postUrl
      );

      this.sendTelegramAlert(
        `✅ *ShortFlow প্রকাশনা সফল!*\n\nভিডিও: ${job.video_title}\nপ্ল্যাটফর্ম: ${job.platform.toUpperCase()}\nপোস্ট লিংক: ${result.postUrl || result.postId}`
      );
    } else {
      job.last_error = result.errorMessage;
      const settings = db.getSettings();

      if (result.requiresRetry && job.attempts < (job.max_attempts || settings.max_retries)) {
        job.status = 'retrying';
        const delayMs = calculateBackoffMs(job.attempts);
        job.next_retry_at = new Date(Date.now() + delayMs).toISOString();
        db.saveJob(job);

        db.addLog(
          job.platform,
          'warn',
          'PUBLISH_RETRY_SCHEDULED',
          `${job.platform.toUpperCase()} প্রকাশনায় ত্রুটি: ${result.errorMessage}। ${delayMs / 60000} মিনিট পর পুনঃচেষ্টা হবে।`,
          { error: result.errorMessage, nextRetryAt: job.next_retry_at },
          job.video_id
        );

        db.addNotification(
          'retry_warning',
          `${job.platform.toUpperCase()} প্রকাশনায় সমস্যা (পুনঃচেষ্টা শিডিউল্ড)`,
          `ত্রুটি: ${result.errorMessage}। সিস্টেম স্বয়ংক্রিয়ভাবে এক্সপোনেনশিয়াল ব্যাকঅফ সহ পুনরায় চেষ্টা করবে।`,
          job.video_id
        );
      } else {
        job.status = 'failed';
        db.saveJob(job);

        db.addLog(
          job.platform,
          'error',
          'PUBLISH_FAILED',
          `${job.platform.toUpperCase()} প্রকাশনা চূড়ান্তভাবে ব্যর্থ হয়েছে: ${result.errorMessage}`,
          { error: result.errorMessage, attempts: job.attempts },
          job.video_id
        );

        db.addNotification(
          'failed',
          `${job.platform.toUpperCase()} প্রকাশনা ব্যর্থ`,
          `ভিডিও "${job.video_title}" প্রকাশনা ব্যর্থ হয়েছে (${job.attempts} বার চেষ্টার পর)। অনুগ্রহ করে ড্যাশবোর্ডে লগ দেখুন।`,
          job.video_id
        );

        this.sendTelegramAlert(
          `❌ *ShortFlow প্রকাশনা ব্যর্থ!*\n\nভিডিও: ${job.video_title}\nপ্ল্যাটফর্ম: ${job.platform.toUpperCase()}\nত্রুটি: ${result.errorMessage}`
        );
      }
    }
  }

  private async sendTelegramAlert(text: string) {
    const settings = db.getSettings();
    if (!settings.telegram_bot_token || !settings.telegram_chat_id_alerts) return;

    try {
      await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegram_chat_id_alerts,
          text,
          parse_mode: 'Markdown',
        }),
      });
    } catch {
      // Ignore background notification transmission failures
    }
  }
}

export const schedulerService = new SchedulerService();
