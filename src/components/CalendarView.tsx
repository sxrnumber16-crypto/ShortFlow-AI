import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Share2, Video } from 'lucide-react';
import { PublishingJob } from '../types/index.ts';
import {
  toBengaliNumber,
  formatDhakaDate,
  platformNames,
  statusLabels,
} from '../utils/bengaliHelpers.ts';

interface CalendarViewProps {
  jobs: PublishingJob[];
  onSelectJobVideo?: (videoId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ jobs, onSelectJobVideo }) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Generate 7 days starting from today in Dhaka time
  const now = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getTime() + i * 86400 * 1000);
    return {
      offset: i,
      date: d,
      dateString: d.toLocaleDateString('bn-BD', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      isToday: i === 0,
      isTomorrow: i === 1,
    };
  });

  const activeDay = days[selectedDayOffset] || days[0];

  // Filter jobs that fall on activeDay (in Asia/Dhaka)
  const activeDayJobs = jobs.filter(job => {
    const jobDate = new Date(job.scheduled_at);
    // Compare YYYY-MM-DD in Asia/Dhaka
    const jobDayStr = jobDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    const targetDayStr = activeDay.date.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    return jobDayStr === targetDayStr;
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">ক্যালেন্ডার ও প্রকাশনা সময়সূচী</h2>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              এশিয়া/ঢাকা (UTC+6)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            সপ্তাহের প্রতিটি দিনের স্বয়ংক্রিয় ও নির্ধারিত শর্টস প্রকাশনা স্লট
          </p>
        </div>
      </div>

      {/* 7-Day Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {days.map(day => {
          const isSelected = selectedDayOffset === day.offset;
          // Count jobs for this day
          const targetDayStr = day.date.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
          const dayJobCount = jobs.filter(j => {
            const jStr = new Date(j.scheduled_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
            return jStr === targetDayStr;
          }).length;

          return (
            <button
              key={day.offset}
              onClick={() => setSelectedDayOffset(day.offset)}
              className={`rounded-2xl border p-3 text-left transition ${
                isSelected
                  ? 'border-violet-500 bg-violet-600/20 text-white shadow-lg shadow-violet-600/10'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">
                  {day.isToday ? 'আজ' : day.isTomorrow ? 'আগামীকাল' : day.date.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'short' })}
                </span>
                {dayJobCount > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isSelected ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                    {toBengaliNumber(dayJobCount)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-200">
                {day.date.toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' })}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Day Schedule Details */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">
              {activeDay.dateString} - প্রকাশনা সময়সূচী
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            মোট {toBengaliNumber(activeDayJobs.length)}টি পোস্ট নির্ধারিত
          </span>
        </div>

        {activeDayJobs.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">এই দিনে কোনো প্রকাশনা শিডিউল নেই</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Muse AI থেকে ভিডিও আসলে বা সেটিংস থেকে স্লট কনফিগার করা থাকলে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDayJobs.map(job => {
              const pInfo = platformNames[job.platform];
              const sInfo = statusLabels[job.status] || statusLabels.scheduled;

              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${pInfo.bg} ${pInfo.iconColor}`}>
                      {pInfo.name}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">{job.video_title}</h4>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>সময়: {formatDhakaDate(job.scheduled_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${sInfo.bg} ${sInfo.textCol}`}>
                      {sInfo.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
