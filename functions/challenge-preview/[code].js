const SUPABASE_URL = "https://nppaqezqwusbagzdnoqi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcGFxZXpxd3VzYmFnemRub3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTU5MzIsImV4cCI6MjA5MDQzMTkzMn0.cVnznT2P0sOoX6nA9mCLLNtIID5m2I1LW8N36FY9iqA";
const DEFAULT_TITLE = "친구 도전이 왔어요";
const DEFAULT_DESCRIPTION = "저보다 많이 맞출 수 있어요?";
const DEFAULT_SITE_NAME = "Japanote";
const DEFAULT_IMAGE_PATH = "/assets/images/social-preview.png";

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

function readResultSummary(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

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
  return normalizeText(payload?.targetPath || payload?.p);
}

function readTargetHash(payload) {
  return normalizeText(payload?.targetHash || payload?.h);
}

function getImagePath(targetPath) {
  const matched = targetPath.match(/^(.*)\/[^/]+\.html$/u);
  const prefix = matched?.[1] || "";
  return `${prefix}${DEFAULT_IMAGE_PATH}`;
}

function buildTargetUrl(code, origin, path, hash) {
  const url = new URL(`${origin}${path}`);
  url.searchParams.set("c", code);

  if (hash) {
    url.hash = hash;
  }

  return url.toString();
}

function buildPreviewText(payload) {
  const summary = readResultSummary(payload);

  if (!summary) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION
    };
  }

  return {
    title: `${summary.correct}/${summary.total} 맞췄어요`,
    description: DEFAULT_DESCRIPTION
  };
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
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <meta http-equiv="refresh" content="0;url=${safeTargetUrl}">
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body>
  <main>
    <p>Japanote 도전 링크로 이동 중입니다.</p>
    <p><a href="${safeTargetUrl}">계속하려면 여기를 눌러 주세요.</a></p>
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

  if (!response.ok) {
    throw new Error(`Challenge fetch failed: ${response.status}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : null;
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const code = normalizeText(context.params.code);

  if (!isValidCode(code)) {
    return new Response("Invalid challenge code", { status: 400 });
  }

  try {
    // 미리보기는 같은 pages.dev 도메인에서 HTML로 응답해야 메신저 카드가 정상 생성된다.
    const challenge = await fetchChallenge(code);

    if (!challenge?.payload) {
      return new Response("Challenge not found", { status: 404 });
    }

    const payload = challenge.payload;
    const targetPath = readTargetPath(payload);
    const targetHash = readTargetHash(payload);

    if (!/^\/[A-Za-z0-9/_\-.]+\.html$/u.test(targetPath)) {
      return new Response("Invalid challenge target", { status: 400 });
    }

    if (targetHash && !/^#[A-Za-z0-9_-]+$/u.test(targetHash)) {
      return new Response("Invalid challenge target", { status: 400 });
    }

    const targetOrigin = readTargetOrigin(payload, requestUrl);
    const targetUrl = buildTargetUrl(code, targetOrigin, targetPath, targetHash);
    const imageUrl = `${targetOrigin}${getImagePath(targetPath)}`;
    const { title, description } = buildPreviewText(payload);
    const html = buildHtml({
      previewUrl: requestUrl.toString(),
      targetUrl,
      title,
      description,
      imageUrl
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
