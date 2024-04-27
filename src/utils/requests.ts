import { Maybe, GenerateRequest, DefaultModelEnforcer } from '../types';

/**
 * Build the final request body to send to the Ollama API.
 * If a model enforcer is provided, the default model and default model version are overriding the body's model and model version.
 *
 * @param body  The request body.
 * @param isStream
 * @param modelEnforcer
 * @returns
 */
export function buildFinalBody(
  body: GenerateRequest,
  isStream: boolean = false,
  modelEnforcer?: DefaultModelEnforcer
): string {
  if (
    modelEnforcer?.forceModel &&
    modelEnforcer.defaultModel &&
    modelEnforcer.defaultModelVersion
  ) {
    return JSON.stringify({
      ...body,
      model: modelEnforcer.defaultModel,
      model_version: modelEnforcer.defaultModelVersion,
      stream: isStream,
    });
  }

  return JSON.stringify({
    ...body,
    stream: isStream,
  });
}
