import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanStructuralLabel,
  extractHashtags,
  extractSeoTags,
  parseMuseAiMessagesDeterministically,
  validateAndNormalizeMetadata,
} from './parserLogic.ts';

test('cleanStructuralLabel removes label prefix while keeping content', () => {
  assert.equal(
    cleanStructuralLabel('TITLE: Juicy Tomahawk Steak', 'TITLE'),
    'Juicy Tomahawk Steak'
  );
  assert.equal(
    cleanStructuralLabel('CAPTION: This is a great video 🔥', 'CAPTION'),
    'This is a great video 🔥'
  );
});

test('extractHashtags extracts hashtags correctly', () => {
  const text = 'Check this out #animation #food #foodanimation #food';
  const tags = extractHashtags(text);
  assert.deepEqual(tags, ['#animation', '#food', '#foodanimation']);
});

test('extractSeoTags extracts comma-separated tags without hash prefix', () => {
  const text = 'TAGS: tomahawk steak, honey chili glaze, food animation';
  const tags = extractSeoTags(text);
  assert.deepEqual(tags, ['tomahawk steak', 'honey chili glaze', 'food animation']);
});

test('parseMuseAiMessagesDeterministically parses sample Muse AI message', () => {
  const sampleMuseText = `
📘 FB / Instagram
Title: Juicy Tomahawk Steak with Honey-Chili Glaze
Caption: This giant tomahawk steak just got a sweet honey-chili twist...
Hashtags: #animation #food #foodanimation

📺 YouTube SEO
TITLE: Juicy Tomahawk Steak with Honey-Chili Glaze
DESCRIPTION: Discover this delicious animated food creation with secret spices...
TAGS: tomahawk steak, honey chili glaze, food animation
`;

  const parsed = parseMuseAiMessagesDeterministically(sampleMuseText);
  assert.equal(parsed.video_title, 'Juicy Tomahawk Steak with Honey-Chili Glaze');
  assert.equal(parsed.facebook.caption, 'This giant tomahawk steak just got a sweet honey-chili twist...');
  assert.ok(parsed.facebook.hashtags.includes('#animation'));
  assert.equal(parsed.youtube.title, 'Juicy Tomahawk Steak with Honey-Chili Glaze');
  assert.ok(parsed.youtube.tags.includes('tomahawk steak'));
  assert.equal(parsed.confidence >= 80, true);
  assert.equal(parsed.needs_review, false);
});

test('validateAndNormalizeMetadata flags missing fields and low confidence', () => {
  const incomplete = validateAndNormalizeMetadata({
    video_title: '',
    facebook: { caption: '', hashtags: [] },
  });
  assert.equal(incomplete.needs_review, true);
  assert.ok(incomplete.missing_fields.includes('video_title'));
});
