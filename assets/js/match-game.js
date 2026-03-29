const matchStorageKey = "japanote-match-state";
const studyStateStorageKey = "jlpt-compass-state";
const matchSourceLevels = ["N5", "N4", "N3"];
const matchLevelOptions = [...matchSourceLevels, "all"];
const matchDurationOptions = [0, 30, 45, 60];
const matchTotalCountOptions = [5, 10, 15, 20];
const matchResultFilterOptions = ["all", "correct", "wrong"];
const matchPageSize = 5;
const matchWrongFlashDuration = 520;
const matchPageTransitionDelay = 720;

const defaultMatchPreferences = {
  level: "N5",
  totalCount: 5,
  duration: 45,
  optionsOpen: true
};

const fallbackMatchPool = [
  { id: "match-fallback-1", level: "N5", reading: "たべる", meaning: "먹다" },
  { id: "match-fallback-2", level: "N5", reading: "いく", meaning: "가다" },
  { id: "match-fallback-3", level: "N5", reading: "みる", meaning: "보다" },
  { id: "match-fallback-4", level: "N5", reading: "がっこう", meaning: "학교" },
  { id: "match-fallback-5", level: "N5", reading: "ともだち", meaning: "친구" }
];

const matchResultFilterLabels = {
  all: "전체",
  correct: "맞춘 문제",
  wrong: "틀린 문제"
};

function loadMatchPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(matchStorageKey) || "{}");
    return {
      ...defaultMatchPreferences,
      ...saved
    };
  } catch (error) {
    return { ...defaultMatchPreferences };
  }
}

const matchPreferences = loadMatchPreferences();

function saveMatchPreferences() {
  localStorage.setItem(matchStorageKey, JSON.stringify(matchPreferences));
}

