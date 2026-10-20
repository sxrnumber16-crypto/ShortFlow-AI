import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ParsedMetadata } from '../types/index.ts';
import { api } from '../services/api.ts';
import { toBengaliNumber } from '../utils/bengaliHelpers.ts';

const SAMPLE_MUSE_TEXT = `📘 FB / Instagram
Title: Crispy Korean Fried Chicken Wings with Sweet Garlic Glaze
Caption: Golden crunchy wings coated in sticky sweet-spicy garlic glaze! Listen to that crunch. 🔥🍗✨
Hashtags: #friedchicken #koreanfood #foodanimation #crunchyfood #shorts

📺 YouTube SEO
TITLE: Crispy Korean Fried Chicken Wings with Sweet Garlic Glaze 🔥
DESCRIPTION: Experience the ultimate animated Korean fried chicken! Double-fried for maximum crunch and tossed in homemade sweet garlic glaze. Watch and enjoy!

Subscribe for more mouthwatering animated food shorts!
TAGS: korean fried chicken, crispy chicken wings, garlic glaze, animated food, asmr cooking, viral shorts`;

interface AiParserViewProps {
  onIngestParsedData?: (parsed: ParsedMetadata, rawText: string) => void;
}

export const AiParserView: React.FC<AiParserViewProps> = ({ onIngestParsedData }) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const [copiedJson, setCopiedJson] = useState(false);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setErrorMessage(null);
    try {
      const res = await api.testGeminiParse(inputText);
      setParsedResult(res.parsed);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errMsg);
    } finally {
      setIsParsing(false);
    }
  };

  const copyJson = () => {
    if (!parsedResult) return;
    navigator.clipboard.writeText(JSON.stringify(parsedResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Gemini AI কনটেন্ট পার্সার স্টুডিও</h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Muse AI টেলিগ্রাম বার্তার অসংগঠিত টেক্সটকে প্ল্যাটফর্মভিত্তিক সুসংগঠিত মেটাডাটায় রূপান্তর ও যাচাইকরণ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Textarea */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">ইনপুট: Muse AI টেলিগ্রাম মেসেজ</span>
              <button
                onClick={() => setInputText(SAMPLE_MUSE_TEXT)}
                className="text-[11px] text-violet-400 hover:text-violet-300 transition"
              >
                নমুনা টেক্সট লোড করুন
              </button>
            </div>

            <textarea
              rows={16}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Muse AI থেকে পাঠানো টেলিগ্রাম মেসেজ এখানে পেস্ট করুন..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-violet-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-zinc-500">
              মডেল: <span className="text-zinc-300 font-mono">gemini-3.8-flash</span>
            </span>

            <button
              onClick={handleParse}
              disabled={isParsing || !inputText.trim()}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 active:scale-95 transition disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'এআই পার্সিং চলছে...' : 'Gemini AI দিয়ে পার্স করুন'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Parsed Results */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <span className="text-xs font-semibold text-zinc-300">পার্সকৃত মেটাডাটা ও শ্রেণিবিন্যাস</span>

              {parsedResult && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-zinc-800 p-0.5 text-xs">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                        activeTab === 'preview' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      প্রিভিউ
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                        activeTab === 'json' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      JSON
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                ত্রুটি: {errorMessage}
              </div>
            )}

            {!parsedResult && !isParsing && (
              <div className="py-20 text-center">
                <FileText className="h-10 w-10 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-400">মেটাডাটা এখনও পার্স করা হয়নি</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  বামে টেক্সট প্রদান করে "Gemini AI দিয়ে পার্স করুন" বোতামে ক্লিক করুন।
                </p>
              </div>
            )}

            {isParsing && (
              <div className="py-20 text-center space-y-3">
                <Sparkles className="h-8 w-8 mx-auto text-violet-400 animate-spin" />
                <p className="text-xs text-zinc-300">Gemini AI বার্তা বিশ্লেষণ করছে...</p>
                <p className="text-[11px] text-zinc-500">লেবেল পরিষ্কার ও প্ল্যাটফর্ম মেটাডাটা নিষ্কাশন হচ্ছে</p>
              </div>
            )}

            {parsedResult && activeTab === 'preview' && (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {/* Confidence & Review Banner */}
                <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">এআই আত্মবিশ্বাস:</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {toBengaliNumber(parsedResult.confidence)}%
                    </span>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                      parsedResult.needs_review
                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {parsedResult.needs_review ? 'পর্যালোচনা আবশ্যক' : 'যাচাইকৃত (Ready)'}
                  </span>
                </div>

                {/* Video Title */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500">মূল ভিডিও শিরোনাম:</span>
                  <p className="text-xs font-bold text-zinc-200 mt-0.5 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    {parsedResult.video_title}
                  </p>
                </div>

                {/* Facebook & Instagram */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                    <span>Facebook & Instagram মেটাডাটা</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400">ক্যাপশন:</span>
                    <p className="text-xs text-zinc-200 mt-0.5">{parsedResult.facebook.caption}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedResult.facebook.hashtags.map((h, i) => (
                      <span key={i} className="rounded bg-blue-500/10 text-blue-400 px-1.5 py-0.5 text-[10px] font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* YouTube SEO */}
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                    <span>YouTube Shorts SEO</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400">YouTube শিরোনাম:</span>
                    <p className="text-xs font-semibold text-zinc-200 mt-0.5">{parsedResult.youtube.title}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400">বর্ণনা (Description):</span>
                    <p className="text-xs text-zinc-300 mt-0.5 line-clamp-3">{parsedResult.youtube.description}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400">SEO ট্যাগ (Tags):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parsedResult.youtube.tags.map((t, i) => (
                        <span key={i} className="rounded bg-zinc-800 text-zinc-300 px-1.5 py-0.5 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {parsedResult && activeTab === 'json' && (
              <div className="relative">
                <button
                  onClick={copyJson}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:text-white"
                >
                  {copiedJson ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedJson ? 'কপি হয়েছে' : 'কপি JSON'}</span>
                </button>
                <pre className="rounded-xl bg-zinc-950 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[460px] border border-zinc-800">
                  {JSON.stringify(parsedResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
