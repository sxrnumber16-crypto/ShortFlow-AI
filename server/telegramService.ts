import { db } from './db.ts';
import { ContentParserService } from './geminiService.ts';
import { calculateNextPublishSlot } from '../src/utils/schedulerLogic.ts';
import { VideoItem, TelegramMessage, PublishingJob, JobStatus } from '../src/types/index.ts';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number | string;
      title?: string;
      type: string;
    };
    date: number;
    text?: string;
    caption?: string;
    video?: {
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      duration: number;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    document?: {
      file_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
  };
}

export class TelegramService {
  /**
   * Process incoming Telegram webhook updates
   */
  static async handleWebhookUpdate(update: TelegramUpdate): Promise<{ success: boolean; action: string; videoId?: string }> {
    const message = update.message;
    if (!message) {
      return { success: true, action: 'ignored_non_message' };
    }

    const chatId = message.chat.id;
    const messageId = message.message_id;
    const settings = db.getSettings();

    const isVideo = Boolean(message.video || (message.document && message.document.mime_type?.startsWith('video/')));
    const textContent = message.text || message.caption || '';

    db.addLog(
      'telegram',
      'info',
      'TELEGRAM_UPDATE_RECEIVED',
      `Telegram বার্তা এসেছে (Chat: ${chatId}, MsgID: ${messageId}, Video: ${isVideo})`,
      { messageId, chatId, isVideo }
    );

    // Save message record
    const storedMsg: TelegramMessage = {
      id: `tg_msg_${messageId}_${Date.now()}`,
      message_id: messageId,
      chat_id: chatId,
      from_user: message.from?.username || message.from?.first_name || 'Muse_AI',
      date: message.date,
      text: message.text,
      caption: message.caption,
      has_video: isVideo,
      video_file_id: message.video?.file_id || message.document?.file_id,
      video_file_name: message.video?.file_name || message.document?.file_name || 'shorts_video.mp4',
      created_at: new Date().toISOString(),
    };
    db.saveMessage(storedMsg);

    if (isVideo) {
      // 1. Process Video
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const fileId = storedMsg.video_file_id!;

      // In real Telegram bot, resolve file path:
      let fileUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      if (settings.telegram_bot_token && fileId && !fileId.startsWith('mock_')) {
        try {
          const fileInfoRes = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/getFile?file_id=${fileId}`);
          const fileInfo = await fileInfoRes.json();
          if (fileInfo.ok && fileInfo.result.file_path) {
            fileUrl = `https://api.telegram.org/file/bot${settings.telegram_bot_token}/${fileInfo.result.file_path}`;
          }
        } catch (e) {
          console.warn('Could not fetch telegram file url:', e);
        }
      }

      const newVideo: VideoItem = {
        id: videoId,
        title: 'অপেক্ষমাণ Shorts ভিডিও',
        telegram_file_id: fileId,
        file_url: fileUrl,
        thumbnail_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        duration: message.video?.duration || 30,
        file_size: message.video?.file_size || message.document?.file_size || 8000000,
        resolution: message.video ? `${message.video.width}x${message.video.height}` : '1080x1920',
        received_at: new Date().toISOString(),
        status: 'parsing',
        matched_message_ids: [storedMsg.id],
      };

      storedMsg.matched_video_id = videoId;
      db.saveMessage(storedMsg);

      // Check if there are already received text messages from the same chat in the matching window
      const unassignedMessages = db.getUnmatchedMessages(chatId, settings.matching_window_minutes);
      const combinedTexts = [
        message.caption || '',
        ...unassignedMessages.map(m => m.text || m.caption || ''),
      ].filter(Boolean).join('\n\n');

      if (combinedTexts.length > 20) {
        // Link messages
        for (const m of unassignedMessages) {
          m.matched_video_id = videoId;
          db.saveMessage(m);
          newVideo.matched_message_ids.push(m.id);
        }

        newVideo.original_text = combinedTexts;
        db.saveVideo(newVideo);

        // Run Gemini Content Parser
        await this.parseAndScheduleVideo(newVideo, combinedTexts);
      } else {
        // Awaiting separate metadata message
        newVideo.status = 'parsing';
        newVideo.original_text = message.caption || '';
        db.saveVideo(newVideo);

        db.addNotification(
          'video_received',
          'নতুন Shorts ভিডিও ফাইল গৃহীত হয়েছে',
          `Muse AI থেকে ভিডিও রিসিভ করা হয়েছে। মেটাডাটা বার্তার জন্য অপেক্ষা করা হচ্ছে (ম্যাচিং উইন্ডো: ${settings.matching_window_minutes} মিনিট)।`,
          videoId
        );
      }

      return { success: true, action: 'video_processed', videoId };
    } else {
      // 2. Process separate text message (Muse AI metadata message)
      // Check if there is an uncompleted/recent video from the same chat waiting for metadata
      const candidateVideos = db.getVideos().filter(
        v => v.status === 'parsing' || v.status === 'received'
      );

      if (candidateVideos.length > 0) {
        const targetVideo = candidateVideos[0];
        storedMsg.matched_video_id = targetVideo.id;
        db.saveMessage(storedMsg);

        targetVideo.matched_message_ids.push(storedMsg.id);
        const combined = [targetVideo.original_text, textContent].filter(Boolean).join('\n\n');
        targetVideo.original_text = combined;
        db.saveVideo(targetVideo);

        db.addLog(
          'telegram',
          'info',
          'MESSAGE_MATCHED_TO_VIDEO',
          `মেটাডাটা বার্তা ভিডিওর সাথে সফলভাবে মেলানো হয়েছে (Video ID: ${targetVideo.id})`,
          { videoId: targetVideo.id, messageId }
        );

        await this.parseAndScheduleVideo(targetVideo, combined);
        return { success: true, action: 'metadata_matched', videoId: targetVideo.id };
      }

      // No active video waiting yet, message saved in queue
      return { success: true, action: 'metadata_buffered_awaiting_video' };
    }
  }

  /**
   * Helper to parse video content with Gemini and assign publishing slots
   */
  static async parseAndScheduleVideo(video: VideoItem, rawContent: string): Promise<void> {
    const settings = db.getSettings();

    db.addLog(
      'gemini',
      'info',
      'PARSING_STARTED',
      `ভিডিও "${video.id}" এর জন্য Gemini AI কন্টেন্ট পার্সিং শুরু হয়েছে`,
      { videoId: video.id }
    );

    const parsed = await ContentParserService.parseContent(rawContent);
    video.parsed_metadata = parsed;
    video.title = parsed.video_title || 'Untitled Shorts';

    const needsReview = parsed.needs_review || parsed.confidence < settings.auto_publish_min_confidence;

    if (needsReview) {
      video.status = 'needs_review';
      db.saveVideo(video);

      db.addNotification(
        'needs_review',
        'ম্যানুয়াল পর্যালোচনা আবশ্যক',
        `ভিডিও "${video.title}"-এর মেটাডাটা আত্মবিশ্বাস (${parsed.confidence}%) ন্যূনতম সীমার নিচে বা ক্ষেত্র অনুপস্থিত। দয়া করে রিভিউ করুন।`,
        video.id
      );
      return;
    }

    // Auto-approve and schedule
    video.status = 'scheduled';
    db.saveVideo(video);

    // Assign independent publishing slots for Facebook, Instagram, and YouTube
    const now = new Date();
    const existingJobs = db.getJobs();

    const platforms: ('facebook' | 'instagram' | 'youtube')[] = ['facebook', 'instagram', 'youtube'];

    for (const platform of platforms) {
      const platformSlots = settings.publishing_slots[platform] || ['14:00', '19:00', '22:00'];
      const existingForPlatform = existingJobs.filter(j => j.platform === platform && j.status === 'scheduled');
      const scheduledIso = calculateNextPublishSlot(now, platformSlots, existingForPlatform, 6);

      const job: PublishingJob = {
        id: `job_${platform}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        video_id: video.id,
        video_title: video.title,
        platform,
        status: 'scheduled',
        scheduled_at: scheduledIso,
        attempts: 0,
        max_attempts: settings.max_retries || 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.saveJob(job);
    }

    db.addLog(
      'scheduler',
      'success',
      'AUTOMATION_PIPELINE_COMPLETE',
      `ভিডিও "${video.title}" সফলভাবে পার্স এবং Facebook, Instagram ও YouTube-এ শিডিউল করা হয়েছে`,
      { videoId: video.id }
    );

    db.addNotification(
      'parsing_completed',
      'ভিডিও স্বয়ংক্রিয়ভাবে শিডিউল হয়েছে',
      `"${video.title}" সফলভাবে প্রসেস হয়েছে। Facebook, Instagram এবং YouTube-এ আগামী উপলব্ধ স্লটে প্রকাশিত হবে।`,
      video.id
    );
  }

  /**
   * Simulate receiving a Muse AI update (used for testing and in-app simulator)
   */
  static async simulateMuseAiIngestion(params: {
    videoTitle?: string;
    videoUrl?: string;
    fbCaption?: string;
    fbHashtags?: string;
    ytTitle?: string;
    ytDescription?: string;
    ytTags?: string;
    rawText?: string;
  }): Promise<{ video: VideoItem }> {
    const raw = params.rawText || `
📘 FB / Instagram
Title: ${params.videoTitle || 'Delicious Spiced Chicken Skewers'}
Caption: ${params.fbCaption || 'Fire-roasted savory spiced chicken skewers dripping with garlic glaze! 🔥🍗'}
Hashtags: ${params.fbHashtags || '#chicken #skewers #foodanimation #shorts #bbq'}

📺 YouTube SEO
TITLE: ${params.ytTitle || params.videoTitle || 'Delicious Spiced Chicken Skewers 🔥 Animated Cooking'}
DESCRIPTION: ${params.ytDescription || 'Watch how these delicious animated chicken skewers are grilled to golden perfection! Secret garlic and chili marinade.'}
TAGS: ${params.ytTags || 'chicken skewers, animated cooking, food animation, bbq shorts, asmr food'}
`.trim();

    const videoId = `vid_sim_${Date.now()}`;
    const newVideo: VideoItem = {
      id: videoId,
      title: params.videoTitle || 'Delicious Spiced Chicken Skewers',
      file_url: params.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
      duration: 35,
      file_size: 11200000,
      resolution: '1080x1920',
      received_at: new Date().toISOString(),
      status: 'parsing',
      matched_message_ids: [`sim_msg_${Date.now()}`],
      original_text: raw,
    };

    db.saveVideo(newVideo);
    await this.parseAndScheduleVideo(newVideo, raw);
    const updated = db.getVideoById(videoId)!;
    return { video: updated };
  }
}
