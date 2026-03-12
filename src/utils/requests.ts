import { OllamaPostRouteType, DefaultModelEnforcer } from '../types';

const STREAMABLE_TYPES: OllamaPostRouteType[] = ['generate', 'chat'];

/**
 * Build the final request body to send to the Ollama API.
 * If a model enforcer is provided, the default model and default model version
 * are overriding the body's model and model version.
 * The `stream` flag is only injected for endpoint types that support streaming.
 */
export function buildFinalBody(
  body: Record<string, unknown>,
  type: OllamaPostRouteType,
  isStream: boolean = false,
  modelEnforcer?: DefaultModelEnforcer
): string {
  const supportsStream = STREAMABLE_TYPES.includes(type);

  const base: Record<string, unknown> = { ...body };

  if (supportsStream) {
    base.stream = isStream;
  }

  if (
    modelEnforcer?.forceModel &&
    modelEnforcer.defaultModel &&
    modelEnforcer.defaultModelVersion
  ) {
    base.model = modelEnforcer.defaultModel;
    base.model_version = modelEnforcer.defaultModelVersion;
  }

  return JSON.stringify(base);
}
