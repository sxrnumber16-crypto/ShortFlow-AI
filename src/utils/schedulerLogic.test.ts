import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSlotTime,
  calculateBackoffMs,
  calculateNextPublishSlot,
} from './schedulerLogic.ts';

test('parseSlotTime parses valid hour and minute', () => {
  assert.deepEqual(parseSlotTime('14:30'), { hour: 14, minute: 30 });
  assert.deepEqual(parseSlotTime('09:05'), { hour: 9, minute: 5 });
});

test('calculateBackoffMs computes exponential increase capped at maximum', () => {
  assert.equal(calculateBackoffMs(1, 2, 60), 2 * 60 * 1000); // 2 mins
  assert.equal(calculateBackoffMs(2, 2, 60), 4 * 60 * 1000); // 4 mins
  assert.equal(calculateBackoffMs(3, 2, 60), 8 * 60 * 1000); // 8 mins
  assert.equal(calculateBackoffMs(10, 2, 60), 60 * 60 * 1000); // capped at 60 mins
});

test('calculateNextPublishSlot picks a valid upcoming future slot', () => {
  const baseTime = new Date('2026-10-20T06:00:00Z'); // 12:00 in Asia/Dhaka (UTC+6)
  const slots = ['14:00', '19:00', '22:00'];
  const nextSlotIso = calculateNextPublishSlot(baseTime, slots, [], 6);

  assert.ok(nextSlotIso);
  const nextDate = new Date(nextSlotIso);
  assert.ok(nextDate.getTime() > baseTime.getTime());
});
