const SUPABASE_URL = "https://nppaqezqwusbagzdnoqi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcGFxZXpxd3VzYmFnemRub3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTU5MzIsImV4cCI6MjA5MDQzMTkzMn0.cVnznT2P0sOoX6nA9mCLLNtIID5m2I1LW8N36FY9iqA";
const DEFAULT_TITLE = "두근두근! 도전장이 왔어요 💌";
const DEFAULT_DESCRIPTION = "Japanote에서 이미지로 재밌게 배워봐요!";
const DEFAULT_CHALLENGE_PROMPT = "도전장을 받아줘!";
const DEFAULT_SITE_NAME = "Japanote";
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;
const CHALLENGE_PREVIEW_ILLUSTRATION_PATH = "/assets/images/social-preview-traced-quantized.svg";

/** Twemoji SVG paths (viewBox 0 0 36 36) — CC-BY 4.0 Twitter/Twemoji; 인라인이면 카카오 og 이미지 래스터에도 안정적 */
const TWEMOJI_INNER = {
  sparkles:
    '<path fill="#FFAC33" d="M34.347 16.893l-8.899-3.294-3.323-10.891c-.128-.42-.517-.708-.956-.708-.439 0-.828.288-.956.708l-3.322 10.891-8.9 3.294c-.393.146-.653.519-.653.938 0 .418.26.793.653.938l8.895 3.293 3.324 11.223c.126.424.516.715.959.715.442 0 .833-.291.959-.716l3.324-11.223 8.896-3.293c.391-.144.652-.518.652-.937 0-.418-.261-.792-.653-.938z"/><path fill="#FFCC4D" d="M14.347 27.894l-2.314-.856-.9-3.3c-.118-.436-.513-.738-.964-.738-.451 0-.846.302-.965.737l-.9 3.3-2.313.856c-.393.145-.653.52-.653.938 0 .418.26.793.653.938l2.301.853.907 3.622c.112.444.511.756.97.756.459 0 .858-.312.97-.757l.907-3.622 2.301-.853c.393-.144.653-.519.653-.937 0-.418-.26-.793-.653-.937zM10.009 6.231l-2.364-.875-.876-2.365c-.145-.393-.519-.653-.938-.653-.418 0-.792.26-.938.653l-.875 2.365-2.365.875c-.393.146-.653.52-.653.938 0 .418.26.793.653.938l2.365.875.875 2.365c.146.393.52.653.938.653.418 0 .792-.26.938-.653l.875-2.365 2.365-.875c.393-.146.653-.52.653-.938 0-.418-.26-.792-.653-.938z"/>',
  crown:
    '<path fill="#F4900C" d="M14.174 17.075L6.75 7.594l-3.722 9.481z"/><path fill="#F4900C" d="M17.938 5.534l-6.563 12.389H24.5z"/><path fill="#F4900C" d="M21.826 17.075l7.424-9.481 3.722 9.481z"/><path fill="#FFCC4D" d="M28.669 15.19L23.887 3.523l-5.88 11.668-.007.003-.007-.004-5.88-11.668L7.331 15.19C4.197 10.833 1.28 8.042 1.28 8.042S3 20.75 3 33h30c0-12.25 1.72-24.958 1.72-24.958s-2.917 2.791-6.051 7.148z"/><circle fill="#5C913B" cx="17.957" cy="22" r="3.688"/><circle fill="#981CEB" cx="26.463" cy="22" r="2.412"/><circle fill="#DD2E44" cx="32.852" cy="22" r="1.986"/><circle fill="#981CEB" cx="9.45" cy="22" r="2.412"/><circle fill="#DD2E44" cx="3.061" cy="22" r="1.986"/><path fill="#FFAC33" d="M33 34H3c-.552 0-1-.447-1-1s.448-1 1-1h30c.553 0 1 .447 1 1s-.447 1-1 1zm0-3.486H3c-.552 0-1-.447-1-1s.448-1 1-1h30c.553 0 1 .447 1 1s-.447 1-1 1z"/><circle fill="#FFCC4D" cx="1.447" cy="8.042" r="1.407"/><circle fill="#F4900C" cx="6.75" cy="7.594" r="1.192"/><circle fill="#FFCC4D" cx="12.113" cy="3.523" r="1.784"/><circle fill="#FFCC4D" cx="34.553" cy="8.042" r="1.407"/><circle fill="#F4900C" cx="29.25" cy="7.594" r="1.192"/><circle fill="#FFCC4D" cx="23.887" cy="3.523" r="1.784"/><circle fill="#F4900C" cx="17.938" cy="5.534" r="1.784"/>',
  muscle:
    '<path fill="#EF9645" d="M15.977 9.36h3.789c.114-.191.147-.439.058-.673l-3.846-4.705V9.36z"/><path fill="#FFDC5D" d="M12.804 22.277c-.057-.349-.124-.679-.206-.973-.62-2.223-1.14-3.164-.918-5.494.29-1.584.273-4.763 4.483-4.268 1.112.131 2.843.927 3.834.91.567-.01.98-1.157 1.017-1.539.051-.526-.865-1.42-1.248-1.554-.383-.134-2.012-.631-2.681-.824-1.039-.301-.985-1.705-1.051-2.205-.031-.235.084-.467.294-.591.21-.124.375-.008.579.125l.885.648c.497.426-.874 1.24-.503 1.376 0 0 1.755.659 2.507.796.412.075 1.834-1.529 1.917-2.47.065-.74-3.398-4.083-5.867-5.381-.868-.456-1.377-.721-1.949-.694-.683.032-.898.302-1.748 1.03C8.302 4.46 4.568 11.577 4.02 13.152c-2.246 6.461-2.597 9.865-2.677 11.788-.049.59-.076 1.177-.076 1.758.065 0-1 5 0 6s5.326 1 5.326 1c10 3.989 28.57 2.948 28.57-7.233 0-12.172-18.813-10.557-22.359-4.188z"/><path fill="#EF9645" d="M20.63 32.078c-3.16-.332-5.628-1.881-5.767-1.97-.465-.297-.601-.913-.305-1.379s.913-.603 1.38-.308c.04.025 4.003 2.492 7.846 1.467 2.125-.566 3.867-2.115 5.177-4.601.258-.49.866-.676 1.351-.419.488.257.676.862.419 1.351-1.585 3.006-3.754 4.893-6.447 5.606-1.257.332-2.502.374-3.654.253z"/>',
  seedling:
    '<path fill="#77B255" d="M22.911 14.398c-1.082.719-2.047 1.559-2.88 2.422-.127-4.245-1.147-9.735-6.772-12.423C12.146-1.658-.833 1.418.328 2.006c2.314 1.17 3.545 4.148 5.034 5.715 2.653 2.792 5.603 2.964 7.071.778 3.468 2.254 3.696 6.529 3.59 11.099-.012.505-.023.975-.023 1.402v14c0 1.104 4 1.104 4 0V23.51c.542-.954 2.122-3.505 4.43-5.294 1.586 1.393 4.142.948 6.463-1.495 1.489-1.567 2.293-4.544 4.607-5.715 1.221-.618-12.801-3.994-12.589 3.392z"/>',
  victory:
    '<path fill="#EF9645" d="M26.992 19.016c-.255-.255-.553-.47-.875-.636l-.4-1.356-8.012-.056-.307 1.091c-.467.095-1.041.389-1.393.718l-3.611-3.954c-.817.364-1.389 1.18-1.389 2.133v.96l-4 4.166.016 2.188 9.984 10.729s10.518-15.288 10.543-15.258c-.127-.224-.511-.703-.556-.725z"/><g fill="#FFDC5D"><path d="M24.581 18H18c-.208 0-.411.021-.607.061l-.073-.278-3.273-12.464s-.416-1.957 1.54-2.372c1.956-.416 2.372 1.54 2.372 1.54l3.097 11.569c.446.024.878.063 1.305.107l2.061-10.512s.188-1.991 2.18-1.804c1.991.188 1.803 2.179 1.803 2.179L26.34 17.187l-.221 1.194c-.464-.235-.982-.381-1.538-.381zM8.916 16h.168c1.059 0 1.916.858 1.916 1.917v4.166C11 23.142 10.143 24 9.084 24h-.168C7.857 24 7 23.142 7 22.083v-4.166C7 16.858 7.857 16 8.916 16zm6.918 2.96l-.056.062C15.304 19.551 15 20.233 15 21c0 .063.013.123.018.185.044.678.308 1.292.728 1.774-.071.129-.163.243-.259.353-.366.417-.89.688-1.487.688-1.104 0-2-.896-2-2v-6c0-.441.147-.845.389-1.176.364-.497.947-.824 1.611-.824 1.104 0 2 .896 2 2v2.778c-.061.055-.109.123-.166.182z"/><path d="M9.062 25c1.024 0 1.925-.526 2.45-1.322.123.183.271.346.431.497 1.185 1.115 3.034 1.044 4.167-.086.152-.152.303-.305.419-.488l-.003-.003C16.727 23.713 17 24 18 24h2.537c-.37.279-.708.623-1.024 1-1.228 1.467-2.013 3.606-2.013 6 0 .276.224.5.5.5s.5-.224.5-.5c0-2.548.956-4.775 2.377-6 .732-.631 1.584-1 2.498-1 .713.079.847-1 .125-1H18c-1.104 0-2-.896-2-2s.896-2 2-2h8c.858 0 1.66.596 1.913 1.415L29 24c.103.335.479 1.871.411 2.191C29.411 31 24.715 36 19 36c-6.537 0-11.844-5.231-11.986-11.734l.014.01c.515.445 1.176.724 1.91.724h.124z"/></g>',
  wave:
    '<path fill="#EF9645" d="M4.861 9.147c.94-.657 2.357-.531 3.201.166l-.968-1.407c-.779-1.111-.5-2.313.612-3.093 1.112-.777 4.263 1.312 4.263 1.312-.786-1.122-.639-2.544.483-3.331 1.122-.784 2.67-.513 3.456.611l10.42 14.72L25 31l-11.083-4.042L4.25 12.625c-.793-1.129-.519-2.686.611-3.478z"/><path fill="#FFDC5D" d="M2.695 17.336s-1.132-1.65.519-2.781c1.649-1.131 2.78.518 2.78.518l5.251 7.658c.181-.302.379-.6.6-.894L4.557 11.21s-1.131-1.649.519-2.78c1.649-1.131 2.78.518 2.78.518l6.855 9.997c.255-.208.516-.417.785-.622L7.549 6.732s-1.131-1.649.519-2.78c1.649-1.131 2.78.518 2.78.518l7.947 11.589c.292-.179.581-.334.871-.498L12.238 4.729s-1.131-1.649.518-2.78c1.649-1.131 2.78.518 2.78.518l7.854 11.454 1.194 1.742c-4.948 3.394-5.419 9.779-2.592 13.902.565.825 1.39.26 1.39.26-3.393-4.949-2.357-10.51 2.592-13.903L24.515 8.62s-.545-1.924 1.378-2.47c1.924-.545 2.47 1.379 2.47 1.379l1.685 5.004c.668 1.984 1.379 3.961 2.32 5.831 2.657 5.28 1.07 11.842-3.94 15.279-5.465 3.747-12.936 2.354-16.684-3.11L2.695 17.336z"/><g fill="#5DADEC"><path d="M12 32.042C8 32.042 3.958 28 3.958 24c0-.553-.405-1-.958-1s-1.042.447-1.042 1C1.958 30 6 34.042 12 34.042c.553 0 1-.489 1-1.042s-.447-.958-1-.958z"/><path d="M7 34c-3 0-5-2-5-5 0-.553-.447-1-1-1s-1 .447-1 1c0 4 3 7 7 7 .553 0 1-.447 1-1s-.447-1-1-1zM24 2c-.552 0-1 .448-1 1s.448 1 1 1c4 0 8 3.589 8 8 0 .552.448 1 1 1s1-.448 1-1c0-5.514-4-10-10-10z"/><path d="M29 .042c-.552 0-1 .406-1 .958s.448 1.042 1 1.042c3 0 4.958 2.225 4.958 4.958 0 .552.489 1 1.042 1s.958-.448.958-1C35.958 3.163 33 .042 29 .042z"/></g>'
};

