import {
  VideoItem,
  PublishingJob,
  SocialAccount,
  AutomationLog,
  AppNotification,
  AppSettings,
  ParsedMetadata,
} from '../types/index.ts';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fetchFn = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;
  const res = await fetchFn(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  getStatus: () => fetchJson<{ ok: boolean; stats: Record<string, unknown> }>('/api/status'),

  getVideos: (status?: string) =>
    fetchJson<{ videos: VideoItem[] }>(`/api/videos${status ? `?status=${status}` : ''}`),

  getVideoById: (id: string) =>
    fetchJson<{ video: VideoItem; jobs: PublishingJob[] }>(`/api/videos/${id}`),

  updateVideo: (id: string, payload: { title?: string; status?: string; parsed_metadata?: ParsedMetadata }) =>
    fetchJson<{ ok: boolean; video: VideoItem }>(`/api/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  reparseVideo: (id: string) =>
    fetchJson<{ ok: boolean; video: VideoItem; parsed: ParsedMetadata }>(`/api/videos/${id}/reparse`, {
      method: 'POST',
    }),

  deleteVideo: (id: string) =>
    fetchJson<{ ok: boolean }>(`/api/videos/${id}`, {
      method: 'DELETE',
    }),

  getQueue: () => fetchJson<{ jobs: PublishingJob[] }>('/api/queue'),

  publishNow: (jobId: string) =>
    fetchJson<{ ok: boolean; job: PublishingJob }>(`/api/queue/${jobId}/publish-now`, {
      method: 'POST',
    }),

  retryJob: (jobId: string) =>
    fetchJson<{ ok: boolean; job: PublishingJob }>(`/api/queue/${jobId}/retry`, {
      method: 'POST',
    }),

  cancelJob: (jobId: string) =>
    fetchJson<{ ok: boolean; job: PublishingJob }>(`/api/queue/${jobId}/cancel`, {
      method: 'POST',
    }),

  getAccounts: () => fetchJson<{ accounts: SocialAccount[] }>('/api/accounts'),

  saveAccount: (platform: string, data: Partial<SocialAccount>) =>
    fetchJson<{ ok: boolean; accounts: SocialAccount[] }>(`/api/accounts/${platform}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  testAccount: (platform: string) =>
    fetchJson<{ ok: boolean; message: string }>(`/api/accounts/${platform}/test`, {
      method: 'POST',
    }),

  getLogs: (limit = 100) =>
    fetchJson<{ logs: AutomationLog[] }>(`/api/logs?limit=${limit}`),

  getNotifications: () =>
    fetchJson<{ notifications: AppNotification[] }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    fetchJson<{ ok: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    fetchJson<{ ok: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  getSettings: () => fetchJson<{ settings: AppSettings }>('/api/settings'),

  saveSettings: (settings: Partial<AppSettings>) =>
    fetchJson<{ ok: boolean; settings: AppSettings }>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  simulateIngest: (params: Record<string, unknown>) =>
    fetchJson<{ ok: boolean; video: VideoItem }>('/api/telegram/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  testGeminiParse: (text: string) =>
    fetchJson<{ ok: boolean; parsed: ParsedMetadata }>('/api/gemini/parse-test', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  registerWebhook: (botToken: string, webhookUrl: string, secretToken?: string) =>
    fetchJson<{ ok: boolean; data: unknown }>('/api/telegram/register-webhook', {
      method: 'POST',
      body: JSON.stringify({ botToken, webhookUrl, secretToken }),
    }),

  clearAllData: () =>
    fetchJson<{ ok: boolean; message: string }>('/api/clear-all-data', {
      method: 'POST',
    }),
};
