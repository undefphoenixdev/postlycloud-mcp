# postly-mcp

[Postly Cloud](https://postlycloud.com) 이메일을 AI 도구(Claude 등)에서 바로 쓰게 해주는 **MCP 커넥터**입니다.

내 도메인으로 메일을 보내고, 받은 메일을 읽고, **내 메일함을 내 웹사이트에 임베드**하는 코드까지 AI가 만들어 줍니다.

## 제공 도구

| 도구 | 설명 |
|------|------|
| `send_email` | 내 인증 도메인에서 이메일 발송 |
| `list_emails` | 받은/보낸 메일 목록 조회 |
| `get_email` | 메일 1건 상세 보기 |
| `embed_mailbox` | 메일함을 내 사이트에 임베드하는 iframe 코드 생성 |

## 사전 준비

[Postly Cloud 대시보드 → 개발자](https://postlycloud.com/dashboard/developers)에서 **시크릿 키**(`sk_live_...`)를 발급받으세요.

## 설치 — 방법 1) 원격 MCP (가장 쉬움, 설치 불필요)

Postly MCP는 원격 HTTP 서버라 패키지 설치 없이 URL만으로 연결됩니다.

```bash
claude mcp add --transport http postly https://postlycloud.com/api/mcp \
  --header "Authorization: Bearer sk_live_여기에_키"
```

## 설치 — 방법 2) 이 커넥터(stdio)

stdio MCP만 지원하는 클라이언트거나 `npx`로 쓰고 싶을 때:

```bash
claude mcp add postly -e POSTLY_API_KEY=sk_live_여기에_키 -- npx -y postly-mcp
```

또는 MCP 설정 파일에 직접:

```json
{
  "mcpServers": {
    "postly": {
      "command": "npx",
      "args": ["-y", "postly-mcp"],
      "env": { "POSTLY_API_KEY": "sk_live_여기에_키" }
    }
  }
}
```

npm 미게시 상태에서도 GitHub에서 바로 실행할 수 있습니다:

```json
{ "command": "npx", "args": ["-y", "github:undefphoenixdev/postly-mcp"],
  "env": { "POSTLY_API_KEY": "sk_live_..." } }
```

## 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `POSTLY_API_KEY` | ✓ | Postly 시크릿 키 `sk_live_...` |
| `POSTLY_MCP_URL` | | 기본 `https://postlycloud.com/api/mcp` |

## 동작 방식

이 패키지는 **stdio ↔ Postly 원격 MCP(HTTPS)** 를 잇는 얇은 브리지입니다. 비즈니스 로직은 전부 Postly 서버에 있고, 여기에는 전달 코드만 있습니다. 그래서 안전하게 오픈소스로 공개합니다.

## 예시 프롬프트

- "내 Postly 메일함을 내 홈페이지에 넣어줘" → `embed_mailbox`
- "어제 받은 문의 정리해서 hello@mybiz.co.kr 로 요약 보내줘" → `list_emails` + `send_email`

## 문서

전체 API·MCP·임베드 문서: https://postlycloud.com/docs

## 라이선스

MIT