const PREVIEW_SCORE_EMOJI_CHAR = {
  crown: "\u{1F451}",
  sparkles: "\u2728",
  muscle: "\u{1F4AA}",
  seedling: "\u{1F331}",
  wave: "\u{1F44B}",
  victory: "\u270C\uFE0F"
};

let challengePreviewIllustrationHrefPromise = null;

function estimateTextWidthPx(text, fontSizePx) {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c < 128) {
      w += /[0-9]/.test(ch) ? fontSizePx * 0.42 : fontSizePx * 0.48;
    } else {
      w += fontSizePx * 0.9;
    }
  }
  return Math.ceil(w);
}

function svgTwemojiGroup(key, x, y, sizePx) {
  const inner = TWEMOJI_INNER[key];
  if (!inner) return "";
  const s = sizePx / 36;
  return `<g transform="translate(${x},${y}) scale(${s})">${inner}</g>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,32}$/u.test(code);
}

function isValidTargetPath(targetPath) {
  if (targetPath === "/") return true;
  return /^\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+(?:\.html)?$/u.test(targetPath);
}

function readResultSummary(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.sr) && payload.sr.length >= 3) {
    const total = Number(payload.sr[0]);
    const correct = Number(payload.sr[1]);
    const wrong = Number(payload.sr[2]);
    if (Number.isFinite(total) && Number.isFinite(correct) && Number.isFinite(wrong) && total > 0) {
      return { total, correct, wrong };
    }
  }
  const sourceResult = payload.sourceResult;
  if (sourceResult && typeof sourceResult === "object") {
    const total = Number(sourceResult.total);
    const correct = Number(sourceResult.correct);
    const wrong = Number(sourceResult.wrong);
    if (Number.isFinite(total) && Number.isFinite(correct) && Number.isFinite(wrong) && total > 0) {
      return { total, correct, wrong };
    }
  }
  return null;
}

function readTargetOrigin(payload, requestUrl) {
  const payloadOrigin = normalizeText(payload?.targetOrigin || payload?.o);
  if (payloadOrigin && /^https?:\/\/[^/]+$/u.test(payloadOrigin)) return payloadOrigin.replace(/\/+$/u, "");
  return requestUrl.origin;
}

function readTargetPath(payload) {
  const path = normalizeText(payload?.targetPath || payload?.p);
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function readTargetHash(payload) {
  return normalizeText(payload?.targetHash || payload?.h);
}

function buildTargetUrl(code, origin, path, hash) {
  const url = new URL(path, origin);
  url.searchParams.set("c", code);
  if (hash) url.hash = hash;
  return url.toString();
}

function buildPreviewText(payload) {
  const summary = readResultSummary(payload);

  if (summary) {
    const { correct, total } = summary;
    const ratio = correct / total;
    const scoreMain = `${correct}개 맞혔어요!`;
    let scoreEmojiKey = "sparkles";
    let descriptionLines = ["대단해요! 감을 제대로 잡으신 것 같아요."];

    if (ratio >= 0.9) {
      scoreEmojiKey = "crown";
      descriptionLines = ["우와, 완벽해요! 혹시 천재 아니신가요?"];
    } else if (ratio >= 0.7) {
      scoreEmojiKey = "sparkles";
      descriptionLines = ["대단해요! 감을 제대로 잡으신 것 같아요."];
    } else if (ratio >= 0.4) {
      scoreEmojiKey = "muscle";
      descriptionLines = ["차근차근 잘하고 있어요. 조금만 더 힘내볼까요?"];
    } else {
      scoreEmojiKey = "seedling";
      descriptionLines = ["첫걸음이 중요하죠! 우리 같이 천천히 익혀봐요."];
    }

    const scoreLabel = `${scoreMain} ${PREVIEW_SCORE_EMOJI_CHAR[scoreEmojiKey]}`;

    return {
      title: DEFAULT_TITLE,
      descriptionLines,
      description: descriptionLines.join(" "),
      scoreMain,
      scoreEmojiKey,
      scoreLabel
    };
  }

  const scoreEmojiKey = "wave";
  const scoreMain = "반가워요!";
  const scoreLabel = `${scoreMain} ${PREVIEW_SCORE_EMOJI_CHAR[scoreEmojiKey]}`;
  const descriptionLines = ["Japanote에서 이미지로", "재밌게 배워봐요!"];

  return {
    title: "함께 공부할래요? 🐾",
    descriptionLines,
    description: descriptionLines.join(" "),
    scoreMain,
    scoreEmojiKey,
    scoreLabel
  };
}

function buildPreviewImageUrl(requestUrl, code) {
  const imageUrl = new URL(requestUrl.toString());
  imageUrl.pathname = `/challenge-preview/${code}/image`;
  imageUrl.search = "";
  imageUrl.hash = "";
  return imageUrl.toString();
}

function encodeBase64(value) {
  if (typeof btoa === "function") return btoa(value);
  return Buffer.from(value, "utf8").toString("base64");
}

async function loadChallengePreviewIllustrationHref(requestUrl, env) {
  if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") return "";
  if (!challengePreviewIllustrationHrefPromise) {
    const assetUrl = new URL(CHALLENGE_PREVIEW_ILLUSTRATION_PATH, requestUrl.origin).toString();
    challengePreviewIllustrationHrefPromise = env.ASSETS
      .fetch(new Request(assetUrl))
      .then(async (response) => {
        if (!response.ok) return "";
        const svgText = await response.text();
        return `data:image/svg+xml;base64,${encodeBase64(svgText)}`;
      })
      .catch(() => "");
  }
  return challengePreviewIllustrationHrefPromise;
}

function buildPreviewImageSvg({ scoreMain, scoreEmojiKey, descriptionLines }) {
  const main = escapeHtml(scoreMain || "안녕!");
  const key = scoreEmojiKey && TWEMOJI_INNER[scoreEmojiKey] ? scoreEmojiKey : "sparkles";
  const scoreTextW = estimateTextWidthPx(scoreMain || "", 52);
  const scoreTwemoji = svgTwemojiGroup(key, 150 + scoreTextW + 12, 176, 52);

  const headlinePlain = "두근두근! 도전장 도착";
  const headlineW = estimateTextWidthPx(headlinePlain, 76);
  const headlineTwemoji = svgTwemojiGroup("victory", 150 + headlineW + 14, 266, 58);

  const lines = descriptionLines || ["함께 시작해봐요!"];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="softBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0F0" />
      <stop offset="100%" stop-color="#FFE4D6" />
    </linearGradient>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#FF9E7D" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#softBg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="60" fill="white" filter="url(#softShadow)"/>

  <text x="150" y="220" fill="#FF6B6B" font-size="52" font-weight="800" font-family="Pretendard, sans-serif">
    ${main}
  </text>
  ${scoreTwemoji}

  <text x="150" y="330" fill="#1f1b1c" font-size="76" font-weight="900" font-family="Pretendard, sans-serif" letter-spacing="-1.5">
    ${escapeHtml(headlinePlain)}
  </text>
  ${headlineTwemoji}

  <text x="150" y="415" fill="#777" font-size="36" font-weight="500" font-family="Pretendard, sans-serif">
    <tspan x="150" dy="0">${escapeHtml(lines[0])}</tspan>
    ${lines[1] ? `<tspan x="150" dy="50">${escapeHtml(lines[1])}</tspan>` : ""}
  </text>
</svg>`;
}

