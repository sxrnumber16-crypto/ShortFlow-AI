import { ParsedMetadata } from '../types/index.ts';

/**
 * Clean structural labels from text while preserving words, emojis, line breaks, hashtags
 */
export function cleanStructuralLabel(text: string, label: string): string {
  if (!text) return '';
  const regex = new RegExp(`^\\s*${label}\\s*[:\\-]?\\s*`, 'i');
  return text.replace(regex, '').trim();
}

/**
 * Extracts hashtags (#word) and returns unique cleaned tags with # symbol
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return Array.from(new Set(matches));
}

/**
 * Extracts comma-separated SEO tags (no # symbol)
 */
export function extractSeoTags(text: string): string[] {
  if (!text) return [];
  const cleaned = text.replace(/^TAGS\s*[:\-]?\s*/i, '');
  return cleaned
    .split(/[,;\n]/)
    .map(t => t.trim().replace(/^#/, ''))
    .filter(t => t.length > 0 && t.length <= 40);
}

/**
 * Deterministic parser for standard Muse AI messages
 * Useful as a first-pass or fallback when Gemini API is unavailable
 */
export function parseMuseAiMessagesDeterministically(rawText: string): ParsedMetadata {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  let title = '';
  let fbCaption = '';
  const fbHashtags: string[] = [];
  let ytTitle = '';
  let ytDescription = '';
  const ytHashtags: string[] = [];
  const ytTags: string[] = [];

  let currentSection: 'fb' | 'yt' | 'none' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/FB\s*\/\s*Instagram/i.test(line) || /📘/i.test(line)) {
      currentSection = 'fb';
      continue;
    }

    if (/YouTube\s*SEO/i.test(line) || /📺/i.test(line)) {
      currentSection = 'yt';
      continue;
    }

    if (/^TITLE\s*[:\-]/i.test(line)) {
      const value = line.replace(/^TITLE\s*[:\-]\s*/i, '').trim();
      if (!title) title = value;
      if (currentSection === 'yt') ytTitle = value;
      continue;
    }

    if (/^CAPTION\s*[:\-]/i.test(line)) {
      const value = line.replace(/^CAPTION\s*[:\-]\s*/i, '').trim();
      if (currentSection === 'fb' || currentSection === 'none') {
        fbCaption = value;
      }
      continue;
    }

    if (/^DESCRIPTION\s*[:\-]/i.test(line)) {
      const value = line.replace(/^DESCRIPTION\s*[:\-]\s*/i, '').trim();
      ytDescription = value;
      continue;
    }

    if (/^HASHTAGS?\s*[:\-]/i.test(line)) {
      const tags = extractHashtags(line);
      if (currentSection === 'fb' || currentSection === 'none') {
        fbHashtags.push(...tags);
      }
      if (currentSection === 'yt') {
        ytHashtags.push(...tags);
      }
      continue;
    }

    if (/^TAGS\s*[:\-]/i.test(line)) {
      ytTags.push(...extractSeoTags(line));
      continue;
    }

    // Free text fallbacks
    if (currentSection === 'fb' && !fbCaption && line.length > 10 && !line.startsWith('#')) {
      fbCaption = line;
    } else if (currentSection === 'yt' && !ytDescription && line.length > 10 && !line.startsWith('#')) {
      ytDescription = line;
    }
  }

  // Fallback title matching
  if (!title && ytTitle) title = ytTitle;
  if (!ytTitle && title) ytTitle = title;
  if (!title) {
    const firstLine = lines.find(l => !l.startsWith('📘') && !l.startsWith('📺') && !l.startsWith('#'));
    title = firstLine ? firstLine.slice(0, 80) : 'Shorts Video';
  }

  // Global hashtag sweep if empty
  if (fbHashtags.length === 0) {
    fbHashtags.push(...extractHashtags(rawText));
  }
  if (ytHashtags.length === 0) {
    ytHashtags.push(...extractHashtags(rawText));
  }

  const missingFields: string[] = [];
  if (!title) missingFields.push('video_title');
  if (!fbCaption) missingFields.push('facebook.caption');
  if (!ytTitle) missingFields.push('youtube.title');
  if (!ytDescription) missingFields.push('youtube.description');

  let confidence = 95;
  if (missingFields.length > 0) {
    confidence = Math.max(30, 95 - missingFields.length * 20);
  }

  return {
    video_title: title,
    facebook: {
      caption: fbCaption || title,
      hashtags: Array.from(new Set(fbHashtags)),
    },
    instagram: {
      caption: fbCaption || title,
      hashtags: Array.from(new Set(fbHashtags)),
    },
    youtube: {
      title: ytTitle || title,
      description: ytDescription || fbCaption || title,
      hashtags: Array.from(new Set(ytHashtags)),
      tags: Array.from(new Set(ytTags)),
    },
    language: 'bn',
    confidence,
    needs_review: confidence < 80 || missingFields.length > 0,
    missing_fields: missingFields,
    parser_type: 'deterministic',
  };
}

/**
 * Validates and normalizes raw metadata response from Gemini
 */
export function validateAndNormalizeMetadata(raw: Partial<ParsedMetadata>): ParsedMetadata {
  const missingFields: string[] = [];

  const video_title = (raw.video_title || '').trim();
  if (!video_title) missingFields.push('video_title');

  const fbCaption = (raw.facebook?.caption || '').trim();
  if (!fbCaption) missingFields.push('facebook.caption');

  const ytTitle = (raw.youtube?.title || video_title).trim();
  if (!ytTitle) missingFields.push('youtube.title');

  const ytDesc = (raw.youtube?.description || fbCaption).trim();
  if (!ytDesc) missingFields.push('youtube.description');

  const fbHashtags = (raw.facebook?.hashtags || []).map(h => (h.startsWith('#') ? h : `#${h}`));
  const igHashtags = (raw.instagram?.hashtags || fbHashtags).map(h => (h.startsWith('#') ? h : `#${h}`));
  const ytHashtags = (raw.youtube?.hashtags || fbHashtags).map(h => (h.startsWith('#') ? h : `#${h}`));
  const ytTags = (raw.youtube?.tags || []).map(t => t.replace(/^#/, '').trim()).filter(Boolean);

  let confidence = typeof raw.confidence === 'number' ? raw.confidence : 90;
  if (missingFields.length > 0) {
    confidence = Math.min(confidence, 65);
  }

  const needsReview = Boolean(raw.needs_review || confidence < 80 || missingFields.length > 0);

  return {
    video_title: video_title || ytTitle || 'Shorts Video',
    facebook: {
      caption: fbCaption || video_title,
      hashtags: Array.from(new Set(fbHashtags)),
    },
    instagram: {
      caption: (raw.instagram?.caption || fbCaption || video_title).trim(),
      hashtags: Array.from(new Set(igHashtags)),
    },
    youtube: {
      title: ytTitle || video_title,
      description: ytDesc || fbCaption || video_title,
      hashtags: Array.from(new Set(ytHashtags)),
      tags: Array.from(new Set(ytTags)),
    },
    language: raw.language || 'bn',
    confidence,
    needs_review: needsReview,
    missing_fields: missingFields,
    parser_type: 'gemini',
    raw_gemini_response: raw.raw_gemini_response,
  };
}
