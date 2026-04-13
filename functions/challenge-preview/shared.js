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
    let scoreLabel = `${correct}개 맞혔어요! ✨`;
    let descriptionLines = ["대단해요! 감을 제대로 잡으신 것 같아요."];

    // 맞힌 비율에 따라 도전 문구 톤을 다르게 보여준다.
    if (ratio >= 0.9) {
      scoreLabel = `${correct}개 맞혔어요! 👑`;
      descriptionLines = ["우와, 완벽해요! 혹시 천재 아니신가요?"];
    } else if (ratio >= 0.7) {
      scoreLabel = `${correct}개 맞혔어요! ✨`;
      descriptionLines = ["대단해요! 감을 제대로 잡으신 것 같아요."];
    } else if (ratio >= 0.4) {
      scoreLabel = `${correct}개 맞혔어요! 💪`;
      descriptionLines = ["차근차근 잘하고 있어요. 조금만 더 힘내볼까요?"];
    } else {
      scoreLabel = `${correct}개 맞혔어요! 🌱`;
      descriptionLines = ["첫걸음이 중요하죠! 우리 같이 천천히 익혀봐요."];
    }
    
    return {
      title: DEFAULT_TITLE,
      // 두 줄로 나누기 위해 배열로 전달
      descriptionLines,
      scoreLabel
    };
  }

  return {
    title: "함께 공부할래요? 🐾",
    descriptionLines: ["Japanote에서 이미지로", "재밌게 배워봐요!"],
    scoreLabel: "반가워요! 👋"
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

function buildPreviewImageSvg({ title, scoreLabel, descriptionLines, illustrationHref }) {
  const safeScoreLabel = escapeHtml(scoreLabel || "안녕!");
  
  // 설명 문구 처리 (기본값 대응)
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
    ${safeScoreLabel}
  </text>
  
  <text x="150" y="330" fill="#1f1b1c" font-size="76" font-weight="900" font-family="Pretendard, sans-serif" letter-spacing="-1.5">
    두근두근! 도전장 도착 ✌️
  </text>

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
    const illustrationHref = await loadChallengePreviewIllustrationHref(requestUrl, env);
    const svg = buildPreviewImageSvg({
      title: previewContext.title,
      description: previewContext.description,
      scoreLabel: previewContext.scoreLabel,
      descriptionLines: previewContext.descriptionLines,
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
