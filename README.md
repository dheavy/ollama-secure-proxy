# OSP - Ollama Secure Proxy

OSP acts as a secure proxy for the Ollama inference server, enhancing the standard API with additional security features suitable for web-based LLM applications.

## About

While Ollama's default inference server (`api/generate`) is openly accessible, OSP adds crucial security layers to it, including CORS policy management, IP allow-listing, and access tokens. OSP handles API requests for generating completions, chatting, embedding generation, and displaying model information. Direct model manipulation (push, pull, delete) through OSP is not supported to enhance security.

## Installation

First, create a `.env` file based on the provided template:

```bash
cp .env.example .env
```

Update the `.env` file with the URL of your Ollama server:

```plaintext
OLLAMA_URL=http://localhost:11434
```

Install dependencies:

```bash
npm install
```

Execute tests:

```bash
npm run test
```

Build for deployment or start the development server:

```bash
npm run build    # Compiles to ./dist
npm run dev      # Starts development server
```

## Usage

### Setting Up Ollama

Start the Ollama server using:

```bash
ollama run <model>
```

### Configuring and Running OSP

1. **Environment Setup:**
   Set `OLLAMA_URL` to point to your running Ollama server. Configure the `TOKEN` for securing requests with an access token.

2. **Secure Requests:**
   Use the `x-osp-token` header for secure access:

```bash
curl -X POST http://localhost:3456/api/generate \
-H "Content-Type: application/json" \
-H "x-osp-token: secret" \
-d '{"model": "mistral:7b", "prompt": "Why is the sky blue?"}'
```

3. **IP Restriction:**
   Limit access by setting `ALLOWED_IPS` with a single IP or a list of IPs.

4. **CORS Configuration:**
   Restrict cross-origin requests by specifying allowed origins in `ALLOWED_CORS_ORIGINS`.

5. **Running OSP:**
   After configuration, build and run OSP to start handling requests securely.

### Advanced Options

- **Streaming Responses:**
  Toggle response streaming with `IS_STREAM`.

- **Model Enforcement:**
  Set a default model and version with `DEFAULT_MODEL` and `DEFAULT_MODEL_VERSION`, and enforce them using `FORCE_MODEL`.

## Contributing

Thank you for your interest in contributing to OSP! Here's how you can help:

1. **Issue Reporting:** Identify bugs or propose new features by creating an issue in our repository.

2. **Pull Requests:** Submit pull requests with bug fixes or new functionality. Ensure you adhere to our coding standards and include tests where applicable.

3. **Code Reviews:** Participate in code reviews to discuss and improve the codebase.

4. **Documentation:** Help us improve the documentation by suggesting changes or writing additional content.

Please read the CONTRIBUTING.md file for more details on our code of conduct and the process for submitting pull requests to us.

## License

MIT
