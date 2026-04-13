import { handleChallengePreviewImageRequest } from "../shared.js";

export async function onRequest(context) {
  return handleChallengePreviewImageRequest(new URL(context.request.url), context.params.code);
}
