export type Maybe<T> = T | undefined;

export type AppProps = {
  OLLAMA_URL: string;
  TOKEN?: string;
  DEFAULT_MODEL?: Maybe<string>;
  DEFAULT_MODEL_VERSION?: Maybe<string>;
  FORCE_MODEL?: boolean;
  IS_STREAM: boolean;
  ALLOWED_IPS?: Maybe<string[]>;
  ALLOWED_CORS_ORIGINS?: Maybe<string[]>;
};
export type OllamaRoutesProps = {
  type: 'generate' | 'chat' | 'show' | 'embeddings';
  ollamaServerUrl: string;
  isStream: boolean;
  apiKey?: string;
  defaultModel?: Maybe<string>;
  defaultModelVersion?: Maybe<string>;
  forceModel?: boolean;
  ipAllowlist?: Maybe<string[]>;
};

export type DefaultModelEnforcer = {
  defaultModel?: string;
  defaultModelVersion?: string;
  forceModel: boolean;
};

export type ModelFileOptions = {
  num_keep?: number;
  seed?: number;
  num_predict?: number;
  top_k?: number;
  top_p?: number;
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
  penalize_newline: true;
  stop?: Array<string>;
  numa?: boolean;
  num_ctx?: number;
  num_batch?: number;
  num_gqa?: number;
  num_gpu?: number;
  main_gpu?: number;
  low_vram?: boolean;
  f16_kv?: boolean;
  vocab_only?: boolean;
  use_mmap?: boolean;
  use_mlock?: boolean;
  rope_frequency_base?: number;
  rope_frequency_scale?: number;
  num_thread?: number;
};

export type ModelTag = {
  name: string;
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

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: Maybe<string[]>;
};

export type GenerateRequest = {
  model: string;
  prompt?: string;
  raw?: boolean;
  stream?: boolean;
  format?: 'json';
  images?: Maybe<string[]>;
  options?: ModelFileOptions;
};

export type GenerateResponse = {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: Array<number>;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

export type ChatRequest = {
  model: string;
  messages: Array<Message>;
  format?: 'json';
  options?: ModelFileOptions;
  stream?: boolean;
  keep_alive?: string;
};

export type ChatResponse = {
  model: string;
  created_at: string;
  messages: Array<Message>;
  done: boolean;
  context?: Array<number>;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

export type TagsResponse = {
  models: Array<ModelTag>;
};

export type ModelInfoRequest = {
  name: string;
};
export type ModelInfoResponse = {
  modelfile: string;
  parameters: string;
  template: string;
  details: {
    format: string;
    family: string;
    families: Maybe<string[]>;
    parameter_size: string;
    quantization_level: string;
  };
};

export type EmbeddingsRequest = {
  model: string;
  prompt: string;
  options?: ModelFileOptions;
  keep_alive?: string;
};

export type EmbeddingsResponse = {
  embeddings: Array<number>;
};
