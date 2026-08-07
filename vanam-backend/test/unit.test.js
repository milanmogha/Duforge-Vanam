// test/unit.test.js — pure unit tests (no DB, no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { escapeRegex, timingSafeEqualStr, razorpaySignatureValid, razorpayWebhookValid } from '../utils/security.js';
import { rateLimit } from '../utils/rateLimit.js';

test('escapeRegex neutralises ReDoS metacharacters', () => {
  assert.equal(escapeRegex('(.*+)+'), '\\(\\.\\*\\+\\)\\+');
  assert.equal(escapeRegex('walnut'), 'walnut');
  // Escaped output used in a RegExp must match the literal string, not act as a pattern.
  const re = new RegExp(escapeRegex('a.b'), 'i');
  assert.ok(re.test('a.b'));
  assert.ok(!re.test('axb'));
});

test('timingSafeEqualStr compares correctly and length-safely', () => {
  assert.ok(timingSafeEqualStr('abc', 'abc'));
  assert.ok(!timingSafeEqualStr('abc', 'abd'));
  assert.ok(!timingSafeEqualStr('abc', 'abcd')); // different lengths
});

test('razorpaySignatureValid accepts a correct signature and rejects tampering', () => {
  const secret = 'test_secret';
  const orderId = 'order_123';
  const paymentId = 'pay_456';
  const good = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  assert.ok(razorpaySignatureValid(orderId, paymentId, good, secret));
  assert.ok(!razorpaySignatureValid(orderId, paymentId, good, 'wrong_secret'));
  assert.ok(!razorpaySignatureValid(orderId, 'pay_TAMPERED', good, secret));
  assert.ok(!razorpaySignatureValid(orderId, paymentId, 'deadbeef', secret));
  assert.ok(!razorpaySignatureValid('', '', '', secret)); // missing params
});

test('razorpayWebhookValid verifies against the raw body', () => {
  const secret = 'wh_secret';
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
  const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  assert.ok(razorpayWebhookValid(raw, sig, secret));
  assert.ok(!razorpayWebhookValid(Buffer.from('{"event":"forged"}'), sig, secret));
  assert.ok(!razorpayWebhookValid(raw, sig, 'other'));
});

test('rateLimit allows up to max then returns 429', () => {
  const mw = rateLimit({ windowMs: 1000, max: 3, bucket: 'test' });
  let status = 200;
  const res = {
    setHeader() {},
    status(c) { status = c; return this; },
    json() { return this; },
  };
  const req = { ip: '1.2.3.4' };
  let nextCalls = 0;
  const next = () => { nextCalls++; };
  for (let i = 0; i < 3; i++) { status = 200; mw(req, res, next); }
  assert.equal(nextCalls, 3);
  status = 200;
  mw(req, res, next); // 4th → blocked
  assert.equal(status, 429);
  assert.equal(nextCalls, 3); // next not called on block
});
