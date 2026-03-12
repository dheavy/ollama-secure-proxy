export type Maybe<T> = T | undefined;

// ---------------------------------------------------------------------------
// App & Route Configuration
// ---------------------------------------------------------------------------

export type AppProps = {
  OLLAMA_URL: string;
  TOKEN?: string;
  DEFAULT_MODEL?: Maybe<string>;
  DEFAULT_MODEL_VERSION?: Maybe<string>;
  FORCE_MODEL?: boolean;
  IS_STREAM: boolean;
  ALLOWED_IPS?: Maybe<string[]>;
  ALLOWED_CORS_ORIGINS?: Maybe<string[]>;
  TRUST_PROXY?: boolean;
  RATE_LIMIT_WINDOW_MS?: number;
  RATE_LIMIT_MAX?: number;
  BODY_SIZE_LIMIT?: string;
  REQUEST_TIMEOUT_MS?: number;
};

export type OllamaPostRouteType = 'generate' | 'chat' | 'show' | 'embed';
export type OllamaGetRouteType = 'tags' | 'ps' | 'version';

export type OllamaRoutesProps = {
  type: OllamaPostRouteType;
  ollamaServerUrl: string;
  isStream: boolean;
  apiKey?: string;
  defaultModel?: Maybe<string>;
  defaultModelVersion?: Maybe<string>;
  forceModel?: boolean;
  ipAllowlist?: Maybe<string[]>;
  requestTimeoutMs?: number;
};

export type OllamaGetRouteProps = {
  type: OllamaGetRouteType;
  ollamaServerUrl: string;
  apiKey?: string;
  ipAllowlist?: Maybe<string[]>;
  requestTimeoutMs?: number;
};

export type DefaultModelEnforcer = {
  defaultModel?: string;
  defaultModelVersion?: string;
  forceModel: boolean;
};

// ---------------------------------------------------------------------------
// Model Options
// ---------------------------------------------------------------------------

export type ModelFileOptions = {
  num_keep?: number;
  seed?: number;
  num_predict?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  tfs_z?: number;
  typical_p?: number;
  repeat_last_n?: number;
  temperature?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  penalize_newline?: boolean;
  stop?: Array<string>;
  numa?: boolean;
  num_ctx?: number;
  num_batch?: number;
  num_gpu?: number;
  main_gpu?: number;
  low_vram?: boolean;
  vocab_only?: boolean;
  use_mmap?: boolean;
  use_mlock?: boolean;
  num_thread?: number;
};

// ---------------------------------------------------------------------------
// Tool Calling
// ---------------------------------------------------------------------------

export type ToolFunction = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type Tool = {
  type: 'function';
  function: ToolFunction;
};

export type ToolCall = {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: Maybe<string[]>;
  tool_calls?: Maybe<ToolCall[]>;
  tool_name?: string;
  thinking?: string;
};

// ---------------------------------------------------------------------------
// /api/generate
// ---------------------------------------------------------------------------

export type GenerateRequest = {
  model: string;
  prompt?: string;
  suffix?: string;
  raw?: boolean;
  stream?: boolean;
  format?: 'json' | Record<string, unknown>;
  images?: Maybe<string[]>;
  options?: ModelFileOptions;
  system?: string;
  template?: string;
  keep_alive?: string | number;
  think?: boolean | 'high' | 'medium' | 'low';
  logprobs?: boolean;
  top_logprobs?: number;
};

export type GenerateResponse = {
  model: string;
  created_at: string;
  response: string;
  thinking?: string;
  done: boolean;
  done_reason?: string;
  context?: Array<number>;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  logprobs?: Array<Record<string, unknown>>;
};

// ---------------------------------------------------------------------------
// /api/chat
// ---------------------------------------------------------------------------

export type ChatRequest = {
  model: string;
  messages: Array<Message>;
  tools?: Array<Tool>;
  format?: 'json' | Record<string, unknown>;
  options?: ModelFileOptions;
  stream?: boolean;
  keep_alive?: string | number;
  think?: boolean | 'high' | 'medium' | 'low';
  logprobs?: boolean;
  top_logprobs?: number;
};

export type ChatResponse = {
  model: string;
  created_at: string;
  message: Message;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  logprobs?: Array<Record<string, unknown>>;
};

// ---------------------------------------------------------------------------
// /api/embed (replaces deprecated /api/embeddings)
// ---------------------------------------------------------------------------

export type EmbedRequest = {
  model: string;
  input: string | string[];
  truncate?: boolean;
  dimensions?: number;
  options?: ModelFileOptions;
  keep_alive?: string | number;
};

export type EmbedResponse = {
  model: string;
  embeddings: Array<Array<number>>;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
};

// ---------------------------------------------------------------------------
// /api/show
// ---------------------------------------------------------------------------

export type ModelInfoRequest = {
  model: string;
  name?: string;
  verbose?: boolean;
};

export type ModelInfoResponse = {
  modelfile: string;
  parameters: string;
  template: string;
  modified_at: string;
  details: {
    format: string;
    family: string;
    families: Maybe<string[]>;
    parameter_size: string;
    quantization_level: string;
  };
  capabilities?: string[];
  model_info?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// /api/tags
// ---------------------------------------------------------------------------

export type ModelTag = {
  name: string;
  model: string;
  remote_model?: string;
  remote_host?: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: Maybe<string[]>;
    parameter_size: string;
    quantization_level: string;
  };
};

export type TagsResponse = {
  models: Array<ModelTag>;
};

// ---------------------------------------------------------------------------
// /api/ps
// ---------------------------------------------------------------------------

export type RunningModel = {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: Maybe<string[]>;
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
  context_length?: number;
};

export type PsResponse = {
  models: Array<RunningModel>;
};

// ---------------------------------------------------------------------------
// /api/version
// ---------------------------------------------------------------------------

export type VersionResponse = {
  version: string;
};
