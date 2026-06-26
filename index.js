#!/usr/bin/env node
/**
 * postly-mcp — Postly Cloud 원격 MCP 서버용 stdio 브리지.
 *
 * Claude Desktop / Cursor 등 stdio MCP 클라이언트가 Postly Cloud 이메일 도구
 * (send_email / list_emails / get_email / embed_mailbox)를 쓸 수 있도록,
 * stdio JSON-RPC 메시지를 Postly 원격 MCP 엔드포인트(HTTPS)로 그대로 전달한다.
 *
 * 실제 도구 로직은 Postly 서버에 있으며, 이 브리지에는 비즈니스 로직이 없다.
 *
 * 환경변수:
 *   POSTLY_API_KEY   (필수)  Postly 시크릿 키 sk_live_...
 *   POSTLY_MCP_URL   (선택)  기본 https://postlycloud.com/api/mcp
 */
"use strict";

const API_KEY = process.env.POSTLY_API_KEY || "";
const MCP_URL = process.env.POSTLY_MCP_URL || "https://postlycloud.com/api/mcp";

if (!API_KEY) {
  process.stderr.write("[postly-mcp] POSTLY_API_KEY 환경변수가 필요합니다 (sk_live_...).\n");
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function forward(message) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_KEY,
    },
    body: JSON.stringify(message),
  });
  // 알림(notification, id 없음)은 응답 본문이 없을 수 있음
  if (res.status === 202 || res.headers.get("content-length") === "0") return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let buffer = "";
let pending = 0;
let ended = false;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    handleLine(line);
  }
});

// stdin 종료 시, 진행 중 요청을 모두 끝낸 뒤 종료
process.stdin.on("end", () => {
  ended = true;
  maybeExit();
});

function maybeExit() {
  if (ended && pending === 0) process.exit(0);
}

async function handleLine(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const isNotification = msg.id === undefined || msg.id === null;
  pending++;
  try {
    const reply = await forward(msg);
    if (reply && !isNotification) send(reply);
  } catch (e) {
    if (!isNotification) {
      send({
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32603, message: "postly-mcp bridge error: " + (e && e.message ? e.message : String(e)) },
      });
    }
  } finally {
    pending--;
    maybeExit();
  }
}