function loadSharedStudyState() {
  try {
    return JSON.parse(localStorage.getItem(studyStateStorageKey) || "{}");
  } catch (error) {
    return {};
  }
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
  localStorage.setItem(studyStateStorageKey, JSON.stringify(studyState));
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

function getMatchLevelLabel(level = matchPreferences.level) {
  const activeLevel = getMatchLevel(level);
  return activeLevel === "all" ? "전체" : activeLevel;
}

function getMatchTotalCount(value = matchPreferences.totalCount) {
  const numericValue = Number(value);
  return matchTotalCountOptions.includes(numericValue) ? numericValue : 5;
}

function getMatchDuration(value = matchPreferences.duration) {
  const numericValue = Number(value);
  return matchDurationOptions.includes(numericValue) ? numericValue : 45;
}

function getMatchDurationLabel(duration = matchPreferences.duration) {
  const activeDuration = Number(duration);
  return activeDuration <= 0 ? "천천히" : `${activeDuration}초`;
}

function getMatchOptionsSummaryText() {
  return [getMatchLevelLabel(), `${getMatchTotalCount()}문제`, getMatchDurationLabel()].join(" · ");
}

function getMatchResultFilter(value = matchState.resultFilter) {
  return matchResultFilterOptions.includes(value) ? value : "all";
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

function shuffleMatchItems(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildMatchPool(source) {
  return source
    .map((item) => ({
      id: normalizeMatchText(item.id || item.entry_id),
      level: normalizeMatchText(item._level || item.level) || "N5",
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
  showResults: false,
  resultFilter: "all"
};

let matchPool = [];
let wrongMatchTimer = null;
let matchRoundTimer = null;
let matchTransitionTimer = null;

matchPreferences.level = getMatchLevel(matchPreferences.level);
matchPreferences.totalCount = getMatchTotalCount(matchPreferences.totalCount);
matchPreferences.duration = getMatchDuration(matchPreferences.duration);
matchPreferences.optionsOpen = matchPreferences.optionsOpen !== false;

function clearMatchTransitionTimer() {
  if (!matchTransitionTimer) {
    return;
  }

  window.clearTimeout(matchTransitionTimer);
  matchTransitionTimer = null;
}

function stopMatchRoundTimer() {
  if (!matchRoundTimer) {
    return;
  }

  window.clearInterval(matchRoundTimer);
  matchRoundTimer = null;
}

function clearWrongMatchTimer() {
  if (!wrongMatchTimer) {
    return;
  }

  window.clearTimeout(wrongMatchTimer);
  wrongMatchTimer = null;
}

function clearAllMatchTimers() {
  clearMatchTransitionTimer();
  clearWrongMatchTimer();
  stopMatchRoundTimer();
}

function refreshMatchPool() {
  const nextPool = buildMatchPool(getMatchSource(matchPreferences.level));
  matchPool = nextPool.length >= matchPageSize ? nextPool : [...fallbackMatchPool];
}

function getMatchPageCount() {
  return Math.max(1, Math.ceil(matchState.sessionItems.length / matchPageSize));
}

function getMatchResolvedCount() {
  return matchState.results.filter((item) => item.status !== "pending").length;
}

function getMatchResultCounts() {
  return {
    all: matchState.results.length,
    correct: matchState.results.filter((item) => item.status === "correct").length,
    wrong: matchState.results.filter((item) => item.status === "wrong").length
  };
}

function setMatchResultStatus(ids, status) {
  const targetIds = new Set(ids);

  matchState.results = matchState.results.map((item) => {
    if (!targetIds.has(item.id)) {
      return item;
    }

    return {
      ...item,
      status
    };
  });
}

function resetMatchResultStatus(ids) {
  setMatchResultStatus(ids, "pending");
}

function getCurrentPageItems(pageIndex = matchState.pageIndex) {
  const startIndex = pageIndex * matchPageSize;
  return matchState.sessionItems.slice(startIndex, startIndex + matchPageSize);
}

function resetSelectedCards() {
  matchState.selectedLeft = null;
  matchState.selectedRight = null;
}

function resetCurrentPageState() {
  clearAllMatchTimers();
  resetSelectedCards();
  matchState.wrongLeft = null;
  matchState.wrongRight = null;
  matchState.matchedIds = [];
  matchState.isLocked = false;
  matchState.timedOut = false;
  matchState.timeLeft = getMatchDuration(matchPreferences.duration);
}

function setMatchFeedback(message, tone = "") {
  const feedback = document.getElementById("match-feedback");

  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.classList.remove("is-success", "is-fail");

  if (tone) {
    feedback.classList.add(tone);
  }
}

function renderMatchActionCopy() {
  const newRoundLabel = document.getElementById("match-new-round-label");
  const resetRoundLabel = document.getElementById("match-reset-round-label");
  const note = document.getElementById("match-actions-note");

  if (newRoundLabel) {
    newRoundLabel.textContent = "새 세트 시작";
  }

  if (resetRoundLabel) {
    resetRoundLabel.textContent = matchState.showResults ? "같은 세트 다시" : "현재 페이지 다시";
  }

  if (note) {
    note.textContent = matchState.showResults
      ? "새 세트는 문제 전체를 새로 뽑고, 같은 세트 다시는 방금 푼 문제들로 처음부터 다시 시작해요."
      : "새 세트는 문제 전체를 새로 뽑고, 현재 페이지 다시는 지금 보이는 단어만 처음부터 다시 시작해요.";
  }
}

function renderMatchTimer() {
  const timer = document.getElementById("match-timer");
  const activeDuration = getMatchDuration(matchPreferences.duration);

  if (!timer) {
    return;
  }

  timer.textContent = activeDuration <= 0 ? "천천히" : `${matchState.timeLeft}초`;
  timer.classList.toggle(
    "is-warning",
    activeDuration > 0 && matchState.timeLeft <= Math.max(10, Math.floor(activeDuration / 3))
  );
}

function renderMatchStats() {
  const progress = document.getElementById("match-progress");
  const totalCount = matchState.sessionItems.length || getMatchTotalCount(matchPreferences.totalCount);

  if (progress) {
    progress.textContent = `${getMatchResolvedCount()} / ${totalCount}`;
  }

  renderMatchTimer();
}

function renderMatchSettings() {
  const optionsShell = document.getElementById("match-options-shell");
  const optionsToggle = document.getElementById("match-options-toggle");
  const optionsPanel = document.getElementById("match-options-panel");
  const optionsSummary = document.getElementById("match-options-summary");

  if (optionsSummary) {
    optionsSummary.textContent = getMatchOptionsSummaryText();
  }

  if (optionsShell) {
    optionsShell.classList.toggle("is-open", matchPreferences.optionsOpen !== false);
  }

  if (optionsToggle) {
    optionsToggle.setAttribute("aria-expanded", String(matchPreferences.optionsOpen !== false));
  }

  if (optionsPanel) {
    optionsPanel.hidden = matchPreferences.optionsOpen === false;
    optionsPanel.setAttribute("aria-hidden", String(matchPreferences.optionsOpen === false));
  }

  document.querySelectorAll("[data-match-level]").forEach((button) => {
    const active = button.dataset.matchLevel === getMatchLevel(matchPreferences.level);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll("[data-match-count]").forEach((button) => {
    const active = Number(button.dataset.matchCount) === getMatchTotalCount(matchPreferences.totalCount);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll("[data-match-time]").forEach((button) => {
    const active = Number(button.dataset.matchTime) === getMatchDuration(matchPreferences.duration);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setMatchActionAvailability(enabled) {
  const newRound = document.getElementById("match-new-round");
  const resetRound = document.getElementById("match-reset-round");

  if (newRound) {
    newRound.disabled = !enabled;
  }

  if (resetRound) {
    resetRound.disabled = !enabled;
  }
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
  const leftList = document.getElementById("match-left-list");
  const rightList = document.getElementById("match-right-list");

  if (!leftList || !rightList) {
    return;
  }

  leftList.innerHTML = "";
  rightList.innerHTML = "";

  matchState.leftCards.forEach((card) => {
    leftList.appendChild(createMatchCard(card, matchState.selectedLeft));
  });
  matchState.rightCards.forEach((card) => {
    rightList.appendChild(createMatchCard(card, matchState.selectedRight));
  });

  renderMatchStats();
}

function getFilteredMatchResults(filter = getMatchResultFilter(matchState.resultFilter)) {
  if (filter === "correct") {
    return matchState.results.filter((item) => item.status === "correct");
  }

  if (filter === "wrong") {
    return matchState.results.filter((item) => item.status === "wrong");
  }

  return matchState.results;
}

function renderMatchResults() {
  const resultView = document.getElementById("match-result-view");
  const summary = document.getElementById("match-result-summary");
  const total = document.getElementById("match-result-total");
  const correct = document.getElementById("match-result-correct");
  const wrong = document.getElementById("match-result-wrong");
  const empty = document.getElementById("match-result-empty");
  const list = document.getElementById("match-result-list");
  const counts = getMatchResultCounts();
  const filteredResults = getFilteredMatchResults();
  const levelLabel = getMatchLevelLabel(matchPreferences.level);

  if (!resultView || !summary || !total || !correct || !wrong || !empty || !list) {
    return;
  }

  summary.textContent =
    counts.wrong === 0
      ? `${levelLabel} ${counts.all}문제 전부 맞혔어요. 암기할 단어가 있으면 바로 저장해둘까요?`
      : `${levelLabel} ${counts.all}문제 중 ${counts.correct}개 맞히고 ${counts.wrong}개 놓쳤어요.`;
  total.textContent = String(counts.all);
  correct.textContent = String(counts.correct);
  wrong.textContent = String(counts.wrong);

  document.querySelectorAll("[data-match-result-filter]").forEach((button) => {
    const filter = getMatchResultFilter(button.dataset.matchResultFilter);
    const count = button.querySelector("[data-match-result-count]");
    const active = filter === getMatchResultFilter(matchState.resultFilter);

    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));

    if (count) {
      count.textContent = String(counts[filter]);
    }
  });

  if (!filteredResults.length) {
    empty.hidden = false;
    empty.textContent = `${matchResultFilterLabels[getMatchResultFilter(matchState.resultFilter)]}가 없어요.`;
    list.innerHTML = "";
    return;
  }

  empty.hidden = true;
  list.innerHTML = filteredResults
    .map((item) => {
      const saved = isWordSavedToMemorizationList(item.id);
      const statusLabel = item.status === "correct" ? "맞춤" : "틀림";

      return `
        <article class="match-result-item is-${item.status}">
          <div class="match-result-item-head">
            <div class="match-result-item-badges">
              <span class="match-result-badge is-${item.status}">${statusLabel}</span>
              <span class="match-result-level">${item.level}</span>
            </div>
            <button class="secondary-btn match-save-btn" type="button" data-match-save="${item.id}" ${saved ? "disabled" : ""}>
              ${saved ? "암기 리스트 저장됨" : "암기 리스트에 저장"}
            </button>
          </div>
          <div class="match-result-item-main">
            <strong>${item.reading}</strong>
            <p>${item.meaning}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMatchScreen() {
  const playView = document.getElementById("match-play-view");
  const resultView = document.getElementById("match-result-view");

  if (playView) {
    playView.hidden = matchState.showResults;
  }

  if (resultView) {
    resultView.hidden = !matchState.showResults;
  }

  renderMatchActionCopy();
  renderMatchStats();

  if (matchState.showResults) {
    renderMatchResults();
  } else {
    renderMatchBoard();
  }
}

function startMatchRoundTimer() {
  const activeDuration = getMatchDuration(matchPreferences.duration);

  stopMatchRoundTimer();
  matchState.timeLeft = activeDuration;
  renderMatchTimer();

  if (activeDuration <= 0) {
    return;
  }

  matchRoundTimer = window.setInterval(() => {
    matchState.timeLeft = Math.max(0, matchState.timeLeft - 1);
    renderMatchTimer();

    if (matchState.timeLeft === 0) {
      stopMatchRoundTimer();
      handleMatchTimeout();
    }
  }, 1000);
}

function openMatchPage(pageItems) {
  matchState.showResults = false;
  matchState.pageItems = pageItems;
  resetCurrentPageState();
  matchState.leftCards = shuffleMatchItems(
    pageItems.map((item) => ({
      id: item.id,
      value: item.reading,
      side: "left"
    }))
  );
  matchState.rightCards = shuffleMatchItems(
    pageItems.map((item) => ({
      id: item.id,
      value: item.meaning,
      side: "right"
    }))
  );
  setMatchActionAvailability(true);
  setMatchFeedback(
    `왼쪽이랑 오른쪽에서 하나씩 골라 짝을 맞춰봐요. ${matchState.pageIndex + 1} / ${getMatchPageCount()} 페이지예요.`
  );
  renderMatchScreen();
  startMatchRoundTimer();
}

function showMatchResults() {
  clearAllMatchTimers();
  resetSelectedCards();
  matchState.showResults = true;
  matchState.isLocked = false;
  matchState.timedOut = false;
  setMatchActionAvailability(true);
  renderMatchScreen();
}

function queueMatchPageTransition(callback) {
  clearMatchTransitionTimer();
  matchTransitionTimer = window.setTimeout(() => {
    matchTransitionTimer = null;
    callback();
  }, matchPageTransitionDelay);
}

function moveToNextMatchPage() {
  matchState.pageIndex += 1;
  const nextItems = getCurrentPageItems(matchState.pageIndex);

  if (!nextItems.length) {
    showMatchResults();
    return;
  }

  openMatchPage(nextItems);
}

function buildMatchSessionItems() {
  refreshMatchPool();

  if (!matchPool.length) {
    return [];
  }

  const totalCount = Math.min(getMatchTotalCount(matchPreferences.totalCount), matchPool.length);
  return shuffleMatchItems(matchPool).slice(0, totalCount);
}

function startMatchSession(items = buildMatchSessionItems()) {
  clearAllMatchTimers();

  if (!items.length) {
    renderMatchUnavailableState("단어 데이터를 불러오는 중이에요. 잠시 후 다시 해볼까요?");
    return;
  }

  matchState.sessionItems = items.map((item) => ({ ...item }));
  matchState.results = items.map((item) => ({
    id: item.id,
    level: item.level,
    reading: item.reading,
    meaning: item.meaning,
    status: "pending"
  }));
  matchState.pageIndex = 0;
  matchState.resultFilter = "all";
  openMatchPage(getCurrentPageItems(0));
}

function replayCurrentMatchPage() {
  const currentItems = [...matchState.pageItems];

  if (!currentItems.length) {
    startMatchSession();
    return;
  }

  resetMatchResultStatus(currentItems.map((item) => item.id));
  openMatchPage(currentItems);
}

function replayCurrentMatchSet() {
  const sessionItems = [...matchState.sessionItems];

  if (!sessionItems.length) {
    startMatchSession();
    return;
  }

  startMatchSession(sessionItems);
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
  matchState.pageIndex = 0;
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

function finalizeCompletedMatchPage() {
  matchState.isLocked = true;
  renderMatchBoard();

  if (matchState.pageIndex + 1 >= getMatchPageCount()) {
    setMatchFeedback("이번 페이지까지 다 맞혔어요. 결과로 바로 넘어갈게요!", "is-success");
    queueMatchPageTransition(showMatchResults);
    return;
  }

  setMatchFeedback("이번 페이지를 전부 맞혔어요. 다음 페이지로 넘어갈게요!", "is-success");
  queueMatchPageTransition(moveToNextMatchPage);
}

function handleSuccessfulMatch(id) {
  matchState.matchedIds.push(id);
  setMatchResultStatus([id], "correct");

  if (matchState.matchedIds.length === matchState.pageItems.length) {
    stopMatchRoundTimer();
    finalizeCompletedMatchPage();
    return;
  }

  setMatchFeedback("잘했어요! 다음 짝도 이어서 찾아봐요.", "is-success");
}

function handleFailedMatch() {
  setMatchFeedback("조금 아쉬워요. 다른 카드를 골라볼까요?", "is-fail");
}

function queueFailedMatchReset() {
  matchState.isLocked = true;
  renderMatchBoard();

  clearWrongMatchTimer();
  wrongMatchTimer = window.setTimeout(() => {
    matchState.wrongLeft = null;
    matchState.wrongRight = null;
    matchState.isLocked = false;
    resetSelectedCards();
    renderMatchBoard();
    wrongMatchTimer = null;
  }, matchWrongFlashDuration);
}

function handleMatchSelection(card) {
  if (matchState.isLocked || matchState.timedOut || matchState.matchedIds.includes(card.id)) {
    return;
  }

  if (card.side === "left") {
    matchState.selectedLeft = matchState.selectedLeft === card.id ? null : card.id;
  } else {
    matchState.selectedRight = matchState.selectedRight === card.id ? null : card.id;
  }

  renderMatchBoard();

  if (!matchState.selectedLeft || !matchState.selectedRight) {
    return;
  }

  if (matchState.selectedLeft === matchState.selectedRight) {
    handleSuccessfulMatch(matchState.selectedLeft);
    resetSelectedCards();
    renderMatchBoard();
    return;
  }

  matchState.wrongLeft = matchState.selectedLeft;
  matchState.wrongRight = matchState.selectedRight;
  handleFailedMatch();
  queueFailedMatchReset();
}

function handleMatchTimeout() {
  const remainingIds = matchState.pageItems
    .filter((item) => !matchState.matchedIds.includes(item.id))
    .map((item) => item.id);

  setMatchResultStatus(remainingIds, "wrong");
  matchState.timedOut = true;
  matchState.isLocked = true;
  resetSelectedCards();
  renderMatchBoard();

  if (matchState.pageIndex + 1 >= getMatchPageCount()) {
    setMatchFeedback("시간이 끝났어요. 남은 단어는 틀린 문제로 처리하고 결과로 넘어갈게요.", "is-fail");
    queueMatchPageTransition(showMatchResults);
    return;
  }

  setMatchFeedback("시간이 끝났어요. 지금 보이는 단어는 틀린 문제로 처리하고 다음 페이지로 갈게요.", "is-fail");
  queueMatchPageTransition(moveToNextMatchPage);
}

function startNewMatchSession() {
  startMatchSession();
}

function setMatchLevel(level) {
  const nextLevel = getMatchLevel(level);

  if (matchPreferences.level === nextLevel) {
    return;
  }

  matchPreferences.level = nextLevel;
  saveMatchPreferences();
  renderMatchSettings();
  startNewMatchSession();
}

function setMatchTotalCount(totalCount) {
  const nextCount = getMatchTotalCount(totalCount);

  if (matchPreferences.totalCount === nextCount) {
    return;
  }

  matchPreferences.totalCount = nextCount;
  saveMatchPreferences();
  renderMatchSettings();
  startNewMatchSession();
}

function setMatchDuration(duration) {
  const nextDuration = getMatchDuration(duration);

  if (matchPreferences.duration === nextDuration) {
    return;
  }

  matchPreferences.duration = nextDuration;
  saveMatchPreferences();
  renderMatchSettings();
  if (matchState.showResults) {
    replayCurrentMatchSet();
    return;
  }

  replayCurrentMatchPage();
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
  const resetRound = document.getElementById("match-reset-round");
  const optionsToggle = document.getElementById("match-options-toggle");
  const resultFilters = document.getElementById("match-result-filters");
  const resultList = document.getElementById("match-result-list");

  if (newRound) {
    newRound.addEventListener("click", startNewMatchSession);
  }

  if (resetRound) {
    resetRound.addEventListener("click", handleMatchResetAction);
  }

  if (optionsToggle) {
    optionsToggle.addEventListener("click", () => {
      matchPreferences.optionsOpen = !matchPreferences.optionsOpen;
      saveMatchPreferences();
      renderMatchSettings();
    });
  }

  document.querySelectorAll("[data-match-level]").forEach((button) => {
    button.addEventListener("click", () => {
      setMatchLevel(button.dataset.matchLevel);
    });
  });

  document.querySelectorAll("[data-match-count]").forEach((button) => {
    button.addEventListener("click", () => {
      setMatchTotalCount(button.dataset.matchCount);
    });
  });

  document.querySelectorAll("[data-match-time]").forEach((button) => {
    button.addEventListener("click", () => {
      setMatchDuration(button.dataset.matchTime);
    });
  });

  if (resultFilters) {
    resultFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-match-result-filter]");

      if (!button) {
        return;
      }

      setMatchResultFilter(button.dataset.matchResultFilter);
    });
  }

  if (resultList) {
    resultList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-match-save]");

      if (!button) {
        return;
      }

      saveWordToMemorizationList(button.dataset.matchSave);
      renderMatchResults();
    });
  }
}

renderMatchSettings();
attachMatchEventListeners();
startNewMatchSession();
