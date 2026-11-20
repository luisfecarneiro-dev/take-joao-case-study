import assert from "node:assert/strict";
import test from "node:test";

import { createReceiptJob } from "./receipt-job.mjs";

function claim(job, atMs = 0) {
    assert.equal(job.apply({ type: "claim", atMs }), true);
    return job.snapshot.attempt;
}

function send(job, attempt, atMs = 1) {
    assert.equal(job.apply({ type: "dispatch", attempt, atMs }), true);
}

test("acknowledgment records transport acceptance", () => {
    const job = createReceiptJob();
    const attempt = claim(job);
    send(job, attempt);
    assert.equal(job.apply({ type: "acknowledge", attempt, atMs: 2 }), true);
    assert.equal(job.snapshot.status, "accepted-by-transport");
    assert.equal(job.apply({ type: "acknowledge", attempt, atMs: 3 }), false);
});

test("an expired unsent claim frees the job for a new attempt", () => {
    const job = createReceiptJob();
    const first = claim(job);
    assert.equal(job.apply({ type: "expire", attempt: first, atMs: 4_999 }), false);
    assert.equal(job.apply({ type: "expire", attempt: first, atMs: 5_000 }), true);
    assert.equal(job.snapshot.status, "queued");
    assert.equal(claim(job, 5_001), first + 1);
});

test("a stale attempt does not dispatch or acknowledge a later claim", () => {
    const job = createReceiptJob();
    const first = claim(job);
    job.apply({ type: "expire", attempt: first, atMs: 5_000 });
    const second = claim(job, 5_001);
    assert.equal(job.apply({ type: "dispatch", attempt: first, atMs: 5_002 }), false);
    send(job, second, 5_003);
    assert.equal(job.apply({ type: "acknowledge", attempt: first, atMs: 5_004 }), false);
    assert.equal(job.apply({ type: "acknowledge", attempt: second, atMs: 5_005 }), true);
});

test("expiration during dispatch requires human review", () => {
    const job = createReceiptJob();
    const attempt = claim(job);
    send(job, attempt);
    assert.equal(job.apply({ type: "acknowledge", attempt, atMs: 5_000 }), false);
    assert.equal(job.apply({ type: "expire", attempt, atMs: 5_000 }), true);
    assert.equal(job.snapshot.status, "uncertain");
    assert.equal(job.apply({ type: "claim", atMs: 5_001 }), false);
    assert.equal(job.apply({ type: "acknowledge", attempt, atMs: 5_002 }), false);
});

test("a transport uncertainty report pauses the job before its lease expires", () => {
    const job = createReceiptJob();
    const attempt = claim(job);
    send(job, attempt);
    assert.equal(job.apply({ type: "report-uncertain", attempt: attempt + 1, atMs: 2 }), false);
    assert.equal(job.apply({ type: "report-uncertain", attempt, atMs: 2 }), true);
    assert.equal(job.snapshot.status, "uncertain");
    assert.equal(job.apply({ type: "claim", atMs: 3 }), false);
});

test("dispatch is rejected at the lease boundary", () => {
    const job = createReceiptJob();
    const attempt = claim(job);
    assert.equal(job.apply({ type: "dispatch", attempt, atMs: 5_000 }), false);
    assert.equal(job.snapshot.status, "claimed");
});

test("invalid timestamps and events do not change the job", () => {
    const job = createReceiptJob();
    const attempt = claim(job, 100);
    assert.equal(job.apply({ type: "dispatch", attempt, atMs: 99 }), false);
    assert.equal(job.apply({ type: "claim", atMs: 101 }), false);
    assert.throws(() => job.apply({ type: "dispatch", attempt, atMs: Infinity }), TypeError);
    assert.throws(() => job.apply({ type: "arbitrary", atMs: 102 }), TypeError);
    assert.equal(job.snapshot.status, "claimed");
});
