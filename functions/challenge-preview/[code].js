import { handleChallengePreviewRequest } from "./shared.js";

export async function onRequest(context) {
  return handleChallengePreviewRequest(new URL(context.request.url), context.params.code);
}
