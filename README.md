# OSP - Ollama Secure Proxy

OSP is a security-hardened reverse proxy for the [Ollama](https://ollama.com) inference server. It wraps Ollama's API with authentication, authorization, rate limiting, and request validation — making it safe to expose to client-side applications.

## Why

Ollama's built-in API server has no authentication. Anyone who can reach the port can run inference, list models, or pull new ones. OSP sits in front of Ollama and only exposes a controlled subset of endpoints (`generate`, `chat`, `embed`, `show`, `tags`, `ps`, `version`) with multiple layers of protection. Destructive operations (push, pull, delete, create, copy) are not proxied.

## Features

- **API key authentication** — require an `x-osp-token` header on every request
- **IP allowlisting** — restrict access to specific client IPs
- **CORS policy** — control which origins can call the API
- **Rate limiting** — prevent brute force and denial-of-service attacks
- **Request body size limits** — guard against oversized payloads
- **Request timeouts** — abort long-running inference calls that hang
- **Input validation** — reject malformed requests before they reach Ollama
- **Model enforcement** — optionally lock all requests to a single model
- **Streaming support** — toggle between streaming and JSON responses
- **Audit logging** — structured logs for auth failures and proxied requests with sensitive header redaction
- **Reverse proxy support** — `trust proxy` mode for correct IP resolution behind load balancers

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/dheavy/ollama-secure-proxy.git
cd ollama-secure-proxy
npm install

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set OLLAMA_URL

# 3. Run
npm run dev        # development (ts-node + nodemon)
npm run build      # compile to ./dist
npm start          # production (runs ./dist/server.js)
```

## Configuration

All configuration is done via environment variables (or a `.env` file).

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port OSP listens on |
| `OLLAMA_URL` | — | **Required.** URL of the Ollama server (e.g. `http://localhost:11434`) |
| `TOKEN` | — | API key clients must send in the `x-osp-token` header. If unset, auth is disabled. |
| `ALLOWED_IPS` | — | Comma-separated IP allowlist (e.g. `127.0.0.1,10.0.0.5`). If unset, all IPs are allowed. |
| `ALLOWED_CORS_ORIGINS` | — | Comma-separated allowed origins (e.g. `https://app.example.com`). If unset, all origins are allowed. |
| `DEFAULT_MODEL` | — | Default model name to use when not specified in the request |
| `DEFAULT_MODEL_VERSION` | — | Default model version |
| `FORCE_MODEL` | `false` | When `true`, overrides the model in every request with `DEFAULT_MODEL` |
| `IS_STREAM` | `false` | When `true`, streams responses from Ollama instead of buffering |
| `TRUST_PROXY` | `false` | Set to `true` when behind a reverse proxy so `req.ip` reads `X-Forwarded-For` |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in milliseconds (default: 15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per window per IP |
| `BODY_SIZE_LIMIT` | `10mb` | Maximum request body size |
| `REQUEST_TIMEOUT_MS` | `300000` | Timeout for requests to Ollama in milliseconds (default: 5 minutes) |

## Usage

### Start Ollama

```bash
ollama run mistral:7b
```

### Send requests through OSP

**Without authentication:**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral:7b", "prompt": "Why is the sky blue?"}'
```

**With API key:**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "x-osp-token: your-secret-token" \
  -d '{"model": "mistral:7b", "prompt": "Why is the sky blue?"}'
```

**Chat with tool calling:**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b",
    "messages": [{"role": "user", "content": "What is the weather?"}],
    "tools": [{"type": "function", "function": {"name": "get_weather", "description": "Get weather", "parameters": {"type": "object", "properties": {"location": {"type": "string"}}}}}]
  }'
```

**Generate embeddings:**

```bash
curl -X POST http://localhost:3000/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "input": ["hello", "world"]}'
```

**List available models:**

```bash
curl http://localhost:3000/api/tags
```

**List running models:**

```bash
curl http://localhost:3000/api/ps
```

### Supported endpoints

**POST routes** (inference & model info):

| Endpoint | Required fields | Notes |
|----------|----------------|-------|
| `POST /api/generate` | `model` | Text completion. Supports `think`, `format`, `tools`, `logprobs`. |
| `POST /api/chat` | `model`, `messages` | Chat completion. Supports `tools`, `think`, `format`, `logprobs`. |
| `POST /api/embed` | `model`, `input` | Generate embeddings. `input` can be a string or array of strings. |
| `POST /api/show` | `name` or `model` | Model information. Supports `verbose` flag. |
| `POST /api/embeddings` | — | **Deprecated.** Redirects (307) to `/api/embed`. |

**GET routes** (read-only):

| Endpoint | Description |
|----------|-------------|
| `GET /api/tags` | List locally available models |
| `GET /api/ps` | List currently running/loaded models |
| `GET /api/version` | Get Ollama server version |
| `GET /` | Health check (returns 200) |

All endpoints enforce API key authentication, IP allowlisting, and rate limiting when configured.

### Response codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthorized — bad or missing API key / IP not allowed |
| `429` | Too many requests — rate limit exceeded |
| `307` | Redirect — `/api/embeddings` → `/api/embed` |
| `504` | Gateway timeout — Ollama didn't respond in time |

## Development

```bash
npm run dev          # Start with hot reload
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint with ESLint
npm run build        # Compile TypeScript to ./dist
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues, submitting pull requests, and coding standards.

## License

MIT
