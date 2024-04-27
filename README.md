# ollama-secured-proxy

An Ollama inference server proxy, with similar API signature and added security functionalities.

## About

Ollama provides its own inference server with an API endpoint `api/generate` on open access. We use it in Ask Ginetta, served from a GPU server on Fly.io, but inaccessible outside of Fly's internal network. This proxy makes it accessible with an added security layer on top.
