const SUPABASE_URL = "https://nppaqezqwusbagzdnoqi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcGFxZXpxd3VzYmFnemRub3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTU5MzIsImV4cCI6MjA5MDQzMTkzMn0.cVnznT2P0sOoX6nA9mCLLNtIID5m2I1LW8N36FY9iqA";
const DEFAULT_TITLE = "두근두근! 도전장이 왔어요 💌";
const DEFAULT_DESCRIPTION = "같은 문제로 바로 도전해 보세요";
const DEFAULT_CHALLENGE_PROMPT = "나보다 더 잘할 수 있을까? 도전장을 받아줘!";
const DEFAULT_SITE_NAME = "Japanote";
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;
const CHALLENGE_PREVIEW_ILLUSTRATION_PATH = "/assets/images/social-preview-traced-quantized.svg";

let challengePreviewIllustrationHrefPromise = null;

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
  if (targetPath === "/") {
    return true;
  }
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
  if (payloadOrigin && /^https?:\/\/[^/]+$/u.test(payloadOrigin)) {
    return payloadOrigin.replace(/\/+$/u, "");
  }
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

/**
 * [귀여움 버전] 문구 생성 함수
 */
function buildPreviewText(payload) {
  const summary = readResultSummary(payload);
  
  if (summary) {
    const { correct, total } = summary;
    const ratio = correct / total;
    
    let emoji = "✨";
    if (ratio >= 0.8) emoji = "👑"; 
    else if (ratio <= 0.3) emoji = "🌱";
    
    const scoreLabel = `무려 ${correct}개나 맞혔어요! ${emoji}`;
    const challengeLabel = DEFAULT_CHALLENGE_PROMPT;
    const description = `${scoreLabel}. ${challengeLabel}`;
    
    return {
      title: DEFAULT_TITLE,
      description,
      scoreLabel,
      challengeLabel
    };
  }

  return {
    title: "함께 공부할래요? 🐾",
    description: DEFAULT_DESCRIPTION,
    scoreLabel: "반가워요! 👋",
    challengeLabel: DEFAULT_DESCRIPTION
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

/**
 * [귀여움 버전] SVG 생성 함수
 */
function buildPreviewImageSvgLegacy({ title, description, scoreLabel, illustrationHref }) {
  const safeTitle = escapeHtml(title);
  const safeScoreLabel = escapeHtml(scoreLabel || "안녕!");
  const safeChallengeLabel = escapeHtml(scoreLabel ? "당신의 실력을 보여주세요!" : "함께 시작해봐요!");
  const safeIllustrationHref = escapeHtml(illustrationHref || "");

  const illustrationMarkup = safeIllustrationHref
    ? `<image href="${safeIllustrationHref}" x="670" y="115" width="400" height="400" preserveAspectRatio="xMidYMid meet"/>`
    : `<g transform="translate(750, 200)">
         <circle cx="100" cy="100" r="100" fill="#FF8A5B" opacity="0.2"/>
         <circle cx="70" cy="85" r="12" fill="#FF8A5B"/>
         <circle cx="130" cy="85" r="12" fill="#FF8A5B"/>
         <path d="M75 130 Q100 155 125 130" stroke="#FF8A5B" stroke-width="10" fill="none" stroke-linecap="round"/>
       </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DEFAULT_IMAGE_WIDTH}" height="${DEFAULT_IMAGE_HEIGHT}" viewBox="0 0 ${DEFAULT_IMAGE_WIDTH} ${DEFAULT_IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="softBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0F0" />
      <stop offset="100%" stop-color="#FFE4D6" />
    </linearGradient>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#FF9E7D" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#softBg)"/>

  <circle cx="100" cy="100" r="60" fill="#FFCFB3" opacity="0.4"/>
  <circle cx="1120" cy="550" r="70" fill="#FFB7B7" opacity="0.3"/>

  <rect x="60" y="60" width="1080" height="510" rx="60" fill="white" filter="url(#softShadow)"/>

  <rect x="650" y="100" width="430" height="430" rx="50" fill="#FFF9F5"/>

  <text x="120" y="240" fill="#FF6B6B" font-size="48" font-weight="800" font-family="Pretendard, sans-serif">
    ${safeScoreLabel}
  </text>
  
  <text x="120" y="350" fill="#1f1b1c" font-size="95" font-weight="900" font-family="Pretendard, sans-serif" letter-spacing="-1">
    도전 수락? ✌️
  </text>

  <text x="120" y="430" fill="#777" font-size="36" font-weight="500" font-family="Pretendard, sans-serif">
    ${safeChallengeLabel}
  </text>

  <rect x="120" y="485" width="160" height="48" rx="24" fill="#FF8A5B"/>
  <text x="200" y="518" fill="white" font-size="22" font-weight="800" text-anchor="middle" font-family="Pretendard, sans-serif">Japanote</text>

  ${illustrationMarkup}
</svg>`;
}

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

function buildPreviewImageSvg({ title, description, scoreLabel, challengeLabel, illustrationHref }) {
  const safeTitle = escapeHtml(title);
  const safeScoreLabel = escapeHtml(scoreLabel || "지금 시작해요! 🌸");
  const safeChallengeLabel = escapeHtml(challengeLabel || description || DEFAULT_DESCRIPTION);
  const safeIllustrationHref = escapeHtml(illustrationHref || "");

  const illustrationMarkup = safeIllustrationHref
    ? `<image href="${safeIllustrationHref}" x="670" y="115" width="400" height="400" preserveAspectRatio="xMidYMid meet"/>`
    : `<g transform="translate(750, 200)">
         <circle cx="100" cy="100" r="100" fill="#FF8A5B" opacity="0.2"/>
         <circle cx="70" cy="85" r="12" fill="#FF8A5B"/>
         <circle cx="130" cy="85" r="12" fill="#FF8A5B"/>
         <path d="M75 130 Q100 155 125 130" stroke="#FF8A5B" stroke-width="10" fill="none" stroke-linecap="round"/>
       </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DEFAULT_IMAGE_WIDTH}" height="${DEFAULT_IMAGE_HEIGHT}" viewBox="0 0 ${DEFAULT_IMAGE_WIDTH} ${DEFAULT_IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="softBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0F0" />
      <stop offset="100%" stop-color="#FFE4D6" />
    </linearGradient>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#FF9E7D" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#softBg)"/>

  <circle cx="100" cy="100" r="60" fill="#FFCFB3" opacity="0.4"/>
  <circle cx="1120" cy="550" r="70" fill="#FFB7B7" opacity="0.3"/>

  <rect x="60" y="60" width="1080" height="510" rx="60" fill="white" filter="url(#softShadow)"/>

  <rect x="650" y="100" width="430" height="430" rx="50" fill="#FFF9F5"/>

  <text x="120" y="240" fill="#FF6B6B" font-size="48" font-weight="800" font-family="Pretendard, sans-serif">
    ${safeScoreLabel}
  </text>

  <text x="120" y="340" fill="#1f1b1c" font-size="56" font-weight="900" font-family="Pretendard, sans-serif" textLength="470" lengthAdjust="spacingAndGlyphs">
    ${safeTitle}
  </text>

  <text x="120" y="430" fill="#777" font-size="36" font-weight="500" font-family="Pretendard, sans-serif">
    ${safeChallengeLabel}
  </text>

  <rect x="120" y="485" width="160" height="48" rx="24" fill="#FF8A5B"/>
  <text x="200" y="518" fill="white" font-size="22" font-weight="800" text-anchor="middle" font-family="Pretendard, sans-serif">Japanote</text>

  ${illustrationMarkup}
</svg>`;
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
  if (!isValidCode(normalizedCode)) {
    return { error: new Response("Invalid challenge code", { status: 400 }) };
  }
  const challenge = await fetchChallenge(normalizedCode);
  if (!challenge?.payload) {
    return { error: new Response("Challenge not found", { status: 404 }) };
  }
  const payload = challenge.payload;
  const targetPath = readTargetPath(payload);
  const targetHash = readTargetHash(payload);
  if (!isValidTargetPath(targetPath)) {
    return { error: new Response("Invalid challenge target", { status: 400 }) };
  }
  if (targetHash && !/^#[A-Za-z0-9_-]+$/u.test(targetHash)) {
    return { error: new Response("Invalid challenge target", { status: 400 }) };
  }
  const targetOrigin = readTargetOrigin(payload, requestUrl);
  const targetUrl = buildTargetUrl(normalizedCode, targetOrigin, targetPath, targetHash);
  const previewText = buildPreviewText(payload);
  return { code: normalizedCode, targetUrl, ...previewText };
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
    const illustrationHref = await loadChallengePreviewIllustrationHref(requestUrl, env);
    const svg = buildPreviewImageSvg({
      title: previewContext.title,
      description: previewContext.description,
      scoreLabel: previewContext.scoreLabel,
      challengeLabel: previewContext.challengeLabel,
      illustrationHref
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
