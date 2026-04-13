(function challengeLinksBootstrap(global) {
  const challengeParamKey = "challenge";
  const maxEncodedChallengeLength = 20000;
  const comparisonCardClassName = "challenge-result-comparison";
  const maxVisibleComparisonItems = 6;
  const providersByResultViewId = new Map();
  const providersByKind = new Map();
  let pendingChallengePayload = null;
  let appliedChallengeKey = "";
  let applyAttemptQueued = false;
  let activeChallengeState = null;

  function notify(message) {
    if (!message) {
      return;
    }

    if (typeof global.showJapanoteToast === "function") {
      global.showJapanoteToast(message);
      return;
    }

    console.info(message);
  }

  function toBase64Url(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
  }

  function fromBase64Url(value) {
    const normalized = String(value || "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeChallengePayload(payload) {
    return toBase64Url(JSON.stringify(payload));
  }

  function decodeChallengePayload(value) {
    try {
      return JSON.parse(fromBase64Url(value));
    } catch (error) {
      console.warn("Failed to decode challenge payload.", error);
      return null;
    }
  }

  function parsePendingChallengePayload() {
    try {
      const currentUrl = new URL(global.location.href);
      const encoded = currentUrl.searchParams.get(challengeParamKey);
      return encoded ? decodeChallengePayload(encoded) : null;
    } catch (error) {
      console.warn("Failed to parse challenge query.", error);
      return null;
    }
  }

  function getPayloadKey(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }

    return String(payload.challengeId || `${payload.kind || "challenge"}:${payload.createdAt || ""}`);
  }

  function copyText(text) {
    if (!text) {
      return Promise.resolve(false);
    }

    if (global.navigator?.clipboard?.writeText) {
      return global.navigator.clipboard.writeText(text).then(
        () => true,
        () => false
      );
    }

    return new Promise((resolve) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }

      textarea.remove();
      resolve(copied);
    });
  }

  function parseStatNumber(text) {
    const matched = String(text || "").match(/\d+/u);
    return matched ? Number(matched[0]) : NaN;
  }

  function getAccuracy(total, correct) {
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }

    return Math.round((correct / total) * 100);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/gu, " ").trim();
  }

  function buildResultItemKey(item) {
    return [normalizeText(item?.title), normalizeText(item?.description)].join("::");
  }

  function buildResultItemLabel(item) {
    const title = normalizeText(item?.title);
    const description = normalizeText(item?.description);

    if (!description || description === title) {
      return title;
    }

    return `${title} · ${description}`;
  }

  function mergeUniqueResultItems(items) {
    const map = new Map();

    (Array.isArray(items) ? items : []).forEach((item) => {
      const key = buildResultItemKey(item);

      if (!key || map.has(key)) {
        return;
      }

      map.set(key, {
        key,
        title: normalizeText(item.title),
        description: normalizeText(item.description),
        status: item.status === "correct" ? "correct" : "wrong",
        label: buildResultItemLabel(item)
      });
    });

    return Array.from(map.values());
  }

  function readResultSummaryFromView(resultViewId) {
    const resultView = document.getElementById(resultViewId);

    if (!resultView || resultView.hidden) {
      return null;
    }

    const total = parseStatNumber(resultView.querySelector('[data-result-filter="all"] strong')?.textContent);
    const correct = parseStatNumber(resultView.querySelector('[data-result-filter="correct"] strong')?.textContent);
    const wrong = parseStatNumber(resultView.querySelector('[data-result-filter="wrong"] strong')?.textContent);

    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(correct) || !Number.isFinite(wrong)) {
      return null;
    }

    return {
      total,
      correct,
      wrong,
      accuracy: getAccuracy(total, correct)
    };
  }

  function readResultItemsFromView(resultViewId) {
    const resultView = document.getElementById(resultViewId);

    if (!resultView || resultView.hidden) {
      return [];
    }

    const items = Array.from(resultView.querySelectorAll(".match-result-item")).map((article) => {
      const title = normalizeText(article.querySelector("strong")?.textContent);
      const description = normalizeText(article.querySelector("p")?.textContent);

      if (!title) {
        return null;
      }

      return {
        title,
        description,
        status: article.classList.contains("is-correct") ? "correct" : "wrong"
      };
    });

    return mergeUniqueResultItems(items.filter(Boolean));
  }

  function getComparisonOutcome(sourceResult, currentResult) {
    if (currentResult.correct > sourceResult.correct) {
      return {
        text: "내가 앞서고 있어요",
        tone: "leading"
      };
    }

    if (currentResult.correct < sourceResult.correct) {
      return {
        text: "친구가 앞서고 있어요",
        tone: "trailing"
      };
    }

    if (currentResult.wrong < sourceResult.wrong) {
      return {
        text: "내가 앞서고 있어요",
        tone: "leading"
      };
    }

    if (currentResult.wrong > sourceResult.wrong) {
      return {
        text: "친구가 앞서고 있어요",
        tone: "trailing"
      };
    }

    return {
      text: "지금은 무승부예요",
      tone: "tied"
    };
  }

  function createComparisonMetricsText(result) {
    return `정답 ${result.correct}개 · 오답 ${result.wrong}개 · 정확도 ${result.accuracy}%`;
  }

  function createComparisonBuckets(items) {
    const uniqueItems = mergeUniqueResultItems(items);
    const correctItems = uniqueItems.filter((item) => item.status === "correct").map((item) => item.label);
    const wrongItems = uniqueItems.filter((item) => item.status !== "correct").map((item) => item.label);

    return {
      correct: {
        title: "맞힌 단어",
        count: correctItems.length,
        visibleItems: correctItems.slice(0, maxVisibleComparisonItems),
        hiddenCount: Math.max(correctItems.length - maxVisibleComparisonItems, 0)
      },
      wrong: {
        title: "틀린 단어",
        count: wrongItems.length,
        visibleItems: wrongItems.slice(0, maxVisibleComparisonItems),
        hiddenCount: Math.max(wrongItems.length - maxVisibleComparisonItems, 0)
      }
    };
  }

  function createComparisonPlayerCard(label, scoreText, metricsText) {
    const panel = document.createElement("article");
    const playerLabel = document.createElement("span");
    const score = document.createElement("strong");
    const metrics = document.createElement("p");

    panel.className = "challenge-result-comparison-player";
    playerLabel.className = "challenge-result-comparison-label";
    score.className = "challenge-result-comparison-score";
    metrics.className = "challenge-result-comparison-metrics";

    playerLabel.textContent = label;
    score.textContent = scoreText;
    metrics.textContent = metricsText;

    panel.append(playerLabel, score, metrics);
    return panel;
  }

  function createComparisonSectionCard(sectionData, toneClassName) {
    const section = document.createElement("section");
    const head = document.createElement("div");
    const title = document.createElement("strong");
    const count = document.createElement("span");
    const list = document.createElement("div");

    section.className = `challenge-result-comparison-section ${toneClassName || ""}`.trim();
    head.className = "challenge-result-comparison-section-head";
    title.className = "challenge-result-comparison-section-title";
    count.className = "challenge-result-comparison-section-count";
    list.className = "challenge-result-comparison-section-list";

    title.textContent = sectionData.title;
    count.textContent = `${sectionData.count}개`;

    if (!sectionData.visibleItems.length) {
      const empty = document.createElement("span");
      empty.className = "challenge-result-comparison-empty";
      empty.textContent = "없음";
      list.appendChild(empty);
    } else {
      sectionData.visibleItems.forEach((itemLabel) => {
        const chip = document.createElement("span");
        chip.className = "challenge-result-comparison-chip";
        chip.textContent = itemLabel;
        list.appendChild(chip);
      });
    }

    if (sectionData.hiddenCount > 0) {
      const more = document.createElement("span");
      more.className = "challenge-result-comparison-more";
      more.textContent = `외 ${sectionData.hiddenCount}개`;
      list.appendChild(more);
    }

    head.append(title, count);
    section.append(head, list);
    return section;
  }

  function createComparisonListFromItems(items) {
    const listWrap = document.createElement("div");
    const list = document.createElement("div");
    const uniqueItems = mergeUniqueResultItems(items);
    const visibleItems = uniqueItems.slice(0, maxVisibleComparisonItems);
    const hiddenCount = Math.max(uniqueItems.length - maxVisibleComparisonItems, 0);

    listWrap.className = "challenge-result-comparison-list-wrap";
    list.className = "challenge-result-comparison-list";

    if (!visibleItems.length) {
      const empty = document.createElement("span");
      empty.className = "challenge-result-comparison-empty";
      empty.textContent = "기록이 없어요.";
      list.appendChild(empty);
    } else {
      visibleItems.forEach((item) => {
        const row = document.createElement("div");
        const icon = document.createElement("span");
        const itemLabel = document.createElement("span");

        row.className = `challenge-result-comparison-item is-${item.status}`;
        icon.className = "challenge-result-comparison-item-icon";
        itemLabel.className = "challenge-result-comparison-item-label";

        icon.textContent = item.status === "correct" ? "⭕" : "❌";
        itemLabel.textContent = item.label;

        row.append(icon, itemLabel);
        list.appendChild(row);
      });
    }

    if (hiddenCount > 0) {
      const more = document.createElement("div");
      more.className = "challenge-result-comparison-more";
      more.textContent = `+${hiddenCount}개`;
      list.appendChild(more);
    }

    listWrap.appendChild(list);
    return listWrap;
  }

  function createComparisonColumn(label, result, items, modifierClassName) {
    const column = document.createElement("article");

    column.className = `challenge-result-comparison-column ${modifierClassName || ""}`.trim();

    column.appendChild(
      createComparisonPlayerCard(label, `${result.correct} / ${result.total}`, createComparisonMetricsText(result))
    );
    column.appendChild(createComparisonListFromItems(items));

    return column;
  }

  function getComparisonSnapshot(resultViewId) {
    if (!activeChallengeState || activeChallengeState.resultViewId !== resultViewId) {
      return null;
    }

    const sourceResult = activeChallengeState.payload?.sourceResult;
    const sourceItems = mergeUniqueResultItems(activeChallengeState.payload?.sourceItems);
    const currentResult = activeChallengeState.currentResult || readResultSummaryFromView(resultViewId);

    if (!sourceResult || !currentResult || sourceItems.length < sourceResult.total) {
      return null;
    }

    // 결과 필터를 바꿔도 비교 목록은 처음 완주했을 때의 전체 결과 기준으로 유지한다.
    if (!Array.isArray(activeChallengeState.currentItems) || !activeChallengeState.currentItems.length) {
      const currentItems = readResultItemsFromView(resultViewId);

      if (currentItems.length < currentResult.total) {
        return null;
      }

      activeChallengeState.currentItems = currentItems;
      activeChallengeState.currentResult = currentResult;
    }

    return {
      outcome: getComparisonOutcome(sourceResult, activeChallengeState.currentResult),
      sourceResult,
      currentResult: activeChallengeState.currentResult,
      sourceItems,
      currentItems: activeChallengeState.currentItems,
      sourceBuckets: createComparisonBuckets(sourceItems),
      currentBuckets: createComparisonBuckets(activeChallengeState.currentItems)
    };
  }

  function createComparisonCard(snapshot) {
    const card = document.createElement("section");
    const header = document.createElement("div");
    const eyebrow = document.createElement("span");
    const status = document.createElement("strong");
    const grid = document.createElement("div");

    card.className = `${comparisonCardClassName} is-${snapshot.outcome.tone}`;
    header.className = "challenge-result-comparison-head";
    eyebrow.className = "challenge-result-comparison-eyebrow";
    status.className = "challenge-result-comparison-status";
    grid.className = "challenge-result-comparison-grid";

    eyebrow.textContent = "친구 도전 비교";
    status.textContent = snapshot.outcome.text;

    grid.append(
      createComparisonColumn("친구 기록", snapshot.sourceResult, snapshot.sourceItems, "is-source"),
      createComparisonColumn("내 기록", snapshot.currentResult, snapshot.currentItems, "is-current")
    );

    header.append(eyebrow, status);
    card.append(header, grid);
    return card;
  }

  function removeComparisonCards(resultViewId) {
    if (resultViewId) {
      document.getElementById(resultViewId)?.querySelectorAll(`.${comparisonCardClassName}`).forEach((card) => card.remove());
      return;
    }

    document.querySelectorAll(`.${comparisonCardClassName}`).forEach((card) => card.remove());
  }

  function syncResultComparison(resultViewId) {
    const resultView = document.getElementById(resultViewId);

    if (!resultView) {
      return;
    }

    removeComparisonCards(resultViewId);

    const footer = resultView.querySelector(".match-result-share-footer");
    const snapshot = getComparisonSnapshot(resultViewId);

    if (!footer || !snapshot) {
      return;
    }

    footer.prepend(createComparisonCard(snapshot));
  }

  function clearActiveChallenge(resultViewId = "") {
    if (resultViewId && activeChallengeState && activeChallengeState.resultViewId !== resultViewId) {
      return;
    }

    activeChallengeState = null;
    removeComparisonCards(resultViewId);
  }

  function queueApplyAttempt() {
    if (applyAttemptQueued) {
      return;
    }

    applyAttemptQueued = true;
    global.setTimeout(() => {
      applyAttemptQueued = false;
      attemptApplyPendingChallenge();
    }, 0);
  }

  function attemptApplyPendingChallenge() {
    if (!pendingChallengePayload) {
      pendingChallengePayload = parsePendingChallengePayload();
    }

    if (!pendingChallengePayload) {
      return false;
    }

    const payloadKey = getPayloadKey(pendingChallengePayload);

    if (payloadKey && payloadKey === appliedChallengeKey) {
      return true;
    }

    const provider = providersByKind.get(pendingChallengePayload.kind);

    if (!provider || typeof provider.applyPayload !== "function") {
      return false;
    }

    try {
      const applied = provider.applyPayload(pendingChallengePayload);

      if (!applied) {
        return false;
      }

      appliedChallengeKey = payloadKey || `${pendingChallengePayload.kind}:${Date.now()}`;
      activeChallengeState = {
        resultViewId: provider.resultViewId,
        payload: pendingChallengePayload,
        currentResult: null,
        currentItems: null
      };
      global.setTimeout(() => {
        syncResultComparison(provider.resultViewId);
      }, 0);
      notify(provider.getApplyMessage?.(pendingChallengePayload) || "친구 도전이 열렸어요.");
      return true;
    } catch (error) {
      console.error("Failed to apply challenge payload.", error);
      return false;
    }
  }

  function registerProvider(provider) {
    if (!provider?.resultViewId || !provider?.kind) {
      return;
    }

    providersByResultViewId.set(provider.resultViewId, provider);
    providersByKind.set(provider.kind, provider);
    queueApplyAttempt();
  }

  function buildChallengeLink(resultViewId) {
    const provider = providersByResultViewId.get(resultViewId);

    if (!provider || typeof provider.createPayload !== "function") {
      return {
        url: "",
        error: "아직 이 결과 화면에서는 도전 링크를 만들 수 없어요."
      };
    }

    const payload = provider.createPayload();

    if (!payload) {
      return {
        url: "",
        error: "먼저 결과를 만든 뒤에 도전 링크를 복사해 주세요."
      };
    }

    const sourceResult = readResultSummaryFromView(resultViewId);
    const sourceItems = readResultItemsFromView(resultViewId);

    // 비교용 단어 목록은 전체 결과가 모두 보이는 상태에서만 안전하게 담을 수 있다.
    if (sourceResult && sourceItems.length < sourceResult.total) {
      return {
        url: "",
        error: "비교용 단어 리스트를 담으려면 결과 필터를 전체로 바꿔 주세요."
      };
    }

    const completedPayload = {
      v: 1,
      kind: provider.kind,
      createdAt: payload.createdAt || Date.now(),
      challengeId: payload.challengeId || `${provider.kind}-${Date.now()}`,
      ...payload,
      sourceResult: sourceResult || payload.sourceResult || null,
      sourceItems: sourceItems.length ? sourceItems : payload.sourceItems || []
    };
    const encoded = encodeChallengePayload(completedPayload);

    if (encoded.length > maxEncodedChallengeLength) {
      return {
        url: "",
        error: "링크가 너무 길어서 복사할 수 없어요. 세션을 조금 줄여서 다시 시도해 주세요."
      };
    }

    const targetUrl = new URL(provider.getTargetPath?.(completedPayload) || global.location.pathname, global.location.href);
    targetUrl.searchParams.set(challengeParamKey, encoded);

    const nextHash = provider.getTargetHash?.(completedPayload);
    if (nextHash) {
      targetUrl.hash = nextHash;
    }

    return {
      url: targetUrl.toString(),
      error: ""
    };
  }

  function createChallengeButton(resultViewId) {
    if (!providersByResultViewId.has(resultViewId)) {
      return null;
    }

    const button = document.createElement("button");
    const icon = document.createElement("span");
    const label = document.createElement("span");

    button.type = "button";
    button.className = "secondary-btn button-with-icon challenge-link-btn";

    icon.className = "material-symbols-rounded";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "link";

    label.textContent = "도전 링크 복사";
    button.append(icon, label);

    button.addEventListener("click", async () => {
      const originalLabel = label.textContent;
      const { url, error } = buildChallengeLink(resultViewId);

      if (!url) {
        notify(error || "도전 링크를 만들 수 없어요.");
        return;
      }

      label.textContent = "복사하는 중...";
      button.disabled = true;

      const copied = await copyText(url);

      button.disabled = false;
      label.textContent = originalLabel;
      notify(copied ? "친구 도전 링크를 복사했어요." : "링크 복사에 실패했어요.");
    });

    return button;
  }

  pendingChallengePayload = parsePendingChallengePayload();

  global.addEventListener("DOMContentLoaded", queueApplyAttempt);
  global.addEventListener("load", queueApplyAttempt);
  global.addEventListener("japanote:supplementary-content-loaded", queueApplyAttempt);
  global.addEventListener("japanote:vocab-loaded", queueApplyAttempt);

  global.japanoteChallengeLinks = {
    registerProvider,
    createChallengeButton,
    buildChallengeLink,
    attemptApplyPendingChallenge,
    syncResultComparison,
    clearActiveChallenge,
    getComparisonSnapshot
  };
})(window);
