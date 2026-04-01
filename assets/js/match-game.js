const matchStorageKey = "japanote-match-state";
const studyStateStorageKey = "jlpt-compass-state";
const sharedMatchGame = globalThis.japanoteSharedMatchGame;

const matchSourceLevels = ["N5", "N4", "N3"];
const matchLevelOptions = [...matchSourceLevels, "all"];
const matchDurationOptions = [10, 15, 20, 0];
const matchTotalCountOptions = [5, 10, 15, 20];
const matchFilterOptions = ["all", "review", "mastered", "unmarked"];
const matchResultFilterOptions = ["all", "correct", "wrong"];
const matchPageSize = 5;
const matchWrongFlashDuration = 520;
const matchPageTransitionDelay = 720;

const defaultMatchPreferences = {
  level: "N5",
  filter: "all",
  part: "all",
  totalCount: 5,
  duration: 15,
  optionsOpen: false
};

const fallbackMatchPool = [
  { id: "match-fallback-1", level: "N5", reading: "?잆겧??, meaning: "癒밸떎" },
  { id: "match-fallback-2", level: "N5", reading: "?꾠걦", meaning: "媛?? },
  { id: "match-fallback-3", level: "N5", reading: "?욍굥", meaning: "蹂대떎" },
  { id: "match-fallback-4", level: "N5", reading: "?뚣겂?볝걝", meaning: "?숆탳" },
  { id: "match-fallback-5", level: "N5", reading: "?ⓦ굚?졼걾", meaning: "移쒓뎄" }
];

const matchResultFilterLabels = {
  all: "?꾩껜",
  correct: "?뺣떟",
  wrong: "?ㅻ떟"
};

const matchFilterLabels = {
  all: "?꾩껜",
  review: "?ㅼ떆 蹂쇰옒??,
  mastered: "?듯삍?댁슂",
  unmarked: "?꾩쭅 ??遊ㅼ뼱??
};

function loadMatchPreferences() {
  return sharedMatchGame.loadStoredObject(matchStorageKey, defaultMatchPreferences);
}

const matchPreferences = loadMatchPreferences();

function saveMatchPreferences() {
  sharedMatchGame.saveStoredObject(matchStorageKey, matchPreferences);
}

function loadSharedStudyState() {
  return sharedMatchGame.loadStoredObject(studyStateStorageKey);
}

function saveSharedStudyState(studyState) {
  sharedMatchGame.saveStoredObject(studyStateStorageKey, studyState);
}

function saveWordToMemorizationList(id) {
  if (!id) {
    return;
  }

  const studyState = loadSharedStudyState();
  const reviewIds = Array.isArray(studyState.reviewIds) ? studyState.reviewIds : [];
  const masteredIds = Array.isArray(studyState.masteredIds) ? studyState.masteredIds : [];

  studyState.reviewIds = Array.from(new Set([...reviewIds, id]));
  studyState.masteredIds = masteredIds.filter((itemId) => itemId !== id);
  saveSharedStudyState(studyState);
}

function removeWordFromMemorizationList(id) {
  if (!id) {
    return;
  }

  const studyState = loadSharedStudyState();
  const reviewIds = Array.isArray(studyState.reviewIds) ? studyState.reviewIds : [];

  studyState.reviewIds = reviewIds.filter((itemId) => itemId !== id);
  saveSharedStudyState(studyState);
}

function isWordSavedToMemorizationList(id) {
  if (!id) {
    return false;
  }

  const studyState = loadSharedStudyState();
  return Array.isArray(studyState.reviewIds) && studyState.reviewIds.includes(id);
}

function normalizeMatchText(value) {
  const text = String(value ?? "").trim();

  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    try {
      return decodeURIComponent(text).replace(/\s+/g, " ").trim();
    } catch (error) {
      return text.replace(/\s+/g, " ").trim();
    }
  }

  return text.replace(/\s+/g, " ").trim();
}

function getMatchLevel(value = matchPreferences.level) {
  return matchLevelOptions.includes(value) ? value : "N5";
}

function formatMatchLevelLabel(level) {
  const normalizedLevel = normalizeMatchText(level).toUpperCase();

  if (!normalizedLevel) {
    return "N5";
  }

  if (normalizedLevel === "ALL" || normalizedLevel === "?꾩껜") {
    return "?꾩껜";
  }

  if (/^N\d+$/.test(normalizedLevel)) {
    return normalizedLevel;
  }

  if (/^\d+$/.test(normalizedLevel)) {
    return `N${normalizedLevel}`;
  }

  return normalizedLevel;
}

function getMatchLevelLabel(level = matchPreferences.level) {
  const activeLevel = getMatchLevel(level);
  return activeLevel === "all" ? "?꾩껜" : formatMatchLevelLabel(activeLevel);
}

function getMatchTotalCount(value = matchPreferences.totalCount) {
  const numericValue = Number(value);
  return matchTotalCountOptions.includes(numericValue) ? numericValue : 5;
}

function getMatchDuration(value = matchPreferences.duration) {
  const numericValue = Number(value);
  return matchDurationOptions.includes(numericValue) ? numericValue : 15;
}

function getMatchDurationLabel(duration = matchPreferences.duration) {
  const activeDuration = Number(duration);
  return activeDuration <= 0 ? "泥쒖쿇?? : `${activeDuration}珥?;
}

function getMatchOptionsSummaryText() {
  return [`${getMatchTotalCount()}臾몄젣`, getMatchDurationLabel()].join(" 쨌 ");
}

function getMatchResultFilter(value = matchState.resultFilter) {
  return matchResultFilterOptions.includes(value) ? value : "all";
}

function getMatchFilter(value = matchPreferences.filter) {
  return matchFilterOptions.includes(value) ? value : "all";
}

function getMatchPartValue(item) {
  if (!Array.isArray(item.parts)) {
    return "";
  }

  return normalizeMatchText(item.parts[0] || "");
}

function getMatchStudyBuckets() {
  const studyState = loadSharedStudyState();
  return {
    reviewIds: Array.isArray(studyState.reviewIds) ? studyState.reviewIds : [],
    masteredIds: Array.isArray(studyState.masteredIds) ? studyState.masteredIds : []
  };
}

function getMatchLevelSource(level) {
  const vocabRegistry = globalThis.japanoteContent?.vocab || {};
  let source = [];

  if (Array.isArray(vocabRegistry[level]) && vocabRegistry[level].length) {
    source = vocabRegistry[level];
  } else {
    const legacyKey = `jlpt${level}`;

    if (Array.isArray(vocabRegistry[legacyKey]) && vocabRegistry[legacyKey].length) {
      source = vocabRegistry[legacyKey];
    } else if (level === "N5" && Array.isArray(globalThis.jlptN5Vocab) && globalThis.jlptN5Vocab.length) {
      source = globalThis.jlptN5Vocab;
    }
  }

  return source.map((item) => ({
    ...item,
    _level: item?._level || item?.level || level
  }));
}

function getMatchSource(level = matchPreferences.level) {
  const activeLevel = getMatchLevel(level);

  if (activeLevel === "all") {
    return matchSourceLevels.flatMap((itemLevel) => getMatchLevelSource(itemLevel));
  }

  return getMatchLevelSource(activeLevel);
}

function getMatchReading(item) {
  return normalizeMatchText(item.showEntry || item.show_entry || item.entry || item.pron).replace(/-/g, "");
}

function getMatchMeaning(item) {
  if (!Array.isArray(item.means)) {
    return "";
  }

  return normalizeMatchText(item.means.find((value) => normalizeMatchText(value)) || "");
}

function buildMatchPool(source) {
  return source
    .map((item) => ({
      id: normalizeMatchText(item.id || item.entry_id),
      level: formatMatchLevelLabel(item._level || item.level || "N5"),
      part: getMatchPartValue(item),
      reading: getMatchReading(item),
      meaning: getMatchMeaning(item)
    }))
    .filter((item) => item.id && item.reading && item.meaning)
    .filter(
      (item, index, pool) =>
        pool.findIndex(
          (candidate) =>
            candidate.reading === item.reading &&
            candidate.meaning === item.meaning
        ) === index
    );
}

function getBaseMatchPool(level = matchPreferences.level) {
  return buildMatchPool(getMatchSource(level));
}

function getAvailableMatchParts(items = getBaseMatchPool()) {
  const counts = new Map();

  items.forEach((item) => {
    const part = normalizeMatchText(item.part);

    if (!part) {
      return;
    }

    counts.set(part, (counts.get(part) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value, "ko"));
}

function getMatchPartFilter(value = matchPreferences.part, items = getBaseMatchPool()) {
  const normalizedPart = normalizeMatchText(value);

  if (!normalizedPart || normalizedPart === "all") {
    return "all";
  }

  const exists = getAvailableMatchParts(items).some((item) => item.value === normalizedPart);
  return exists ? normalizedPart : "all";
}

function filterMatchPool(items, filter = matchPreferences.filter, part = matchPreferences.part) {
  if (!Array.isArray(items)) {
    return [];
  }

  const activeFilter = getMatchFilter(filter);
  const activePart = getMatchPartFilter(part, items);
  const { reviewIds, masteredIds } = getMatchStudyBuckets();
  const filteredByPart =
    activePart === "all" ? items : items.filter((item) => normalizeMatchText(item.part) === activePart);

  if (activeFilter === "review") {
    return filteredByPart.filter((item) => reviewIds.includes(item.id));
  }

  if (activeFilter === "mastered") {
    return filteredByPart.filter((item) => masteredIds.includes(item.id));
  }

  if (activeFilter === "unmarked") {
    return filteredByPart.filter((item) => !reviewIds.includes(item.id) && !masteredIds.includes(item.id));
  }

  return filteredByPart;
}

function getMatchFilterCounts(items = getBaseMatchPool()) {
  const activePart = getMatchPartFilter(matchPreferences.part, items);
  return {
    all: filterMatchPool(items, "all", activePart).length,
    review: filterMatchPool(items, "review", activePart).length,
    mastered: filterMatchPool(items, "mastered", activePart).length,
    unmarked: filterMatchPool(items, "unmarked", activePart).length
  };
}

const matchState = {
  sessionItems: [],
  pageItems: [],
  pageIndex: 0,
  results: [],
  leftCards: [],
  rightCards: [],
  selectedLeft: null,
  selectedRight: null,
  wrongLeft: null,
  wrongRight: null,
  matchedIds: [],
  isLocked: false,
  timedOut: false,
  timeLeft: getMatchDuration(),
  hasStarted: false,
  showResults: false,
  resultFilter: "all"
};

let matchPool = [];

const matchEngine = sharedMatchGame.createMatchGameEngine({
  state: matchState,
  pageSize: matchPageSize,
  wrongFlashDuration: matchWrongFlashDuration,
  pageTransitionDelay: matchPageTransitionDelay,
  getDuration: () => getMatchDuration(matchPreferences.duration),
  getDefaultSessionItems: buildMatchSessionItems,
  mapResultItem: (item) => ({
    id: item.id,
    level: item.level,
    reading: item.reading,
    meaning: item.meaning
  }),
  buildCardsFromPageItems: (pageItems) => ({
    leftCards: sharedMatchGame.shuffleItems(
      pageItems.map((item) => ({
        id: item.id,
        value: item.reading,
        side: "left"
      }))
    ),
    rightCards: sharedMatchGame.shuffleItems(
      pageItems.map((item) => ({
        id: item.id,
        value: item.meaning,
        side: "right"
      }))
    )
  }),
  onRender: renderMatchScreen,
  onSetActionAvailability: setMatchActionAvailability,
  onSetFeedback: setMatchFeedback,
  onUnavailable: () => {
    renderMatchUnavailableState("留ㅼ묶???⑥뼱 ?곗씠?곌? ?놁뼱???쒖옉?????놁뒿?덈떎.");
  },
  onPageOpened: ({ isInitialPage }) => {
    if (isInitialPage) {
      scrollMatchBoardIntoView();
    }
  },
  getTimeoutMessage: ({ isFinalPage }) => {
    if (isFinalPage) {
      return "?쒓컙??珥덇낵?섏뼱 ?⑥뼱 留ㅼ묶 寃곌낵瑜?諛섏쁺?덉뼱??";
    }

    return "?쒓컙??珥덇낵?섏뼱 ?ㅼ쓬 ?섏씠吏濡??대룞?좉쾶??";
  }
});

matchPreferences.level = getMatchLevel(matchPreferences.level);
matchPreferences.filter = getMatchFilter(matchPreferences.filter);
matchPreferences.part = getMatchPartFilter(matchPreferences.part, getBaseMatchPool(matchPreferences.level));
matchPreferences.totalCount = getMatchTotalCount(matchPreferences.totalCount);
matchPreferences.duration = getMatchDuration(matchPreferences.duration);
matchPreferences.optionsOpen = false;

function clearMatchTransitionTimer() {
  matchEngine.clearTransitionTimer();
}

function stopMatchRoundTimer() {
  matchEngine.stopRoundTimer();
}

function clearWrongMatchTimer() {
  matchEngine.clearWrongMatchTimer();
}

function clearAllMatchTimers() {
  matchEngine.clearAllTimers();
}

function refreshMatchPool() {
  const basePool = getBaseMatchPool(matchPreferences.level);
  matchPreferences.part = getMatchPartFilter(matchPreferences.part, basePool);
  matchPool = filterMatchPool(basePool, matchPreferences.filter, matchPreferences.part);
}

function getMatchPageCount() {
  return matchEngine.getPageCount();
}

function getMatchResolvedCount() {
  return matchEngine.getResolvedCount();
}

function getMatchResultCounts() {
  return matchEngine.getResultCounts();
}

function setMatchResultStatus(ids, status) {
  matchEngine.setResultStatus(ids, status);
}

function resetMatchResultStatus(ids) {
  setMatchResultStatus(ids, "pending");
}

function getCurrentPageItems(pageIndex = matchState.pageIndex) {
  return matchEngine.getCurrentPageItems(pageIndex);
}

function resetSelectedCards() {
  matchEngine.resetSelectedCards();
}

function resetCurrentPageState() {
  matchEngine.resetCurrentPageState();
}

function setMatchFeedback(message, tone = "") {
  const feedback = document.getElementById("match-feedback");

  if (!feedback) {
    return;
  }

  feedback.hidden = !message;
  feedback.textContent = message;
  feedback.classList.remove("is-success", "is-fail");

  if (tone) {
    feedback.classList.add(tone);
  }
}

function renderMatchActionCopy() {
  sharedMatchGame.renderActionCopy({
    buttonId: "match-new-round",
    labelId: "match-new-round-label",
    isResetState: matchState.hasStarted || matchState.showResults
  });
}

function renderMatchTimer() {
  const activeDuration = getMatchDuration(matchPreferences.duration);

  sharedMatchGame.renderTimer({
    timerId: "match-timer",
    duration: activeDuration,
    timeLeft: matchState.timeLeft
  });
}

function renderMatchStats() {
  const totalCount = matchState.sessionItems.length || getMatchTotalCount(matchPreferences.totalCount);

  sharedMatchGame.renderStats({
    progressId: "match-progress",
    resolvedCount: getMatchResolvedCount(),
    totalCount,
    renderTimer: renderMatchTimer
  });
}

function populateMatchFilterSelect(select, counts) {
  if (!select) {
    return;
  }

  select.innerHTML = "";

  matchFilterOptions.forEach((filter) => {
    const option = document.createElement("option");
    option.value = filter;
    option.textContent = `${matchFilterLabels[filter]} (${counts[filter] ?? 0})`;
    select.appendChild(option);
  });

  select.value = getMatchFilter(matchPreferences.filter);
}

function populateMatchPartSelect(select, parts, activePart) {
  if (!select) {
    return;
  }

  select.innerHTML = "";
  [{ value: "all", count: parts.reduce((sum, item) => sum + item.count, 0) }, ...parts].forEach((partOption) => {
    const option = document.createElement("option");
    const label = partOption.value === "all" ? "?꾩껜 ?덉궗" : partOption.value;
    option.value = partOption.value;
    option.textContent = `${label} (${partOption.count})`;
    select.appendChild(option);
  });

  select.value = activePart;
}

function renderMatchSettings() {
  const levelSelect = document.getElementById("match-level-select");
  const filterSelect = document.getElementById("match-filter-select");
  const partSelect = document.getElementById("match-part-select");
  const countSpinner = document.querySelector('[data-spinner-id="match-count"]');
  const timeSpinner = document.querySelector('[data-spinner-id="match-time"]');
  const basePool = getBaseMatchPool(matchPreferences.level);
  const filterCounts = getMatchFilterCounts(basePool);
  const activePart = getMatchPartFilter(matchPreferences.part, basePool);
  const availableParts = getAvailableMatchParts(basePool);
  const isSettingsLocked = matchState.hasStarted && !matchState.showResults;
  const shouldShowOptionsPanel = !isSettingsLocked && matchPreferences.optionsOpen !== false;

  sharedMatchGame.renderSettingsPanel({
    optionsShellId: "match-options-shell",
    optionsToggleId: "match-options-toggle",
    optionsPanelId: "match-options-panel",
    optionsSummaryId: "match-options-summary",
    summaryText: getMatchOptionsSummaryText(),
    isSettingsLocked,
    shouldShowOptionsPanel,
    selectConfigs: [
      {
        element: levelSelect,
        populate: (element) => {
          if (element) {
            element.value = getMatchLevel(matchPreferences.level);
          }
        },
        disabled: isSettingsLocked
      },
      {
        element: filterSelect,
        populate: (element) => populateMatchFilterSelect(element, filterCounts),
        disabled: isSettingsLocked
      },
      {
        element: partSelect,
        populate: (element) => populateMatchPartSelect(element, availableParts, activePart),
        disabled: isSettingsLocked
      }
    ],
    spinnerConfigs: [
      {
        spinner: countSpinner,
        options: matchTotalCountOptions,
        activeValue: getMatchTotalCount(matchPreferences.totalCount),
        formatValue: (value) => `${value}臾몄젣`,
        disabled: isSettingsLocked
      },
      {
        spinner: timeSpinner,
        options: matchDurationOptions,
        activeValue: getMatchDuration(matchPreferences.duration),
        formatValue: getMatchDurationLabel,
        disabled: isSettingsLocked
      }
    ],
    refreshPool: refreshMatchPool,
    updateActionAvailability: () => {
      setMatchActionAvailability(matchPool.length > 0);
    }
  });
}

function setMatchActionAvailability(startEnabled) {
  const newRound = document.getElementById("match-new-round");

  if (newRound) {
    newRound.disabled = !startEnabled;
  }
}

function scrollMatchBoardIntoView() {
  const board = document.getElementById("match-board");

  if (!board?.scrollIntoView) {
    return;
  }

  window.requestAnimationFrame(() => {
    board.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function createMatchCard(card, selectedId) {
  const button = document.createElement("button");
  const matched = matchState.matchedIds.includes(card.id);
  const wrong =
    (card.side === "left" && matchState.wrongLeft === card.id) ||
    (card.side === "right" && matchState.wrongRight === card.id);

  button.type = "button";
  button.className = "match-card";
  button.textContent = card.value;
  button.disabled = matched || matchState.isLocked || matchState.timedOut;

  if (selectedId === card.id) {
    button.classList.add("is-selected");
  }

  if (matched) {
    button.classList.add("is-matched");
  }

  if (wrong) {
    button.classList.add("is-wrong");
  }

  button.addEventListener("click", () => {
    handleMatchSelection(card);
  });

  return button;
}

function renderMatchBoard() {
  sharedMatchGame.renderBoard({
    leftListId: "match-left-list",
    rightListId: "match-right-list",
    leftCards: matchState.leftCards,
    rightCards: matchState.rightCards,
    selectedLeft: matchState.selectedLeft,
    selectedRight: matchState.selectedRight,
    createCard: createMatchCard,
    renderStats: renderMatchStats
  });
}

function getFilteredMatchResults(filter = getMatchResultFilter(matchState.resultFilter)) {
  return matchEngine.getFilteredResults(filter);
}

function renderMatchBulkActionButton(results) {
  const bulkActionButton = document.getElementById("match-result-bulk-action");
  const bulkActionLabel = document.getElementById("match-result-bulk-label");
  const bulkActionIcon = bulkActionButton?.querySelector(".material-symbols-rounded");

  if (!bulkActionButton || !bulkActionLabel || !bulkActionIcon) {
    return;
  }

  const uniqueIds = Array.from(new Set(results.map((item) => item.id).filter(Boolean)));
  const allSaved = uniqueIds.length > 0 && uniqueIds.every((id) => isWordSavedToMemorizationList(id));
  const actionLabel = allSaved ? "?꾩껜 鍮쇨린" : "?꾩껜 ?닿린";
  const actionTitle =
    uniqueIds.length === 0
      ? "吏湲??댁븘???⑥뼱媛 ?놁뼱??"
      : allSaved
        ? "吏湲?蹂댁씠???⑥뼱瑜??ㅼ떆 蹂쇰옒?붿뿉??紐⑤몢 類꾧쾶??"
        : "吏湲?蹂댁씠???⑥뼱瑜??ㅼ떆 蹂쇰옒?붿뿉 紐⑤몢 ?댁븘?섍쾶??";

  bulkActionButton.disabled = uniqueIds.length === 0;
  bulkActionButton.dataset.matchBulkAction = allSaved ? "remove" : "save";
  bulkActionButton.setAttribute("aria-label", actionTitle);
  bulkActionButton.title = actionTitle;
  bulkActionLabel.textContent = actionLabel;
  bulkActionIcon.textContent = allSaved ? "delete_sweep" : "bookmark_add";
}

function renderMatchResultFilterOptions(counts) {
  sharedMatchGame.renderResultFilterOptions({
    selectId: "match-result-filter",
    filters: matchResultFilterOptions,
    labels: matchResultFilterLabels,
    counts,
    activeFilter: getMatchResultFilter(matchState.resultFilter)
  });
}

function renderMatchResults() {
  const counts = getMatchResultCounts();
  const filteredResults = getFilteredMatchResults();

  sharedMatchGame.renderResultsView({
    resultViewId: "match-result-view",
    totalId: "match-result-total",
    correctId: "match-result-correct",
    wrongId: "match-result-wrong",
    emptyId: "match-result-empty",
    listId: "match-result-list",
    filterSelectId: "match-result-filter",
    bulkActionButtonId: "match-result-bulk-action",
    counts,
    filteredResults,
    activeFilter: getMatchResultFilter(matchState.resultFilter),
    filterLabels: matchResultFilterLabels,
    renderFilterOptions: renderMatchResultFilterOptions,
    renderBulkActionButton: renderMatchBulkActionButton,
    createItemMarkup: (item) => {
      const saved = isWordSavedToMemorizationList(item.id);
      const statusLabel = item.status === "correct" ? "?뺣떟" : "?ㅻ떟";
      const actionLabel = saved ? "?ㅼ떆 蹂쇰옒?붿뿉??鍮쇨린" : "?ㅼ떆 蹂쇰옒?붿뿉 ?닿린";
      const actionIcon = saved ? "delete" : "bookmark_add";

      return `
        <article class="match-result-item is-${item.status}">
          <div class="match-result-item-head">
            <div class="match-result-item-badges">
              <span class="match-result-badge is-${item.status}">${statusLabel}</span>
              <span class="match-result-level">${formatMatchLevelLabel(item.level)}</span>
            </div>
            <button
              class="secondary-btn match-save-btn icon-only-btn${saved ? " is-saved" : ""}"
              type="button"
              data-match-save="${item.id}"
              aria-label="${actionLabel}"
              aria-pressed="${saved ? "true" : "false"}"
              title="${actionLabel}"
            >
              <span class="material-symbols-rounded" aria-hidden="true">${actionIcon}</span>
            </button>
          </div>
          <div class="match-result-item-main">
            <strong>${item.reading}</strong>
            <p>${item.meaning}</p>
          </div>
        </article>
      `;
    }
  });
}

function renderMatchScreen() {
  sharedMatchGame.renderScreen({
    boardId: "match-board",
    emptyId: "match-empty",
    playViewId: "match-play-view",
    resultViewId: "match-result-view",
    feedbackId: "match-feedback",
    hasStarted: matchState.hasStarted,
    showResults: matchState.showResults,
    isReady: matchPool.length > 0,
    emptyReadyText: "以鍮꾨릱?ㅻ㈃ ?쒖옉?대낵源뚯슂?",
    emptyUnavailableText: "吏앸쭪異붽린瑜?以鍮꾪븯怨??덉뼱??",
    renderSettings: renderMatchSettings,
    renderActionCopy: renderMatchActionCopy,
    renderStats: renderMatchStats,
    renderResults: renderMatchResults,
    renderBoard: renderMatchBoard
  });
}

function startMatchRoundTimer() {
  matchEngine.startRoundTimer();
}

function enterMatchReadyState(message = "") {
  matchEngine.enterReadyState(message);
}

function openMatchPage(pageItems) {
  matchEngine.openPage(pageItems);
}

function showMatchResults() {
  matchEngine.showResults();
}

function moveToNextMatchPage() {
  matchEngine.moveToNextPage();
}

function buildMatchSessionItems() {
  refreshMatchPool();

  if (!matchPool.length) {
    return [];
  }

  const totalCount = Math.min(getMatchTotalCount(matchPreferences.totalCount), matchPool.length);
  return sharedMatchGame.shuffleItems(matchPool).slice(0, totalCount);
}

function startMatchSession(items = buildMatchSessionItems()) {
  matchEngine.startSession(items);
}

function replayCurrentMatchPage() {
  matchEngine.replayCurrentPage();
}

function replayCurrentMatchSet() {
  matchEngine.replayCurrentSet();
}

function renderMatchUnavailableState(message) {
  const leftList = document.getElementById("match-left-list");
  const rightList = document.getElementById("match-right-list");
  const resultList = document.getElementById("match-result-list");
  const resultEmpty = document.getElementById("match-result-empty");

  clearAllMatchTimers();
  matchState.sessionItems = [];
  matchState.pageItems = [];
  matchState.results = [];
  matchState.leftCards = [];
  matchState.rightCards = [];
  matchState.pageIndex = 0;
  matchState.hasStarted = false;
  matchState.showResults = false;
  resetCurrentPageState();

  if (leftList) {
    leftList.innerHTML = "";
  }

  if (rightList) {
    rightList.innerHTML = "";
  }

  if (resultList) {
    resultList.innerHTML = "";
  }

  if (resultEmpty) {
    resultEmpty.hidden = true;
  }

  setMatchActionAvailability(false);
  setMatchFeedback(message, "is-fail");
  renderMatchScreen();
}

function handleMatchSelection(card) {
  matchEngine.handleSelection(card);
}

function handleMatchTimeout() {
  matchEngine.handleTimeout();
}

function startNewMatchSession() {
  matchEngine.startNewSession();
}

function setMatchLevel(level) {
  const nextLevel = getMatchLevel(level);

  if (matchPreferences.level === nextLevel) {
    return;
  }

  matchPreferences.level = nextLevel;
  matchPreferences.part = getMatchPartFilter(matchPreferences.part, getBaseMatchPool(nextLevel));
  saveMatchPreferences();
  renderMatchSettings();
  enterMatchReadyState();
}

function setMatchFilterPreference(filter) {
  const nextFilter = getMatchFilter(filter);

  if (matchPreferences.filter === nextFilter) {
    return;
  }

  matchPreferences.filter = nextFilter;
  saveMatchPreferences();
  renderMatchSettings();
  enterMatchReadyState();
}

function setMatchPartPreference(part) {
  const nextPart = getMatchPartFilter(part, getBaseMatchPool(matchPreferences.level));

  if (matchPreferences.part === nextPart) {
    return;
  }

  matchPreferences.part = nextPart;
  saveMatchPreferences();
  renderMatchSettings();
  enterMatchReadyState();
}

function setMatchTotalCount(totalCount) {
  const nextCount = getMatchTotalCount(totalCount);

  if (matchPreferences.totalCount === nextCount) {
    return;
  }

  matchPreferences.totalCount = nextCount;
  saveMatchPreferences();
  renderMatchSettings();
  enterMatchReadyState();
}

function setMatchDuration(duration) {
  const nextDuration = getMatchDuration(duration);

  if (matchPreferences.duration === nextDuration) {
    return;
  }

  matchPreferences.duration = nextDuration;
  saveMatchPreferences();
  renderMatchSettings();
  enterMatchReadyState();
}

function setMatchResultFilter(filter) {
  const nextFilter = getMatchResultFilter(filter);

  if (matchState.resultFilter === nextFilter) {
    return;
  }

  matchState.resultFilter = nextFilter;
  renderMatchResults();
}

function handleMatchResetAction() {
  if (matchState.showResults) {
    replayCurrentMatchSet();
    return;
  }

  replayCurrentMatchPage();
}

function attachMatchEventListeners() {
  const newRound = document.getElementById("match-new-round");
  const optionsToggle = document.getElementById("match-options-toggle");
  const levelSelect = document.getElementById("match-level-select");
  const filterSelect = document.getElementById("match-filter-select");
  const partSelect = document.getElementById("match-part-select");
  const countSpinner = document.querySelector('[data-spinner-id="match-count"]');
  const timeSpinner = document.querySelector('[data-spinner-id="match-time"]');
  const resultFilterSelect = document.getElementById("match-result-filter");
  const resultBulkAction = document.getElementById("match-result-bulk-action");
  const resultList = document.getElementById("match-result-list");

  if (newRound) {
    newRound.addEventListener("click", startNewMatchSession);
  }

  sharedMatchGame.attachOptionsToggleListener(optionsToggle, () => {
    matchPreferences.optionsOpen = !matchPreferences.optionsOpen;
    saveMatchPreferences();
    renderMatchSettings();
  });

  sharedMatchGame.attachSelectChangeListener(levelSelect, setMatchLevel);
  sharedMatchGame.attachSelectChangeListener(filterSelect, setMatchFilterPreference);
  sharedMatchGame.attachSelectChangeListener(partSelect, setMatchPartPreference);
  sharedMatchGame.attachSpinnerListeners({
    spinner: countSpinner,
    options: matchTotalCountOptions,
    getCurrentValue: () => getMatchTotalCount(matchPreferences.totalCount),
    handler: setMatchTotalCount
  });
  sharedMatchGame.attachSpinnerListeners({
    spinner: timeSpinner,
    options: matchDurationOptions,
    getCurrentValue: () => getMatchDuration(matchPreferences.duration),
    handler: setMatchDuration
  });
  sharedMatchGame.attachSelectChangeListener(resultFilterSelect, setMatchResultFilter);
  sharedMatchGame.attachBulkActionListener({
    button: resultBulkAction,
    datasetKey: "matchBulkAction",
    getFilteredResults: getFilteredMatchResults,
    getItemId: (item) => item.id,
    onRemove: removeWordFromMemorizationList,
    onSave: saveWordToMemorizationList,
    afterChange: renderMatchResults
  });
  sharedMatchGame.attachResultSaveListener({
    list: resultList,
    buttonSelector: "[data-match-save]",
    getItemId: (button) => button.dataset.matchSave,
    isSaved: isWordSavedToMemorizationList,
    onRemove: removeWordFromMemorizationList,
    onSave: saveWordToMemorizationList,
    afterChange: renderMatchResults
  });
}

renderMatchSettings();
attachMatchEventListeners();
sharedMatchGame.attachStorageUpdateListener({
  [matchStorageKey]: () => {
    const nextPreferences = loadMatchPreferences();
    nextPreferences.optionsOpen = false;
    sharedMatchGame.replaceObjectContents(matchPreferences, nextPreferences);
    renderMatchSettings();
    enterMatchReadyState();
  },
  [studyStateStorageKey]: () => {
    renderMatchSettings();
    enterMatchReadyState();
  }
});
enterMatchReadyState();
