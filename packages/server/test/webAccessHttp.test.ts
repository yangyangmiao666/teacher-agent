import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import WebSocket from "ws";
import { ServiceCollection } from "@zcode/services";
import { createHttpServer } from "../src/http.js";

test("HTTP 和两种实时链路使用同一有效期，既有连接到期断开", async () => {
  const expiresAt = Date.now() + 1500;
  const server = createHttpServer(new ServiceCollection(), 0, {
    host: "127.0.0.1",
    authToken: "integration+/secret=",
    authRequired: true,
    authExpiresAt: expiresAt,
  });
  if (!server.listening) await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  const sockets: WebSocket[] = [];
  try {
    assert.equal((await fetch(`${base}/api/server-info`)).status, 401);
    assert.equal((await fetch(`${base}/api/server-info?token=wrong`)).status, 401);
    const login = await fetch(`${base}/api/test-access`, {
      method: "POST",
      headers: { Authorization: "Bearer integration+/secret=" },
    });
    assert.equal(login.status, 200);
    assert.ok(login.headers.get("set-cookie")?.includes("HttpOnly"));
    const granted = await fetch(`${base}/api/server-info?token=integration%2B%2Fsecret%3D`);
    assert.equal(granted.status, 200);
    const cookie = granted.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    assert.equal((await fetch(`${base}/api/server-info`, { headers: { cookie } })).status, 200);
    const plain = new WebSocket(`${base.replace("http", "ws")}/ws`, { headers: { cookie } });
    sockets.push(plain);
    await once(plain, "open");
    const capabilityResponse = await fetch(`${base}/api/rpc-host-capability`, {
      method: "POST",
      headers: { cookie },
    });
    const { capability } = (await capabilityResponse.json()) as { capability: string };
    const host = new WebSocket(`${base.replace("http", "ws")}/ws/host`, {
      headers: { cookie, "x-zcode-rpc-host-capability": capability },
    });
    sockets.push(host);
    await once(host, "open");
    const [plainClose, hostClose] = await Promise.all([once(plain, "close"), once(host, "close")]);
    assert.equal(plainClose[0], 4001);
    assert.equal(hostClose[0], 4001);
    assert.equal((await fetch(`${base}/api/server-info`, { headers: { cookie } })).status, 401);
  } finally {
    for (const socket of sockets) socket.terminate();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
