import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Video,
  ListOrdered,
  CalendarDays,
  Share2,
  Sparkles,
  ScrollText,
  Bell,
  Settings,
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { VideoLibraryView } from './components/VideoLibraryView.tsx';
import { PublishingQueueView } from './components/PublishingQueueView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { SocialAccountsView } from './components/SocialAccountsView.tsx';
import { AiParserView } from './components/AiParserView.tsx';
import { ActivityLogsView } from './components/ActivityLogsView.tsx';
import { NotificationsView } from './components/NotificationsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SimulateIngestModal } from './components/SimulateIngestModal.tsx';
import { VideoDetailModal } from './components/VideoDetailModal.tsx';
import { api } from './services/api.ts';
import {
  VideoItem,
  PublishingJob,
  SocialAccount,
  AutomationLog,
  AppNotification,
  AppSettings,
  JobStatus,
  ParsedMetadata,
} from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const [vRes, qRes, aRes, lRes, nRes, sRes] = await Promise.all([
        api.getVideos(),
        api.getQueue(),
        api.getAccounts(),
        api.getLogs(60),
        api.getNotifications(),
        api.getSettings(),
      ]);

      setVideos(vRes.videos || []);
      setJobs(qRes.jobs || []);
      setAccounts(aRes.accounts || []);
      setLogs(lRes.logs || []);
      setNotifications(nRes.notifications || []);
      setSettings(sRes.settings);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-poll every 12 seconds for autonomous background sync
    const interval = setInterval(() => {
      loadData(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handler functions
  const handlePublishNow = async (jobId: string) => {
    await api.publishNow(jobId);
    await loadData(true);
  };

  const handleRetryJob = async (jobId: string) => {
    await api.retryJob(jobId);
    await loadData(true);
  };

  const handleCancelJob = async (jobId: string) => {
    await api.cancelJob(jobId);
    await loadData(true);
  };

  const handleReparseVideo = async (video: VideoItem) => {
    await api.reparseVideo(video.id);
    await loadData(true);
  };

  const handleDeleteVideo = async (video: VideoItem) => {
    await api.deleteVideo(video.id);
    setSelectedVideo(null);
    await loadData(true);
  };

  const handleSaveVideoDetail = async (
    id: string,
    payload: { title?: string; status?: JobStatus; parsed_metadata?: ParsedMetadata }
  ) => {
    await api.updateVideo(id, payload);
    await loadData(true);
  };

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const res = await api.saveSettings(newSettings);
    setSettings(res.settings);
    await loadData(true);
  };

  const handleResetAllData = async () => {
    await api.clearAllData();
    await loadData(true);
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const needsReviewCount = videos.filter(v => v.status === 'needs_review').length;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const queuedCount = jobs.filter(j => j.status === 'scheduled').length;

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-violet-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onNavigateToNotifications={() => setActiveTab('notifications')}
        notifications={notifications}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          needsReviewCount={needsReviewCount}
          unreadNotifsCount={unreadNotifsCount}
          queuedCount={queuedCount}
        />

        {/* Center Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
              </div>
            )}

            {!isLoading && (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    videos={videos}
                    jobs={jobs}
                    accounts={accounts}
                    logs={logs}
                    onNavigate={tab => setActiveTab(tab as ActiveTab)}
                    onSelectVideo={v => setSelectedVideo(v)}
                    onOpenSimulate={() => setIsSimulateOpen(true)}
                  />
                )}

                {activeTab === 'library' && (
                  <VideoLibraryView
                    videos={videos}
                    onSelectVideo={v => setSelectedVideo(v)}
                    onReparse={handleReparseVideo}
                    onDelete={handleDeleteVideo}
                  />
                )}

                {activeTab === 'queue' && (
                  <PublishingQueueView
                    jobs={jobs}
                    onPublishNow={handlePublishNow}
                    onRetry={handleRetryJob}
                    onCancel={handleCancelJob}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView
                    jobs={jobs}
                    onSelectJobVideo={videoId => {
                      const v = videos.find(item => item.id === videoId);
                      if (v) setSelectedVideo(v);
                    }}
                  />
                )}

                {activeTab === 'accounts' && settings && (
                  <SocialAccountsView
                    accounts={accounts}
                    settings={settings}
                    onRefresh={() => loadData(true)}
                    onUpdateSettings={handleSaveSettings}
                  />
                )}

                {activeTab === 'parser' && <AiParserView />}

                {activeTab === 'logs' && (
                  <ActivityLogsView logs={logs} onRefresh={() => loadData(true)} />
                )}

                {activeTab === 'notifications' && (
                  <NotificationsView
                    notifications={notifications}
                    onMarkRead={handleMarkNotificationRead}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                    onSelectVideoById={videoId => {
                      const v = videos.find(item => item.id === videoId);
                      if (v) setSelectedVideo(v);
                    }}
                  />
                )}

                {activeTab === 'settings' && settings && (
                  <SettingsView
                    settings={settings}
                    onSave={handleSaveSettings}
                    onResetAllData={handleResetAllData}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-zinc-800 bg-zinc-950/95 py-2 px-1 backdrop-blur">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activeTab === 'dashboard' ? 'text-violet-400 font-bold' : 'text-zinc-400'}`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>ড্যাশবোর্ড</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`relative flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activeTab === 'library' ? 'text-violet-400 font-bold' : 'text-zinc-400'}`}
        >
          <Video className="h-4 w-4" />
          <span>লাইব্রেরি</span>
          {needsReviewCount > 0 && (
            <span className="absolute -top-1 right-1 h-2 w-2 rounded-full bg-orange-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activeTab === 'queue' ? 'text-violet-400 font-bold' : 'text-zinc-400'}`}
        >
          <ListOrdered className="h-4 w-4" />
          <span>কিউ</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activeTab === 'calendar' ? 'text-violet-400 font-bold' : 'text-zinc-400'}`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>ক্যালেন্ডার</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${activeTab === 'settings' ? 'text-violet-400 font-bold' : 'text-zinc-400'}`}
        >
          <Settings className="h-4 w-4" />
          <span>সেটিংস</span>
        </button>
      </nav>

      {/* Simulator Modal */}
      <SimulateIngestModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onIngestComplete={video => {
          setSelectedVideo(video);
          setActiveTab('library');
          loadData(true);
        }}
      />

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        isOpen={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
        onSave={handleSaveVideoDetail}
        onReparse={handleReparseVideo}
        onDelete={handleDeleteVideo}
      />
    </div>
  );
}
