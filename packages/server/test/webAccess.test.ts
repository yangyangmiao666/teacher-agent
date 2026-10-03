import assert from "node:assert/strict";
import { test } from "node:test";
import { createWebAccessPolicy, parseAccessExpiry } from "../src/webAccess.js";

test("凭据在绝对到期时失效，编码 cookie 与 bearer 一致", () => {
  let now = 1000;
  const policy = createWebAccessPolicy("test+/secret=", 2000, () => now);
  assert.equal(policy.authorize({ query: "wrong" }), false);
  assert.equal(policy.authorize({}), false);
  assert.equal(policy.authorize({ query: "test+/secret=" }), true);
  assert.equal(policy.authorize({ cookie: "zcode_lite_token=test%2B%2Fsecret%3D" }), true);
  assert.equal(policy.authorize({ authorization: "Bearer test+/secret=" }), true);
  assert.equal(policy.authorize({ cookie: "zcode_lite_token=%zz" }), false);
  now = 2000;
  assert.equal(policy.authorize({ query: "test+/secret=" }), false);
});

test("无凭据的本地开发保持兼容，非法有效期拒绝启动", () => {
  assert.equal(createWebAccessPolicy(undefined).authorize({}), true);
  assert.equal(parseAccessExpiry(undefined), undefined);
  assert.throws(() => parseAccessExpiry("tomorrow"), /ISO/);
  assert.throws(() => parseAccessExpiry("2026-10-03"), /ISO/);
  assert.throws(() => parseAccessExpiry("2026-02-30T00:00:00Z"), /ISO/);
  assert.throws(() => createWebAccessPolicy(undefined, 1234), /token/);
  assert.equal(parseAccessExpiry("2026-11-03T00:00:00.000Z"), 1793664000000);
});

test("30 天有效期不会立即触发 Node 定时器溢出，到期事件只通知一次", async () => {
  const farFuture = createWebAccessPolicy("secret", Date.now() + 30 * 86400000);
  let premature = false;
  const disposeFuture = farFuture.onExpired(() => {
    premature = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  disposeFuture();
  assert.equal(premature, false);
  const soon = createWebAccessPolicy("secret", Date.now() + 20);
  await new Promise<void>((resolve) => {
    const dispose = soon.onExpired(() => {
      dispose();
      resolve();
    });
  });
  assert.equal(soon.authorize({ query: "secret" }), false);
});
