import { handleChallengePreviewImageRequest, handleChallengePreviewRequest } from "./functions/challenge-preview/shared.js";

const challengePreviewPathPattern = /^\/challenge-preview\/([A-Za-z0-9]{6,32})$/u;
const challengePreviewImagePathPattern = /^\/challenge-preview\/([A-Za-z0-9]{6,32})\/image$/u;

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const matchedPreviewImagePath = requestUrl.pathname.match(challengePreviewImagePathPattern);
    const matchedPreviewPath = requestUrl.pathname.match(challengePreviewPathPattern);

    if (matchedPreviewImagePath) {
      return handleChallengePreviewImageRequest(requestUrl, matchedPreviewImagePath[1], env);
    }

    if (matchedPreviewPath) {
      return handleChallengePreviewRequest(requestUrl, matchedPreviewPath[1]);
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
