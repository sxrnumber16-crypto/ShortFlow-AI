export type Platform = 'facebook' | 'instagram' | 'youtube';

export type JobStatus =
  | 'received'
  | 'parsing'
  | 'needs_review'
  | 'ready'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'retrying'
  | 'failed'
  | 'cancelled';

export interface PlatformMetadata {
  caption: string;
  hashtags: string[];
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  hashtags: string[];
  tags: string[];
}

export interface ParsedMetadata {
  video_title: string;
  facebook: PlatformMetadata;
  instagram: PlatformMetadata;
  youtube: YouTubeMetadata;
  language: string;
  confidence: number;
  needs_review: boolean;
  missing_fields: string[];
  raw_gemini_response?: string;
  parser_type?: 'gemini' | 'deterministic' | 'hybrid';
}

export interface TelegramMessage {
  id: string;
  message_id: number;
  chat_id: number | string;
  from_user?: string;
  date: number;
  text?: string;
  has_video: boolean;
  video_file_id?: string;
  video_file_name?: string;
  caption?: string;
  matched_video_id?: string;
  created_at: string;
}

export interface VideoItem {
  id: string;
  title: string;
  telegram_file_id?: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  file_size?: number;
  resolution?: string;
  received_at: string;
  status: JobStatus;
  matched_message_ids: string[];
  parsed_metadata?: ParsedMetadata;
  original_text?: string;
  is_archived?: boolean;
}

export interface PublishingJob {
  id: string;
  video_id: string;
  video_title: string;
  platform: Platform;
  status: JobStatus;
  scheduled_at: string; // ISO string in Asia/Dhaka or UTC
  published_at?: string;
  attempts: number;
  max_attempts: number;
  next_retry_at?: string;
  last_error?: string;
  result_post_id?: string;
  result_post_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  platform: 'facebook' | 'instagram' | 'youtube' | 'telegram';
  name: string;
  status: 'connected' | 'expired' | 'not_configured' | 'error';
  account_id?: string;
  account_name?: string;
  page_name?: string;
  channel_title?: string;
  bot_username?: string;
  last_checked_at?: string;
  error_message?: string;
  scopes?: string[];
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: 'telegram' | 'gemini' | 'scheduler' | 'facebook' | 'instagram' | 'youtube' | 'system';
  event_type: string;
  video_id?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  type: 'video_received' | 'parsing_completed' | 'needs_review' | 'published' | 'failed' | 'retry_warning' | 'account_expired' | 'system';
  title: string;
  message: string;
  read: boolean;
  video_id?: string;
  action_url?: string;
}

export interface AppSettings {
  timezone: string; // 'Asia/Dhaka'
  auto_publish_min_confidence: number;
  matching_window_minutes: number;
  publishing_slots: {
    facebook: string[];
    instagram: string[];
    youtube: string[];
  };
  max_retries: number;
  telegram_bot_token?: string;
  telegram_webhook_secret?: string;
  telegram_chat_id_alerts?: string;
  notify_telegram_on_success: boolean;
  notify_telegram_on_failure: boolean;
  notify_telegram_on_review: boolean;
  meta_access_token?: string;
  meta_page_id?: string;
  meta_instagram_id?: string;
  youtube_client_id?: string;
  youtube_refresh_token?: string;
  youtube_channel_id?: string;
}