export async function handleChallengePreviewRequest(requestUrl, code) {
  try {
    const previewContext = await loadChallengePreviewContext(requestUrl, code);
    if (previewContext.error) return previewContext.error;
    const html = buildHtml({
      previewUrl: requestUrl.toString(),
      targetUrl: previewContext.targetUrl,
      title: previewContext.title,
      description: previewContext.description,
      imageUrl: buildPreviewImageUrl(requestUrl, previewContext.code)
    });
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (error) {
    return new Response("Failed to load challenge preview", { status: 500 });
  }
}

export async function handleChallengePreviewImageRequest(requestUrl, code, env) {
  try {
    const previewContext = await loadChallengePreviewContext(requestUrl, code);
    if (previewContext.error) return previewContext.error;
    const svg = buildPreviewImageSvg({
      scoreMain: previewContext.scoreMain,
      scoreEmojiKey: previewContext.scoreEmojiKey,
      descriptionLines: previewContext.descriptionLines
    });
    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (error) {
    return new Response("Failed to render challenge preview image", { status: 500 });
  }
}

// buildHtml, fetchChallenge, loadChallengePreviewContext 등 기타 로직은 원본 유지
function buildHtml({ previewUrl, targetUrl, title, description, imageUrl }) {
  const safePreviewUrl = escapeHtml(previewUrl);
  const safeTargetUrl = escapeHtml(targetUrl);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImageUrl = escapeHtml(imageUrl);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${DEFAULT_SITE_NAME}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${safePreviewUrl}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:width" content="${DEFAULT_IMAGE_WIDTH}">
  <meta property="og:image:height" content="${DEFAULT_IMAGE_HEIGHT}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <meta name="twitter:image:alt" content="${safeTitle}">
  <meta http-equiv="refresh" content="0;url=${safeTargetUrl}">
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body>
  <main style="font-family: sans-serif; text-align: center; padding-top: 50px;">
    <p>도전 링크로 이동하고 있어요! 🏃‍♀️</p>
    <p><a href="${safeTargetUrl}">이동하지 않으면 여기를 눌러 주세요.</a></p>
  </main>
</body>
</html>`;
}

async function fetchChallenge(code) {
  const requestUrl = new URL(`${SUPABASE_URL}/rest/v1/shared_challenges`);
  requestUrl.searchParams.set("select", "kind,payload");
  requestUrl.searchParams.set("code", `eq.${code}`);
  const response = await fetch(requestUrl.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) throw new Error(`Challenge fetch failed: ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : null;
}

async function loadChallengePreviewContext(requestUrl, code) {
  const normalizedCode = normalizeText(code);
  if (!isValidCode(normalizedCode)) return { error: new Response("Invalid challenge code", { status: 400 }) };
  const challenge = await fetchChallenge(normalizedCode);
  if (!challenge?.payload) return { error: new Response("Challenge not found", { status: 404 }) };
  const payload = challenge.payload;
  const targetPath = readTargetPath(payload);
  const targetHash = readTargetHash(payload);
  if (!isValidTargetPath(targetPath)) return { error: new Response("Invalid challenge target", { status: 400 }) };
  const targetOrigin = readTargetOrigin(payload, requestUrl);
  const targetUrl = buildTargetUrl(normalizedCode, targetOrigin, targetPath, targetHash);
  const previewText = buildPreviewText(payload);
  return { code: normalizedCode, targetUrl, ...previewText };
}


export {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_CHALLENGE_PROMPT,
  buildPreviewText,
  buildPreviewImageSvg
};
