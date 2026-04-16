/* Japanote — characters / kana / writing (split from app.js, phase 5) */

let kanaContent = {};
let kanaStrokeSvgs = {};
let kanaStudyDecks = {
  hiragana: [],
  katakana: []
};
let writingPracticePools = {
  hiragana: [],
  katakana: []
};
let kanaDerivedCollectionsReady = false;

function normalizeKanaLibraryGroup(payload) {
  const group = payload && typeof payload === "object" ? payload : {};
  return {
    title: normalizeQuizText(group.title),
    items: Array.isArray(group.items)
      ? group.items
          .map((item) => {
            const normalizedItem = item && typeof item === "object" ? item : {};
            const reading = normalizeQuizText(normalizedItem.reading);
            const char = normalizeQuizText(normalizedItem.char);

            if (!reading || !char) {
              return null;
            }

            return {
              reading,
              char,
              quiz: normalizedItem.quiz !== false,
              group: normalizeQuizText(normalizedItem.group || group.title)
            };
          })
          .filter(Boolean)
      : []
  };
}

function normalizeKanaLibrary(payload) {
  return Array.isArray(payload) ? payload.map((group) => normalizeKanaLibraryGroup(group)) : [];
}

function normalizeKanaContent(payload) {
  const normalized = payload && typeof payload === "object" ? payload : {};

  return {
    library: {
      hiragana: normalizeKanaLibrary(normalized.library?.hiragana),
      katakana: normalizeKanaLibrary(normalized.library?.katakana)
    },
    tracks: {
      hiragana: normalizeBasicPracticeTrackOrNull(normalized.tracks?.hiragana),
      katakana: normalizeBasicPracticeTrackOrNull(normalized.tracks?.katakana)
    }
  };
}

function normalizeKanaStrokeContent(payload) {
  return payload && typeof payload === "object" ? payload : {};
}
function refreshKanaContentState(payload) {
  const normalized = normalizeKanaContent(payload || {});
  kanaContent = normalized;
  kanaStudyDecks = {
    hiragana: normalizeKanaLibrary(normalized.library?.hiragana),
    katakana: normalizeKanaLibrary(normalized.library?.katakana)
  };

  applyKanaTracksToBasicPractice(normalized);

  if (kanaDerivedCollectionsReady) {
    refreshWritingPracticePools();
  }
}

function refreshKanaStrokeContent(payload) {
  kanaStrokeSvgs = normalizeKanaStrokeContent(payload || {});
}
function isCharactersPage() {
  if (typeof document === "undefined") {
    return false;
  }

  return Boolean(document.getElementById("hiragana-table") || document.getElementById("writing-practice-shell"));
}


function loadKanaDataFromJson() {
  if (!isCharactersPage()) {
    refreshKanaContentState(kanaContent);
    return Promise.resolve(null);
  }

  return fetchJsonData("kana.json", "kana.json")
    .then((payload) => {
      refreshKanaContentState(payload || {});
      return payload;
    })
    .catch((error) => {
      console.warn("Failed to load kana.json. Using empty kana data.", error);
      refreshKanaContentState({});
      return null;
    });
}

function loadKanaStrokeDataFromJson() {
  if (!isCharactersPage()) {
    refreshKanaStrokeContent(kanaStrokeSvgs);
    return Promise.resolve(null);
  }

  return fetchJsonData("kana-strokes.json", "kana-strokes.json")
    .then((payload) => {
      refreshKanaStrokeContent(payload || {});
      return payload;
    })
    .catch((error) => {
      console.warn("Failed to load kana-strokes.json. Using empty kana stroke data.", error);
      refreshKanaStrokeContent({});
      return null;
    });
}
function getCharactersTab(value) {
  return ["library", "quiz", "writing"].includes(value) ? value : "library";
}
function getCharactersLibraryTab(value) {
  return value === "katakana" ? "katakana" : "hiragana";
}
function getWritingPracticeOrder(value) {
  return value === "random" ? "random" : "sequence";
}

const kanaQuizSettings = {
  mode: "hiragana",
  count: 10,
  duration: 5
};
const kanaQuizCountOptions = [10, 20, 30, "all"];
const kanaQuizDurationOptions = [5, 10, 15, 0];

const kanaQuizSheetState = {
  open: false,
  mode: "hiragana",
  sessionIndex: 0,
  sessionItems: [],
  answered: false,
  finished: false,
  results: [],
  resultFilter: "all"
};

const kanaQuizResultFilterLabels = {
  all: "전체",
  correct: "정답",
  wrong: "오답"
};

const STUDY_READY_TO_START_HINT = "준비됐다면 시작해봐요";
const STUDY_NO_CONTENT_LEVEL_HINT = "아직 보여줄 내용이 없어요. 다른 레벨로 바꿔보세요.";

function getStudyPracticeResultEmptyMessage(activeFilter) {
  if (activeFilter === "correct") {
    return "아직 정답 결과가 없어요. 문제를 더 풀어볼까요?";
  }

  if (activeFilter === "wrong") {
    return "지금은 오답이 없어요. 이 흐름 좋네요.";
  }

  return "아직 결과가 없어요. 문제를 풀고 다시 확인해봐요.";
}

function getKanaQuizModeLabel(mode) {
  if (mode === "random") {
    return "랜덤";
  }

  return mode === "katakana" ? "카타카나" : "히라가나";
}

const vocabFilterLabels = {
  all: "전체",
  review: "다시 볼래요",
  mastered: "익혔어요",
  unmarked: "아직 안 봤어요"
};

/** Mirrors assets/js/app-copy.js when that script is absent or fails. */
const japanoteCopyFallback = {
  vocab: {
    study: {
      N5: {
        title: "N5 단어를 차근차근 익혀봐요",
        description: "자주 쓰는 단어를 익히고, 퀴즈와 짝 맞추기로 다시 복습해봐요."
      },
      N4: {
        title: "N4 단어를 차근차근 익혀봐요",
        description: "조금 더 넓어진 표현을 익히고, 퀴즈로 다시 확인해봐요."
      },
      N3: {
        title: "N3 단어를 차근차근 익혀봐요",
        description: "실전에서 자주 만나는 N3 단어를 익히고 복습해봐요."
      },
      all: {
        title: "전체 단어를 한 번에 익혀봐요",
        description: "N5부터 N3까지 섞어서 단어를 익히고 다시 복습해봐요."
      }
    },
    quiz: {
      N5: {
        title: "N5 단어 퀴즈로 가볍게 확인해봐요",
        description: "익힌 단어를 문제로 다시 확인해봐요."
      },
      N4: {
        title: "N4 단어 퀴즈로 감각을 올려봐요",
        description: "N4 단어를 뜻과 표현으로 다시 확인해봐요."
      },
      N3: {
        title: "N3 단어 퀴즈로 실전 감각을 익혀봐요",
        description: "실전에서 자주 나오는 단어를 문제로 점검해봐요."
      },
      all: {
        title: "전체 단어 퀴즈로 한 번에 복습해봐요",
        description: "N5부터 N3까지 섞어서 문제로 다시 확인해봐요."
      }
    },
    match: {
      title: "단어 짝 맞추기로 가볍게 복습해봐요",
      description: "단어와 뜻을 연결하면서 배운 내용을 다시 확인해봐요."
    }
  },
  kanji: {
    list: {
      title: "기초 한자를 차근차근 익혀봐요",
      description: "자주 나오는 한자를 보고, 퀴즈와 짝 맞추기로 가볍게 복습해봐요."
    },
    practice: {
      title: "한자 퀴즈로 다시 확인해봐요",
      description: "배운 한자를 문제로 다시 확인해봐요."
    },
    match: {
      title: "한자 짝 맞추기로 가볍게 복습해봐요",
      description: "한자와 뜻, 읽기를 연결하면서 다시 익혀봐요."
    }
  },
  buttons: {
    start: "시작해볼까요?",
    restart: "다시 해볼까요?",
    nextQuestion: "다음 문제 볼까요?",
    nextPassage: "다음 글 볼까요?",
    rereadPassage: "다시 읽어볼까요?",
    result: "결과 볼까요?",
    reviewSave: "다시 보기로 표시",
    reviewRemove: "다시 보기 해제",
    masteredSave: "익힘으로 표시",
    masteredRemove: "익힘 해제"
  }
};

function getJapanoteCopy() {
  const fromGlobal = globalThis.japanoteCopy;
  return fromGlobal && typeof fromGlobal === "object" ? fromGlobal : japanoteCopyFallback;
}

function getJapanoteButtonLabel(key) {
  const fallback = japanoteCopyFallback.buttons || {};
  const from = getJapanoteCopy().buttons;
  const value = from?.[key] ?? fallback[key];
  return typeof value === "string" && value.length > 0 ? value : "";
}

function resolveHeadingNode(node, fallback) {
  const title =
    node && typeof node.title === "string" && node.title.length > 0 ? node.title : fallback.title;
  const description =
    node && typeof node.description === "string" ? node.description : fallback.description;
  return { title, description };
}

function buildLevelHeadingMap(sourceLevels, fallbackLevels) {
  return {
    N5: resolveHeadingNode(sourceLevels?.N5, fallbackLevels.N5),
    N4: resolveHeadingNode(sourceLevels?.N4, fallbackLevels.N4),
    N3: resolveHeadingNode(sourceLevels?.N3, fallbackLevels.N3),
    all: resolveHeadingNode(sourceLevels?.all, fallbackLevels.all)
  };
}

const japanoteCopyRoot = getJapanoteCopy();
const vocabHeadingCopy = buildLevelHeadingMap(
  japanoteCopyRoot.vocab?.study,
  japanoteCopyFallback.vocab.study
);
const quizHeadingCopy = buildLevelHeadingMap(
  japanoteCopyRoot.vocab?.quiz,
  japanoteCopyFallback.vocab.quiz
);
const matchHeadingCopy = resolveHeadingNode(
  japanoteCopyRoot.vocab?.match,
  japanoteCopyFallback.vocab.match
);

function getVocabItemPart(item) {
  return normalizeQuizText(item?.part) || "기타";
}

function getKanaQuizPool(mode) {
  if (mode === "random") {
    return [
      ...(basicPracticeSets.hiragana?.items || []),
      ...(basicPracticeSets.katakana?.items || [])
    ];
  }

  return basicPracticeSets[mode]?.items || [];
}

function getKanaQuizCountValue(value, total) {
  if (value === "all") {
    return total;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Math.min(10, total);
  }

  return Math.min(parsed, total);
}

function buildKanaQuizSession(mode = kanaQuizSettings.mode) {
  const pool = getKanaQuizPool(mode);
  const count = getKanaQuizCountValue(kanaQuizSettings.count, pool.length);
  return shuffleQuizArray(pool).slice(0, count);
}

function getKanaQuizSheetCurrentItem() {
  const items = kanaQuizSheetState.sessionItems;
  const index = kanaQuizSheetState.sessionIndex;

  if (!items.length || index >= items.length) {
    return null;
  }

  return {
    mode: kanaQuizSheetState.mode,
    index,
    total: items.length,
    item: items[index]
  };
}

function getKanaQuizCountLabel(count) {
  return String(count) === "all" ? "전부" : `${count}문제`;
}

function getKanaQuizDurationLabel(duration) {
  return Number(duration) <= 0 ? "천천히" : `${duration}초`;
}

function getKanaQuizResultFilter(value = kanaQuizSheetState.resultFilter) {
  return Object.prototype.hasOwnProperty.call(kanaQuizResultFilterLabels, value) ? value : "all";
}

function getKanaQuizResultCounts() {
  return {
    all: kanaQuizSheetState.results.length,
    correct: kanaQuizSheetState.results.filter((item) => item.status === "correct").length,
    wrong: kanaQuizSheetState.results.filter((item) => item.status === "wrong").length
  };
}

function getFilteredKanaQuizResults(filter = getKanaQuizResultFilter(kanaQuizSheetState.resultFilter)) {
  const activeFilter = getKanaQuizResultFilter(filter);

  if (activeFilter === "all") {
    return [...kanaQuizSheetState.results];
  }

  return kanaQuizSheetState.results.filter((item) => item.status === activeFilter);
}

function setKanaQuizResult(current, selectedIndex, correct, timedOut = false) {
  const reading = current.item.options[current.item.answer] || current.item.displaySub || "";
  const selected = timedOut ? "" : current.item.options[selectedIndex] || "";
  const result = {
    id: current.item.id,
    source: current.item.source,
    char: current.item.display,
    reading,
    selected,
    status: correct ? "correct" : "wrong",
    timedOut
  };
  const existingIndex = kanaQuizSheetState.results.findIndex((item) => item.id === current.item.id);

  if (existingIndex >= 0) {
    kanaQuizSheetState.results[existingIndex] = result;
    return;
  }

  kanaQuizSheetState.results.push(result);
}

function renderKanaQuizResultFilterOptions(counts) {
  syncResultFilterButtons({
    resultViewId: "kana-quiz-result-view",
    activeValue: getKanaQuizResultFilter(kanaQuizSheetState.resultFilter)
  });
}

function renderKanaQuizResults() {
  const total = document.getElementById("kana-quiz-result-total");
  const correct = document.getElementById("kana-quiz-result-correct-count");
  const wrong = document.getElementById("kana-quiz-result-wrong-count");
  const empty = document.getElementById("kana-quiz-result-empty");
  const list = document.getElementById("kana-quiz-result-list");
  const counts = getKanaQuizResultCounts();
  const filteredResults = getFilteredKanaQuizResults();

  if (!total || !correct || !wrong || !empty || !list) {
    return;
  }

  total.textContent = String(counts.all);
  correct.textContent = String(counts.correct);
  wrong.textContent = String(counts.wrong);
  renderKanaQuizResultFilterOptions(counts);

  if (!filteredResults.length) {
    empty.hidden = false;
    empty.textContent = getStudyPracticeResultEmptyMessage(getKanaQuizResultFilter(kanaQuizSheetState.resultFilter));
    list.innerHTML = "";
    return;
  }

  empty.hidden = true;
  list.innerHTML = filteredResults
    .map((item) => {
      const statusLabel = item.timedOut ? "시간초과" : item.status === "correct" ? "정답" : "오답";
      const detail =
        item.status === "correct"
          ? `정답: ${formatQuizLineBreaks(item.reading)}`
          : `선택: ${formatQuizLineBreaks(item.selected || "미응답")} · 정답: ${formatQuizLineBreaks(item.reading)}`;

      return `
        <article class="match-result-item is-${item.status}">
          <div class="match-result-item-head">
            <div class="match-result-item-badges">
              <span class="match-result-badge is-${item.status}">${statusLabel}</span>
              <span class="match-result-level">${formatQuizLineBreaks(item.source || getKanaQuizModeLabel(kanaQuizSheetState.mode))}</span>
            </div>
          </div>
          <div class="match-result-item-main">
            <strong>${formatQuizLineBreaks(item.char)} · ${formatQuizLineBreaks(item.reading)}</strong>
            <p>${detail}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderKanaQuizSetup() {
  const setupShell = document.getElementById("kana-setup-shell");
  const setupToggle = document.getElementById("kana-setup-toggle");
  const setupPanel = document.getElementById("kana-setup-panel");
  const setupSummary = document.getElementById("kana-setup-summary");
  const startButton = document.getElementById("kana-setup-start");
  const startLabel = document.getElementById("kana-setup-start-label");
  const countSpinner = document.querySelector('[data-spinner-id="kana-quiz-count"]');
  const timeSpinner = document.querySelector('[data-spinner-id="kana-quiz-time"]');
  const isOpen = state.kanaSetupOpen === true;
  const modeButtons = document.querySelectorAll("[data-kana-mode]");
  const isSettingsLocked = kanaQuizSheetState.open && !kanaQuizSheetState.finished;
  const canStart = getKanaQuizPool(kanaQuizSettings.mode).length > 0;
  const summaryText = [
    getKanaQuizModeLabel(kanaQuizSettings.mode),
    getKanaQuizCountLabel(kanaQuizSettings.count),
    getKanaQuizDurationLabel(kanaQuizSettings.duration)
  ].join(" · ");

  syncSelectionButtonState(modeButtons, (button) => button.dataset.kanaMode, kanaQuizSettings.mode);
  modeButtons.forEach((button) => {
    button.disabled = isSettingsLocked;
  });
  if (getCharactersTab(state.charactersTab) === "quiz") {
    renderCharactersPageHeader("quiz");
  }
  renderStudyOptionsControls({
    shell: setupShell,
    toggle: setupToggle,
    panel: setupPanel,
    summary: setupSummary,
    summaryText,
    isLocked: isSettingsLocked,
    isOpen,
    spinnerConfigs: [
      {
        spinner: countSpinner,
        options: kanaQuizCountOptions,
        activeValue: kanaQuizSettings.count,
        formatValue: getKanaQuizCountLabel,
        disabled: isSettingsLocked
      },
      {
        spinner: timeSpinner,
        options: kanaQuizDurationOptions,
        activeValue: kanaQuizSettings.duration,
        formatValue: getKanaQuizDurationLabel,
        disabled: isSettingsLocked
      }
    ],
    actionButton: {
      button: startButton,
      label: startLabel,
      isStarted: kanaQuizSheetState.open,
      canStart
    }
  });
}

function startKanaQuizSession(mode = kanaQuizSettings.mode) {
  window.japanoteChallengeLinks?.clearActiveChallenge?.("kana-quiz-result-view");
  const nextMode = ["hiragana", "katakana", "random"].includes(mode) ? mode : "hiragana";
  kanaQuizSettings.mode = nextMode;
  kanaQuizSheetState.mode = nextMode;
  kanaQuizSheetState.sessionItems = buildKanaQuizSession(nextMode);
  kanaQuizSheetState.sessionIndex = 0;
  kanaQuizSheetState.answered = false;
  kanaQuizSheetState.finished = false;
  kanaQuizSheetState.open = true;
  kanaQuizSheetState.results = [];
  kanaQuizSheetState.resultFilter = "all";

  setQuizSessionDuration("kana", Number(kanaQuizSettings.duration));
  resetQuizSessionScore("kana");

  renderKanaQuizSetup();
  renderQuizSessionHud("kana");
  renderKanaQuizSheet();
  resetQuizSessionTimer("kana", handleKanaQuizTimeout);
}

function openKanaQuizSheet(mode) {
  state.charactersTab = "quiz";
  saveState();
  renderCharactersPageLayout();
  startKanaQuizSession(mode);

  const quizPanel = document.getElementById("characters-tab-panel-quiz");
  if (quizPanel) {
    quizPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function closeKanaQuizSheet() {
  kanaQuizSheetState.open = false;
  stopQuizSessionTimer("kana");
  renderKanaQuizSetup();
  renderKanaQuizSheet();
}

function renderKanaQuizSheet() {
  if (flushPendingExternalStudyStateIfIdle()) {
    return;
  }

  const practiceView = document.getElementById("kana-quiz-practice-view");
  const card = document.getElementById("kana-quiz-card");
  const empty = document.getElementById("kana-quiz-empty");
  const resultView = document.getElementById("kana-quiz-result-view");
  const source = document.getElementById("kana-quiz-sheet-source");
  const progress = document.getElementById("kana-quiz-sheet-progress");
  const promptBox = document.getElementById("kana-quiz-sheet-copy");
  const note = document.getElementById("kana-quiz-sheet-note");
  const prompt = document.getElementById("kana-quiz-sheet-prompt");
  const display = document.getElementById("kana-quiz-sheet-display");
  const displaySub = document.getElementById("kana-quiz-sheet-display-sub");
  const options = document.getElementById("kana-quiz-options");
  const feedback = document.getElementById("kana-quiz-feedback");
  const explanation = document.getElementById("kana-quiz-explanation");
  const next = document.getElementById("kana-quiz-next");

  if (!practiceView || !card || !empty || !resultView || !source || !progress || !promptBox || !note || !prompt || !display || !displaySub || !options || !feedback || !explanation || !next) {
    return;
  }

  const current = getKanaQuizSheetCurrentItem();

  empty.hidden = kanaQuizSheetState.open;
  practiceView.hidden = !kanaQuizSheetState.open || kanaQuizSheetState.finished;
  practiceView.setAttribute("aria-hidden", String(practiceView.hidden));
  card.hidden = !kanaQuizSheetState.open || kanaQuizSheetState.finished;
  resultView.hidden = !kanaQuizSheetState.open || !kanaQuizSheetState.finished;
  resultView.setAttribute("aria-hidden", String(resultView.hidden));

  if (!kanaQuizSheetState.open) {
    feedback.textContent = "";
    explanation.textContent = "";
    explanation.hidden = true;
    return;
  }

  if (kanaQuizSheetState.finished) {
    renderKanaQuizResults();
    return;
  }

  if (!current) {
    source.textContent = "-";
    progress.textContent = "-";
    promptBox.hidden = true;
    note.hidden = true;
    note.textContent = "";
    prompt.textContent = "";
    display.textContent = "-";
    displaySub.textContent = "";
    options.innerHTML = "";
    options.hidden = false;
    feedback.textContent = "";
    explanation.textContent = "";
    explanation.hidden = true;
    next.disabled = true;
    return;
  }

  source.textContent = formatQuizLineBreaks(current.item.source);
  progress.textContent = `${current.index + 1} / ${current.total}`;
  promptBox.hidden = true;
  note.hidden = true;
  note.textContent = "";
  prompt.textContent = "";
  display.textContent = formatQuizLineBreaks(current.item.display || "-");
  displaySub.textContent = "";
  feedback.textContent = "";
  explanation.textContent = "";
  explanation.hidden = true;
  options.hidden = false;
  next.disabled = true;
  next.textContent =
    current.index + 1 >= current.total ? getJapanoteButtonLabel("result") : getJapanoteButtonLabel("nextQuestion");

  options.innerHTML = "";
  current.item.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    button.type = "button";
    button.className = "basic-practice-option kana-quiz-option";
    button.dataset.kanaQuizOption = String(optionIndex);
    label.className = "button-text-clamp";
    label.textContent = formatQuizLineBreaks(option);
    button.appendChild(label);
    button.addEventListener("click", () => handleKanaQuizSheetAnswer(optionIndex));
    options.appendChild(button);
  });
}

function finalizeKanaQuizAnswer(correct) {
  kanaQuizSheetState.answered = true;
  finalizeQuizSession("kana", correct);

  const next = document.getElementById("kana-quiz-next");
  if (next) {
    next.disabled = false;
    next.focus();
  }
}

function handleKanaQuizSheetAnswer(index) {
  const current = getKanaQuizSheetCurrentItem();
  if (!current || kanaQuizSheetState.answered || quizSessions.kana.isPaused) {
    return;
  }

  const optionButtons = document.querySelectorAll("[data-kana-quiz-option]");
  const correct = index === current.item.answer;

  optionButtons.forEach((item, optionIndex) => {
    item.disabled = true;
    if (optionIndex === current.item.answer) {
      item.classList.add("is-correct");
    }
    if (optionIndex === index && !correct) {
      item.classList.add("is-wrong");
    }
  });

  const feedback = document.getElementById("kana-quiz-feedback");
  const explanation = document.getElementById("kana-quiz-explanation");
  if (feedback) {
    feedback.textContent = "";
  }
  if (explanation) {
    explanation.textContent = "";
    explanation.hidden = true;
  }

  setKanaQuizResult(current, index, correct);
  finalizeKanaQuizAnswer(correct);
}

function handleKanaQuizTimeout() {
  const current = getKanaQuizSheetCurrentItem();
  if (!current || kanaQuizSheetState.answered) {
    return;
  }

  const optionButtons = document.querySelectorAll("[data-kana-quiz-option]");
  optionButtons.forEach((item, optionIndex) => {
    item.disabled = true;
    if (optionIndex === current.item.answer) {
      item.classList.add("is-correct");
    }
  });

  const feedback = document.getElementById("kana-quiz-feedback");
  const explanation = document.getElementById("kana-quiz-explanation");
  if (feedback) {
    feedback.textContent = "";
  }
  if (explanation) {
    explanation.textContent = "";
    explanation.hidden = true;
  }

  setKanaQuizResult(current, -1, false, true);
  finalizeKanaQuizAnswer(false);
}

function nextKanaQuizSheetQuestion() {
  const current = getKanaQuizSheetCurrentItem();

  if (kanaQuizSheetState.finished || !current) {
    startKanaQuizSession(kanaQuizSettings.mode);
    return;
  }

  if (!kanaQuizSheetState.answered) {
    const feedback = document.getElementById("kana-quiz-feedback");
    if (feedback) {
      feedback.textContent = "답을 고르면 다음으로 넘어가요.";
    }
    return;
  }

  if (current.index + 1 >= current.total) {
    kanaQuizSheetState.finished = true;
    renderKanaQuizSheet();
    return;
  }

  kanaQuizSheetState.sessionIndex += 1;
  kanaQuizSheetState.answered = false;
  renderKanaQuizSheet();
  resetQuizSessionTimer("kana", handleKanaQuizTimeout);
}

// kana.json이 바뀌면 문자표, 문자 퀴즈, 따라쓰기 풀이도 같은 원본으로 다시 맞춘다.
function refreshWritingPracticePools() {
  writingPracticePools = {
    hiragana: buildWritingPracticePool("hiragana"),
    katakana: buildWritingPracticePool("katakana")
  };
}

function renderKanaLibrary() {
  const sections = [
    {
      targetId: "hiragana-table",
      track: "hiragana"
    },
    {
      targetId: "katakana-table",
      track: "katakana"
    }
  ];

  sections.forEach((section) => {
    const container = document.getElementById(section.targetId);
    if (!container) {
      return;
    }

    const deck = kanaStudyDecks[section.track] || [];
    container.innerHTML = deck
      .map(
        (group) => `
          <section class="kana-group">
            <h4>${group.title}</h4>
            <div class="kana-grid">
              ${group.items
                .map(
                  (item) => `
                    <button class="kana-tile${item.quiz ? "" : " is-muted"}" type="button" data-writing-char="${item.char}" data-writing-script="${section.track}" aria-label="${item.char} 따라쓰기 바로 열기">
                      <strong>${item.char}</strong>
                      <span>${item.reading}</span>
                    </button>
                  `
                )
                .join("")}
            </div>
          </section>
        `
      )
      .join("");
  });

  document.querySelectorAll("[data-writing-char]").forEach((button) => {
    if (button.dataset.writingBound === "true") {
      return;
    }

    button.dataset.writingBound = "true";
    button.addEventListener("click", () => {
      openWritingPracticeForCharacter(button.dataset.writingChar, button.dataset.writingScript);
    });
  });
}

function getCharactersPageHeading(tab = getCharactersTab(state.charactersTab)) {
  if (tab === "writing") {
    return {
      title: "문자를 직접 따라쓰며 손에 익혀봐요",
      description: ""
    };
  }

  if (tab === "quiz") {
    return {
      title: `${getKanaQuizModeLabel(kanaQuizSettings.mode)} 퀴즈, 풀어볼까요?`,
      description: ""
    };
  }

  return {
    title: "문자부터 차근차근 익혀봐요",
    description: "히라가나와 카타카나를 익히고, 퀴즈로 가볍게 복습해봐요."
  };
}

function renderCharactersPageHeader(tab = getCharactersTab(state.charactersTab)) {
  applyPageHeading(
    document.getElementById("characters-page-title"),
    document.getElementById("characters-page-copy"),
    getCharactersPageHeading(tab)
  );
}

function renderCharactersPageLayout() {
  const activeTab = getCharactersTab(state.charactersTab);
  const libraryTab = getCharactersLibraryTab(state.charactersLibraryTab);

  renderCharactersPageHeader(activeTab);

  document.querySelectorAll("[data-characters-tab]").forEach((button) => {
    const isActive = button.dataset.charactersTab === activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  document.querySelectorAll("[data-characters-tab-panel]").forEach((panel) => {
    const isActive = panel.dataset.charactersTabPanel === activeTab;
    panel.hidden = !isActive;
    panel.setAttribute("aria-hidden", String(!isActive));
  });

  document.querySelectorAll("[data-characters-library-tab]").forEach((button) => {
    const isActive = button.dataset.charactersLibraryTab === libraryTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  document.querySelectorAll("[data-characters-library-panel]").forEach((panel) => {
    const isActive = panel.dataset.charactersLibraryPanel === libraryTab;
    panel.hidden = !isActive;
    panel.setAttribute("aria-hidden", String(!isActive));
  });

  if (activeTab === "writing" && document.getElementById("writing-practice-shell")) {
    scheduleWritingPracticeLayout(false);
  }
}

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const writingPracticeSettings = {
  mode: "hiragana",
  order: "sequence"
};

const writingPracticeSvgTemplateCache = new Map();

const writingPracticeState = {
  sessionItems: [],
  sessionIndex: 0,
  guideVisible: true,
  answerVisible: false,
  isAnimating: false,
  isTransitioning: false,
  animationToken: 0,
  layoutFrame: null,
  pointerId: null,
  isDrawing: false,
  strokes: [],
  score: null,
  feedback: "연한 글자를 따라 천천히 써봐요.",
  tip: "가이드가 잘 보이게 천천히 크게 써봐요.",
  slotEntries: [],
  targetCanvas: document.createElement("canvas"),
  overlayHasInk: false,
  overlayBounds: null,
  hasVectorGuide: false,
  renderSeed: 0,
  layoutObserver: null
};

function getWritingPracticeDefaultFeedback() {
  return "연한 글자를 따라 천천히 써봐요.";
}

function getWritingPracticeDefaultTip() {
  return "가이드가 잘 보이게 천천히 크게 써봐요.";
}

function beginWritingPracticeTransition() {
  writingPracticeState.isTransitioning = true;
}

function endWritingPracticeTransition() {
  writingPracticeState.isTransitioning = false;
}

function getWritingPracticeModeLabel(mode = writingPracticeSettings.mode) {
  if (mode === "random") {
    return "랜덤";
  }

  return mode === "katakana" ? "카타카나" : "히라가나";
}

function getWritingPracticeOrderLabel(order = writingPracticeSettings.order) {
  return getWritingPracticeOrder(order) === "random" ? "랜덤 순서" : "순서대로";
}

function renderWritingPracticeSetup() {
  const setupShell = document.getElementById("writing-setup-shell");
  const setupToggle = document.getElementById("writing-setup-toggle");
  const setupPanel = document.getElementById("writing-setup-panel");
  const setupSummary = document.getElementById("writing-setup-summary");
  const isOpen = state.writingSetupOpen === true;
  const summaryText = [
    getWritingPracticeModeLabel(writingPracticeSettings.mode),
    getWritingPracticeOrderLabel(writingPracticeSettings.order)
  ].join(" · ");

  renderOpenableSettingsSection({
    shell: setupShell,
    toggle: setupToggle,
    panel: setupPanel,
    summary: setupSummary,
    summaryText,
    isOpen
  });
}

function buildWritingPracticePool(script) {
  const label = script === "katakana" ? "카타카나" : "히라가나";
  const deck = kanaStudyDecks[script] || [];

  return deck.flatMap((group, groupIndex) =>
    group.items
      .filter((item) => item.quiz !== false)
      .map((item, itemIndex) => ({
        id: `writing-${script}-${groupIndex}-${itemIndex}`,
        script,
        group: group.title,
        char: item.char,
        reading: item.reading,
        source: `${label} · ${group.title}`
      }))
  );
}

kanaDerivedCollectionsReady = true;
refreshWritingPracticePools();

function buildWritingPracticeSession(mode = writingPracticeSettings.mode, order = writingPracticeSettings.order) {
  const nextOrder = getWritingPracticeOrder(order);
  const items =
    mode === "random"
      ? [...writingPracticePools.hiragana, ...writingPracticePools.katakana]
      : [...(writingPracticePools[mode] || writingPracticePools.hiragana)];

  return nextOrder === "random" ? shuffleQuizArray(items) : items;
}

function ensureWritingPracticeSession() {
  if (!writingPracticeState.sessionItems.length) {
    writingPracticeState.sessionItems = buildWritingPracticeSession(
      writingPracticeSettings.mode,
      writingPracticeSettings.order
    );
    writingPracticeState.sessionIndex = 0;
  }
}

function getCurrentWritingPracticeItem() {
  ensureWritingPracticeSession();

  if (!writingPracticeState.sessionItems.length) {
    return null;
  }

  return writingPracticeState.sessionItems[writingPracticeState.sessionIndex] || null;
}

function cancelWritingPracticeAnimation() {
  writingPracticeState.animationToken += 1;
  writingPracticeState.isAnimating = false;
}

function resetWritingPracticeRound() {
  cancelWritingPracticeAnimation();
  writingPracticeState.pointerId = null;
  writingPracticeState.isDrawing = false;
  writingPracticeState.guideVisible = true;
  writingPracticeState.answerVisible = false;
  writingPracticeState.strokes = [];
  resetWritingOverlayCanvas();
  writingPracticeState.score = null;
  writingPracticeState.feedback = getWritingPracticeDefaultFeedback();
  writingPracticeState.tip = getWritingPracticeDefaultTip();
}

const writingPracticeCompoundFollowers = new Set(["ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ"]);

function splitWritingPracticeUnits(text = "") {
  return Array.from(text).reduce((units, character) => {
    if (writingPracticeCompoundFollowers.has(character) && units.length) {
      units[units.length - 1] += character;
      return units;
    }

    units.push(character);
    return units;
  }, []);
}

function rewriteSvgReference(value, idMap) {
  if (!value) {
    return value;
  }

  if (value.startsWith("url(#") && value.endsWith(")")) {
    const id = value.slice(5, -1);
    return idMap.has(id) ? `url(#${idMap.get(id)})` : value;
  }

  if (value.startsWith("#")) {
    const id = value.slice(1);
    return idMap.has(id) ? `#${idMap.get(id)}` : value;
  }

  return value;
}

function uniquifyWritingSvgIds(svg, prefix) {
  const idMap = new Map();

  svg.querySelectorAll("[id]").forEach((element) => {
    const originalId = element.id;
    const nextId = `${prefix}-${originalId}`;
    idMap.set(originalId, nextId);
    element.id = nextId;
  });

  svg.querySelectorAll("*").forEach((element) => {
    ["clip-path", "href", "xlink:href", "mask", "filter"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      const nextValue = rewriteSvgReference(value, idMap);

      if (nextValue !== value) {
        element.setAttribute(attribute, nextValue);
      }
    });
  });
}

function parseWritingPracticeSvg(rawSvg) {
  if (!rawSvg) {
    return null;
  }

  const cachedTemplate = writingPracticeSvgTemplateCache.get(rawSvg);

  if (cachedTemplate) {
    return cachedTemplate.cloneNode(true);
  }

  const parsed = new DOMParser().parseFromString(rawSvg.trim(), "image/svg+xml");
  const svg = parsed.documentElement;

  if (!svg || svg.nodeName.toLowerCase() !== "svg" || parsed.querySelector("parsererror")) {
    return null;
  }

  const template = document.importNode(svg, true);
  writingPracticeSvgTemplateCache.set(rawSvg, template);
  return template.cloneNode(true);
}

function getWritingSvgViewBox(svg, fallbackViewBox = { x: 0, y: 0, width: 1024, height: 1024 }) {
  const baseViewBox = {
    x: Number.isFinite(fallbackViewBox?.x) ? fallbackViewBox.x : 0,
    y: Number.isFinite(fallbackViewBox?.y) ? fallbackViewBox.y : 0,
    width: Number.isFinite(fallbackViewBox?.width) && fallbackViewBox.width > 0 ? fallbackViewBox.width : 1024,
    height: Number.isFinite(fallbackViewBox?.height) && fallbackViewBox.height > 0 ? fallbackViewBox.height : 1024
  };
  const groups = [
    svg.querySelector('g[data-strokesvg="shadows"]'),
    svg.querySelector('g[data-strokesvg="strokes"]')
  ].filter(Boolean);
  let minX = baseViewBox.x;
  let minY = baseViewBox.y;
  let maxX = baseViewBox.x + baseViewBox.width;
  let maxY = baseViewBox.y + baseViewBox.height;
  let hasMeasuredBounds = false;

  groups.forEach((group) => {
    if (!group || typeof group.getBBox !== "function") {
      return;
    }

    try {
      const box = group.getBBox();

      if (!box || (!box.width && !box.height)) {
        return;
      }

      hasMeasuredBounds = true;
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    } catch (error) {
      // Hidden or not-yet-rendered SVG nodes may fail to measure; keep the original viewBox.
    }
  });

  if (!hasMeasuredBounds) {
    return {
      viewBox: baseViewBox,
      hasMeasuredBounds
    };
  }

  const contentWidth = Math.max(1, maxX - minX);
  const contentHeight = Math.max(1, maxY - minY);
  const padX = Math.max(24, contentWidth * 0.08);
  const padY = Math.max(28, contentHeight * 0.1);

  return {
    viewBox: {
      x: minX - padX,
      y: minY - padY,
      width: contentWidth + padX * 2,
      height: contentHeight + padY * 2
    },
    hasMeasuredBounds
  };
}

function applyWritingSvgViewBox(entry) {
  if (!entry?.svg || entry.viewBoxMeasured) {
    return;
  }

  const { viewBox: nextViewBox, hasMeasuredBounds } = getWritingSvgViewBox(entry.svg, entry.baseViewBox || entry.viewBox);
  entry.viewBox = nextViewBox;
  entry.viewBoxMeasured = hasMeasuredBounds;
  entry.svg.setAttribute("viewBox", `${nextViewBox.x} ${nextViewBox.y} ${nextViewBox.width} ${nextViewBox.height}`);
}

function refreshWritingPracticeViewBoxes() {
  writingPracticeState.slotEntries.forEach((entry) => {
    applyWritingSvgViewBox(entry);
  });
}

function collectWritingTargetClipMasks(svg, path) {
  const clipValue = path.getAttribute("clip-path");

  if (!clipValue || !clipValue.startsWith("url(#") || !clipValue.endsWith(")")) {
    return [];
  }

  const clipId = clipValue.slice(5, -1);
  const clipElement = svg.querySelector(`[id="${clipId}"]`);

  if (!clipElement) {
    return [];
  }

  const clipPaths = Array.from(clipElement.querySelectorAll("path"));

  clipElement.querySelectorAll("use").forEach((useElement) => {
    const href = useElement.getAttribute("href") || useElement.getAttribute("xlink:href");

    if (!href || !href.startsWith("#")) {
      return;
    }

    const referencedPath = svg.querySelector(`[id="${href.slice(1)}"]`);

    if (referencedPath instanceof SVGPathElement) {
      clipPaths.push(referencedPath);
    }
  });

  return clipPaths
    .map((clipPath) => clipPath.getAttribute("d"))
    .filter(Boolean)
    .map((pathData) => {
      try {
        return new Path2D(pathData);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
}

function collectWritingTargetSegments(svg) {
  const strokesGroup = svg.querySelector('g[data-strokesvg="strokes"]');

  if (!strokesGroup) {
    return [];
  }

  return Array.from(strokesGroup.querySelectorAll("path"))
    .map((path) => {
      const pathData = path.getAttribute("d");

      if (!pathData) {
        return null;
      }

      try {
        return {
          pathMask: new Path2D(pathData),
          clipMasks: collectWritingTargetClipMasks(svg, path)
        };
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
}

function getWritingTargetStrokeWidth(svg) {
  const strokesGroup = svg.querySelector('g[data-strokesvg="strokes"]');

  if (!strokesGroup) {
    return 128;
  }

  const inlineWidth = Number.parseFloat(strokesGroup.style?.strokeWidth || "");

  if (Number.isFinite(inlineWidth) && inlineWidth > 0) {
    return inlineWidth;
  }

  const attributeWidth = Number.parseFloat(strokesGroup.getAttribute("stroke-width") || "");
  return Number.isFinite(attributeWidth) && attributeWidth > 0 ? attributeWidth : 128;
}

function collectWritingStrokeEntries(svg) {
  const strokesGroup = svg.querySelector('g[data-strokesvg="strokes"]');

  if (!strokesGroup) {
    return [];
  }

  return Array.from(strokesGroup.children)
    .map((child) => {
      const paths =
        child.tagName.toLowerCase() === "path" ? [child] : Array.from(child.querySelectorAll("path"));

      if (!paths.length) {
        return null;
      }

      const measuredPaths = paths.map((path) => {
        const length = path.getTotalLength();
        path.dataset.length = String(length);
        return path;
      });

      const maxLength = Math.max(...measuredPaths.map((path) => Number(path.dataset.length || 0)));

      return {
        duration: clampValue(Math.round(maxLength / 2.9), 280, 760),
        paths: measuredPaths
      };
    })
    .filter(Boolean);
}

function setWritingStrokeEntriesState(revealed = false, opacity = 0) {
  writingPracticeState.slotEntries.forEach((entry) => {
    entry.strokeEntries.forEach((strokeEntry) => {
      strokeEntry.paths.forEach((path) => {
        const length = Number(path.dataset.length || 0);
        path.style.transition = "none";
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = revealed ? "0" : `${length}`;
        path.style.opacity = opacity > 0 ? String(opacity) : "0";
      });
    });
  });
}

function buildWritingPracticeStage(current) {
  const layer = document.getElementById("writing-svg-layer");
  const stageEmpty = document.getElementById("writing-practice-stage-empty");

  if (!layer || !stageEmpty || !current) {
    return;
  }

  const units = splitWritingPracticeUnits(current.char);
  const renderPrefix = `writing-${current.id}-${writingPracticeState.renderSeed + 1}`;

  writingPracticeState.renderSeed += 1;
  writingPracticeState.slotEntries = [];
  writingPracticeState.hasVectorGuide = false;

  layer.innerHTML = "";
  layer.style.setProperty("--slot-count", String(units.length || 1));

  units.forEach((unit, unitIndex) => {
    const characters = Array.from(unit);
    const slot = document.createElement("div");
    slot.className = "writing-character-slot";
    slot.dataset.char = unit;
    slot.classList.toggle("is-compound", characters.length > 1);
    slot.style.setProperty("--glyph-count", String(characters.length));

    characters.forEach((character, glyphIndex) => {
      const glyph = document.createElement("div");
      glyph.className = "writing-character-glyph";
      glyph.classList.toggle("is-leading", glyphIndex === 0);
      glyph.classList.toggle("is-trailing", glyphIndex === characters.length - 1);
      glyph.classList.toggle("is-small", glyphIndex > 0 && writingPracticeCompoundFollowers.has(character));
      glyph.dataset.char = character;
      slot.appendChild(glyph);

      const rawSvg = kanaStrokeSvgs[character];

      if (!rawSvg) {
        const fallback = document.createElement("div");
        fallback.className = "writing-character-fallback";
        fallback.textContent = character;
        glyph.appendChild(fallback);
        writingPracticeState.slotEntries.push({
          char: character,
          unit,
          slot,
          glyph,
          svg: null,
          baseViewBox: { x: 0, y: 0, width: 1024, height: 1024 },
          viewBox: { x: 0, y: 0, width: 1024, height: 1024 },
          viewBoxMeasured: true,
          shadowPaths: [],
          targetSegments: [],
          targetStrokeWidth: 128,
          strokeEntries: []
        });
        return;
      }

      const svg = parseWritingPracticeSvg(rawSvg);

      if (!svg) {
        const fallback = document.createElement("div");
        fallback.className = "writing-character-fallback";
        fallback.textContent = character;
        glyph.appendChild(fallback);
        writingPracticeState.slotEntries.push({
          char: character,
          unit,
          slot,
          glyph,
          svg: null,
          baseViewBox: { x: 0, y: 0, width: 1024, height: 1024 },
          viewBox: { x: 0, y: 0, width: 1024, height: 1024 },
          viewBoxMeasured: true,
          shadowPaths: [],
          targetSegments: [],
          targetStrokeWidth: 128,
          strokeEntries: []
        });
        return;
      }

      glyph.appendChild(svg);
      svg.classList.add("writing-character-svg");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      uniquifyWritingSvgIds(svg, `${renderPrefix}-${unitIndex}-${glyphIndex}`);

      const baseViewBox = svg.viewBox?.baseVal
        ? {
            x: svg.viewBox.baseVal.x,
            y: svg.viewBox.baseVal.y,
            width: svg.viewBox.baseVal.width || 1024,
            height: svg.viewBox.baseVal.height || 1024
          }
        : { x: 0, y: 0, width: 1024, height: 1024 };

      const shadowPaths = Array.from(svg.querySelectorAll('g[data-strokesvg="shadows"] path'))
        .map((path) => path.getAttribute("d"))
        .filter(Boolean);
      const targetSegments = collectWritingTargetSegments(svg);
      const targetStrokeWidth = getWritingTargetStrokeWidth(svg);

      writingPracticeState.hasVectorGuide = writingPracticeState.hasVectorGuide || shadowPaths.length > 0;

      const { viewBox, hasMeasuredBounds } = getWritingSvgViewBox(svg, baseViewBox);
      svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
      const strokeEntries = collectWritingStrokeEntries(svg);

      writingPracticeState.slotEntries.push({
        char: character,
        unit,
        slot,
        glyph,
        svg,
        baseViewBox,
        viewBox,
        viewBoxMeasured: hasMeasuredBounds,
        shadowPaths,
        targetSegments,
        targetStrokeWidth,
        strokeEntries
      });
    });

    layer.appendChild(slot);
  });

  stageEmpty.hidden = writingPracticeState.hasVectorGuide;
  stageEmpty.textContent = writingPracticeState.hasVectorGuide
    ? ""
    : "따라쓰기 데이터를 준비하지 못했어요.";
  setWritingStrokeEntriesState(false, 0);
}

function updateWritingPracticeStageState() {
  const stage = document.getElementById("writing-practice-stage");

  if (!stage) {
    return;
  }

  stage.classList.toggle("is-guide-hidden", !writingPracticeState.guideVisible);
  stage.classList.toggle("is-answer-visible", writingPracticeState.answerVisible);
}

function getWritingPracticeStrokeCount() {
  return writingPracticeState.slotEntries.reduce((count, entry) => count + entry.strokeEntries.length, 0);
}

function updateWritingPracticeControls() {
  const guideToggle = document.getElementById("writing-guide-toggle");
  const revealToggle = document.getElementById("writing-practice-reveal");
  const prevButton = document.getElementById("writing-practice-prev");
  const clearButton = document.getElementById("writing-practice-clear");
  const scoreButton = document.getElementById("writing-practice-score-btn");
  const replayButton = document.getElementById("writing-practice-replay");
  const nextButton = document.getElementById("writing-practice-next");
  const isBusy = writingPracticeState.isAnimating || writingPracticeState.isTransitioning;

  const syncButtonState = (button, label, disabled) => {
    if (!button) {
      return;
    }

    if (typeof label === "string" && button.textContent !== label) {
      button.textContent = label;
    }

    if (button.disabled !== disabled) {
      button.disabled = disabled;
    }
  };

  if (guideToggle) {
    guideToggle.disabled = !writingPracticeState.hasVectorGuide || isBusy;
    const isGuideVisible = writingPracticeState.guideVisible;
    const guideLabel = guideToggle.querySelector(".writing-practice-guide-label");
    const guideIcon = guideToggle.querySelector(".writing-practice-guide-icon");

    if (guideLabel) {
      guideLabel.textContent = "가이드";
    }

    if (guideIcon) {
      guideIcon.textContent = isGuideVisible ? "visibility_off" : "visibility";
      guideIcon.setAttribute("aria-label", isGuideVisible ? "숨김" : "표시");
    }

    guideToggle.setAttribute("aria-label", `가이드 ${isGuideVisible ? "숨기기" : "보기"}`);
  }

  if (revealToggle) {
    syncButtonState(
      revealToggle,
      writingPracticeState.answerVisible ? "정답 숨길래요" : "정답 볼래요",
      !writingPracticeState.hasVectorGuide || isBusy
    );
  }

  if (prevButton) {
    syncButtonState(prevButton, null, !writingPracticeState.sessionItems.length || isBusy);
  }

  if (clearButton) {
    syncButtonState(clearButton, null, writingPracticeState.strokes.length === 0 || isBusy);
  }

  if (scoreButton) {
    syncButtonState(scoreButton, null, !writingPracticeState.hasVectorGuide || isBusy);
  }

  if (replayButton) {
    syncButtonState(replayButton, null, !writingPracticeState.hasVectorGuide || isBusy);
  }

  if (nextButton) {
    syncButtonState(nextButton, null, !writingPracticeState.sessionItems.length || isBusy);
  }
}

function updateWritingPracticePanel() {
  const current = getCurrentWritingPracticeItem();
  const source = document.getElementById("writing-practice-source");
  const progress = document.getElementById("writing-practice-progress");
  const strokes = document.getElementById("writing-practice-strokes");
  const character = document.getElementById("writing-practice-char");
  const reading = document.getElementById("writing-practice-reading");
  const score = document.getElementById("writing-practice-score");
  const feedback = document.getElementById("writing-practice-feedback");
  const prompt = document.getElementById("writing-practice-prompt");
  const tip = document.getElementById("writing-practice-tip");

  syncSelectionButtonState(
    document.querySelectorAll("[data-writing-mode]"),
    (button) => button.dataset.writingMode,
    writingPracticeSettings.mode
  );
  syncSelectionButtonState(
    document.querySelectorAll("[data-writing-order]"),
    (button) => button.dataset.writingOrder,
    writingPracticeSettings.order
  );

  renderWritingPracticeSetup();

  if (!current) {
    if (source) {
      source.textContent = "-";
    }
    if (progress) {
      progress.textContent = "-";
    }
    if (strokes) {
      strokes.textContent = "-";
    }
    if (character) {
      character.textContent = "-";
    }
    if (reading) {
      reading.textContent = "-";
    }
    if (score) {
      score.textContent = "-";
    }
    if (feedback) {
      feedback.hidden = true;
      feedback.textContent = "";
    }
    if (prompt) {
      prompt.textContent = "가이드를 따라 천천히 써보고, 끝나면 점수를 확인해봐요.";
    }
    if (tip) {
      tip.textContent = getWritingPracticeDefaultTip();
    }
    updateWritingPracticeStageState();
    updateWritingPracticeControls();
    return;
  }

  const total = writingPracticeState.sessionItems.length;

  if (source) {
    source.textContent = current.source;
  }
  if (progress) {
    progress.textContent = `${writingPracticeState.sessionIndex + 1} / ${total}`;
  }
  if (strokes) {
    strokes.textContent = `${getWritingPracticeStrokeCount()}획`;
  }
  if (character) {
    character.textContent = current.char;
  }
  if (reading) {
    reading.textContent = current.reading;
  }
  if (score) {
    score.textContent = writingPracticeState.score === null ? "-" : `${writingPracticeState.score}점`;
  }
  if (feedback) {
    feedback.hidden = writingPracticeState.score === null;
    feedback.textContent = writingPracticeState.score === null ? "" : writingPracticeState.feedback;
  }
  if (prompt) {
    prompt.textContent = `「${current.char}」를 칸 안에 맞춰 써보고, 끝나면 점수를 확인해봐요.`;
  }
  if (tip) {
    tip.textContent = writingPracticeState.tip;
  }

  updateWritingPracticeStageState();
  updateWritingPracticeControls();
}

function getWritingCanvasReferenceRect(canvas) {
  const layer = document.getElementById("writing-svg-layer");
  const layerRect = layer?.getBoundingClientRect();

  if (layerRect?.width && layerRect?.height) {
    return layerRect;
  }

  return canvas.getBoundingClientRect();
}

function getWritingCanvasScaleRatio(canvas) {
  const rect = canvas.getBoundingClientRect();
  return canvas.width / Math.max(rect.width, 1);
}

function getWritingBrushWidth(canvas) {
  const referenceRect = getWritingCanvasReferenceRect(canvas);
  const scaleRatio = getWritingCanvasScaleRatio(canvas);
  const cssBrushWidth = clampValue(Math.round(Math.min(referenceRect.width, referenceRect.height) * 0.018), 6, 14);
  return Math.max(1, Math.round(cssBrushWidth * scaleRatio));
}

function drawWritingStroke(ctx, canvas, points) {
  if (!points.length) {
    return;
  }

  const absolutePoints = points.map((point) => ({
    x: point.x * canvas.width,
    y: point.y * canvas.height
  }));

  if (absolutePoints.length === 1) {
    const radius = getWritingBrushWidth(canvas) * 0.5;
    ctx.beginPath();
    ctx.arc(absolutePoints[0].x, absolutePoints[0].y, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(absolutePoints[0].x, absolutePoints[0].y);

  for (let index = 1; index < absolutePoints.length; index += 1) {
    ctx.lineTo(absolutePoints[index].x, absolutePoints[index].y);
  }

  ctx.stroke();
}

function getWritingOverlayBounds(canvas, strokes) {
  if (!canvas || !strokes.length) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  strokes.forEach((stroke) => {
    stroke.forEach((point) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  const padding = getWritingBrushWidth(canvas);

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(canvas.width, maxX + padding) - Math.max(0, minX - padding),
    height: Math.min(canvas.height, maxY + padding) - Math.max(0, minY - padding)
  };
}

function clearWritingOverlayRegion(ctx, canvas, bounds) {
  if (!ctx || !canvas) {
    return;
  }

  if (!bounds) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

function resetWritingOverlayCanvas() {
  const canvas = document.getElementById("writing-overlay-canvas");
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx) {
    clearWritingOverlayRegion(ctx, canvas, null);
  }

  writingPracticeState.overlayHasInk = false;
  writingPracticeState.overlayBounds = null;
}

function renderWritingOverlay() {
  const canvas = document.getElementById("writing-overlay-canvas");
  const ctx = canvas?.getContext("2d");

  if (!canvas || !ctx) {
    return;
  }

  const hasStrokes = writingPracticeState.strokes.some((stroke) => stroke.length);

  if (!hasStrokes && !writingPracticeState.overlayHasInk) {
    return;
  }

  const nextBounds = hasStrokes ? getWritingOverlayBounds(canvas, writingPracticeState.strokes) : null;
  const previousBounds = writingPracticeState.overlayBounds;
  const clearBounds =
    previousBounds && nextBounds
      ? {
          x: Math.min(previousBounds.x, nextBounds.x),
          y: Math.min(previousBounds.y, nextBounds.y),
          width: Math.max(previousBounds.x + previousBounds.width, nextBounds.x + nextBounds.width) - Math.min(previousBounds.x, nextBounds.x),
          height: Math.max(previousBounds.y + previousBounds.height, nextBounds.y + nextBounds.height) - Math.min(previousBounds.y, nextBounds.y)
        }
      : previousBounds || nextBounds;

  clearWritingOverlayRegion(ctx, canvas, clearBounds);

  if (!hasStrokes) {
    writingPracticeState.overlayHasInk = false;
    writingPracticeState.overlayBounds = null;
    return;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(30, 35, 49, 0.94)";
  ctx.fillStyle = "rgba(30, 35, 49, 0.94)";
  ctx.lineWidth = getWritingBrushWidth(canvas);

  writingPracticeState.strokes.forEach((stroke) => {
    drawWritingStroke(ctx, canvas, stroke);
  });
  writingPracticeState.overlayHasInk = true;
  writingPracticeState.overlayBounds = nextBounds;
}

function renderWritingPracticeTargetMask() {
  const canvas = document.getElementById("writing-overlay-canvas");
  const ctx = writingPracticeState.targetCanvas.getContext("2d");

  if (!canvas || !ctx) {
    return;
  }

  writingPracticeState.targetCanvas.width = canvas.width;
  writingPracticeState.targetCanvas.height = canvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!writingPracticeState.hasVectorGuide) {
    return;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const scaleRatio = canvas.width / Math.max(canvasRect.width, 1);
  ctx.fillStyle = "#ffffff";

  writingPracticeState.slotEntries.forEach((entry) => {
    if (!entry.svg || !entry.targetSegments.length) {
      return;
    }

    const svgRect = entry.svg.getBoundingClientRect();

    if (!svgRect.width || !svgRect.height) {
      return;
    }

    const x = (svgRect.left - canvasRect.left) * scaleRatio;
    const y = (svgRect.top - canvasRect.top) * scaleRatio;
    const width = svgRect.width * scaleRatio;
    const height = svgRect.height * scaleRatio;
    const scale = Math.min(width / entry.viewBox.width, height / entry.viewBox.height);
    const offsetX = x + (width - entry.viewBox.width * scale) / 2 - entry.viewBox.x * scale;
    const offsetY = y + (height - entry.viewBox.height * scale) / 2 - entry.viewBox.y * scale;
    const guideStrokeWidth = (entry.targetStrokeWidth || 128) * scale;
    const targetStrokeWidth = Math.max(getWritingBrushWidth(canvas) * 2.2, guideStrokeWidth * 0.34);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, targetStrokeWidth / Math.max(scale, 0.0001));
    entry.targetSegments.forEach((segment) => {
      ctx.save();

      if (segment.clipMasks.length) {
        segment.clipMasks.forEach((clipMask) => {
          ctx.clip(clipMask);
        });
      }

      ctx.stroke(segment.pathMask);
      ctx.restore();
    });
    ctx.restore();
  });
}

function syncWritingPracticeCanvas() {
  const canvas = document.getElementById("writing-overlay-canvas");

  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
  const nextWidth = Math.max(1, Math.round(rect.width * ratio));
  const nextHeight = Math.max(1, Math.round(rect.height * ratio));
  const resized = canvas.width !== nextWidth || canvas.height !== nextHeight;

  if (resized) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    writingPracticeState.overlayHasInk = false;
    writingPracticeState.overlayBounds = null;
  }

  refreshWritingPracticeViewBoxes();
  renderWritingOverlay();
}

function observeWritingPracticeLayout() {
  if (writingPracticeState.layoutObserver || typeof ResizeObserver !== "function") {
    return;
  }

  writingPracticeState.layoutObserver = new ResizeObserver(() => {
    if (!document.getElementById("writing-practice-shell") || getCharactersTab(state.charactersTab) !== "writing") {
      return;
    }

    scheduleWritingPracticeLayout(false);
  });

  const stage = document.getElementById("writing-practice-stage");

  if (stage) {
    writingPracticeState.layoutObserver.observe(stage);
  }
}

function scheduleWritingPracticeLayout(replay = false) {
  beginWritingPracticeTransition();

  if (writingPracticeState.layoutFrame) {
    cancelAnimationFrame(writingPracticeState.layoutFrame);
  }

  writingPracticeState.layoutFrame = window.requestAnimationFrame(() => {
    writingPracticeState.layoutFrame = window.requestAnimationFrame(() => {
      writingPracticeState.layoutFrame = null;
      syncWritingPracticeCanvas();
      updateWritingPracticeStageState();
      endWritingPracticeTransition();

      if (replay && writingPracticeState.hasVectorGuide) {
        replayWritingStrokeAnimation();
      }
    });
  });
}

function getWritingPracticeScoreResult(score, coverage, precision) {
  if (score >= 90) {
    return {
      score,
      feedback: "거의 맞았어요. 획 모양이 안정적으로 들어왔어요.",
      tip: "이 감각으로 다음 글자도 이어가보세요."
    };
  }

  if (score >= 78) {
    if (coverage < precision) {
      return {
        score,
        feedback: "모양은 좋아요. 다만 빠진 부분이 조금 있어요.",
        tip: "획의 끝점을 한 번만 더 길게 빼보면 더 닮아져요."
      };
    }

    return {
      score,
      feedback: "대체로 잘 맞아요. 가이드 밖으로 나온 부분만 조금 줄여보세요.",
      tip: "선을 조금 더 천천히 눌러 쓰면 점수가 더 올라가요."
    };
  }

  if (score >= 62) {
    if (coverage < 0.55) {
      return {
        score,
        feedback: "형태는 잡혔지만 빠진 획이 아직 보여요.",
        tip: "획순 다시 보기로 시작점과 끝점을 확인해보세요."
      };
    }

    return {
      score,
      feedback: "전체 윤곽은 보이기 시작했어요. 조금만 더 안쪽으로 모아 써보세요.",
      tip: "가이드 안에서 크기를 조금 줄이면 훨씬 비슷해져요."
    };
  }

  if (coverage < 0.42) {
    return {
      score,
      feedback: "빠진 부분이 많아요. 획을 끝까지 이어서 써보면 좋아요.",
      tip: "정답 모양을 보고 흐름을 익힌 뒤, 화면을 꽉 채운다는 느낌으로 다시 써봐요."
    };
  }

  if (precision < 0.34) {
    return {
      score,
      feedback: "획이 가이드 밖으로 많이 벗어났어요.",
      tip: "한 번에 빨리 쓰기보다 짧게 끊어가며 맞춰보세요."
    };
  }

  return {
    score,
    feedback: "첫 형태는 잡혔어요. 다시 한 번 천천히 써보면 금방 올라가요.",
    tip: "가이드를 켠 상태로 크기와 간격부터 먼저 맞춰보세요."
  };
}

function buildWritingPracticeMask(data) {
  const mask = new Uint8Array(Math.floor(data.length / 4));
  let activePixels = 0;

  for (let dataIndex = 3, maskIndex = 0; dataIndex < data.length; dataIndex += 4, maskIndex += 1) {
    const isActive = data[dataIndex] > 32 ? 1 : 0;
    mask[maskIndex] = isActive;
    activePixels += isActive;
  }

  return {
    mask,
    activePixels
  };
}

function buildWritingPracticeIntegralMask(mask, width, height) {
  const stride = width + 1;
  const integral = new Uint32Array((width + 1) * (height + 1));

  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    const maskRowOffset = (y - 1) * width;
    const integralRowOffset = y * stride;
    const previousRowOffset = (y - 1) * stride;

    for (let x = 1; x <= width; x += 1) {
      rowSum += mask[maskRowOffset + x - 1];
      integral[integralRowOffset + x] = integral[previousRowOffset + x] + rowSum;
    }
  }

  return integral;
}

function hasWritingPracticeMaskHit(integral, width, height, x, y, radius) {
  const stride = width + 1;
  const left = Math.max(0, x - radius);
  const top = Math.max(0, y - radius);
  const right = Math.min(width - 1, x + radius);
  const bottom = Math.min(height - 1, y + radius);
  const x1 = left;
  const y1 = top;
  const x2 = right + 1;
  const y2 = bottom + 1;
  const sum =
    integral[y2 * stride + x2] -
    integral[y1 * stride + x2] -
    integral[y2 * stride + x1] +
    integral[y1 * stride + x1];

  return sum > 0;
}

function countWritingPracticeMaskMatches(mask, activePixels, targetIntegral, width, height, radius) {
  if (!activePixels) {
    return 0;
  }

  let matches = 0;
  let index = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1, index += 1) {
      if (!mask[index]) {
        continue;
      }

      if (hasWritingPracticeMaskHit(targetIntegral, width, height, x, y, radius)) {
        matches += 1;
      }
    }
  }

  return matches;
}

function scoreWritingPractice() {
  if (writingPracticeState.isAnimating || writingPracticeState.isTransitioning) {
    return;
  }

  const canvas = document.getElementById("writing-overlay-canvas");
  const userCtx = canvas?.getContext("2d");
  const targetCtx = writingPracticeState.targetCanvas.getContext("2d");

  if (!canvas || !userCtx || !targetCtx || !writingPracticeState.hasVectorGuide) {
    return;
  }

  if (!writingPracticeState.strokes.some((stroke) => stroke.length)) {
    writingPracticeState.feedback = "아직 쓴 획이 없어요. 먼저 한 번 써볼까요?";
    writingPracticeState.tip = "글자를 칸 안에 크게 한 번 쓴 뒤 점수를 눌러보세요.";
    updateWritingPracticePanel();
    return;
  }

  renderWritingPracticeTargetMask();

  const userData = userCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const targetData = targetCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const { mask: userMask, activePixels: userPixels } = buildWritingPracticeMask(userData);
  const { mask: targetMask, activePixels: targetPixels } = buildWritingPracticeMask(targetData);

  if (!targetPixels || !userPixels) {
    writingPracticeState.feedback = "아직 비교할 선이 충분하지 않아요. 조금 더 크게 써보세요.";
    writingPracticeState.tip = "획을 한두 번 더 보강한 뒤 다시 점수를 눌러보세요.";
    updateWritingPracticePanel();
    return;
  }

  const toleranceRadius = clampValue(Math.round(getWritingBrushWidth(canvas) * 0.9), 6, 16);
  const userIntegral = buildWritingPracticeIntegralMask(userMask, canvas.width, canvas.height);
  const targetIntegral = buildWritingPracticeIntegralMask(targetMask, canvas.width, canvas.height);
  const coveredTargetPixels = countWritingPracticeMaskMatches(targetMask, targetPixels, userIntegral, canvas.width, canvas.height, toleranceRadius);
  const alignedUserPixels = countWritingPracticeMaskMatches(userMask, userPixels, targetIntegral, canvas.width, canvas.height, toleranceRadius);
  const coverage = coveredTargetPixels / targetPixels;
  const precision = alignedUserPixels / userPixels;
  const easedCoverage = Math.sqrt(coverage);
  const easedPrecision = Math.sqrt(precision);
  const score = clampValue(Math.round((easedCoverage * 0.58 + easedPrecision * 0.42) * 100), 0, 100);
  const result = getWritingPracticeScoreResult(score, easedCoverage, easedPrecision);

  writingPracticeState.score = result.score;
  writingPracticeState.feedback = result.feedback;
  writingPracticeState.tip = result.tip;

  updateWritingPracticePanel();
  updateStudyStreak();
  saveState();
  renderStats();
}

function getWritingCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: clampValue((event.clientX - rect.left) / rect.width, 0, 1),
    y: clampValue((event.clientY - rect.top) / rect.height, 0, 1)
  };
}

function handleWritingPointerDown(event) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  if (writingPracticeState.isAnimating || writingPracticeState.isTransitioning) {
    return;
  }

  if (!getCurrentWritingPracticeItem()) {
    return;
  }

  const canvas = event.currentTarget;

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  writingPracticeState.pointerId = event.pointerId;
  writingPracticeState.isDrawing = true;

  if (writingPracticeState.score !== null) {
    writingPracticeState.score = null;
    writingPracticeState.feedback = getWritingPracticeDefaultFeedback();
    writingPracticeState.tip = getWritingPracticeDefaultTip();
  }

  const point = getWritingCanvasPoint(event, canvas);
  writingPracticeState.strokes.push([point]);
  renderWritingOverlay();
  updateWritingPracticePanel();
}

function handleWritingPointerMove(event) {
  if (!writingPracticeState.isDrawing || writingPracticeState.pointerId !== event.pointerId) {
    return;
  }

  const canvas = event.currentTarget;

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  event.preventDefault();

  const point = getWritingCanvasPoint(event, canvas);
  const currentStroke = writingPracticeState.strokes[writingPracticeState.strokes.length - 1];

  if (!currentStroke) {
    return;
  }

  const lastPoint = currentStroke[currentStroke.length - 1];

  if (lastPoint && Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < 0.0022) {
    return;
  }

  currentStroke.push(point);
  renderWritingOverlay();
}

function finishWritingPointer(event) {
  if (writingPracticeState.pointerId !== event.pointerId) {
    return;
  }

  const canvas = event.currentTarget;

  if (canvas instanceof HTMLCanvasElement && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  writingPracticeState.pointerId = null;
  writingPracticeState.isDrawing = false;
  updateWritingPracticeControls();
}

function waitForWritingAnimation(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

async function replayWritingStrokeAnimation() {
  if (!writingPracticeState.hasVectorGuide || writingPracticeState.isAnimating) {
    return;
  }

  cancelWritingPracticeAnimation();
  const token = writingPracticeState.animationToken;
  writingPracticeState.isAnimating = true;
  setWritingStrokeEntriesState(false, 0);
  updateWritingPracticeControls();

  for (const entry of writingPracticeState.slotEntries) {
    for (const strokeEntry of entry.strokeEntries) {
      if (token !== writingPracticeState.animationToken) {
        return;
      }

      strokeEntry.paths.forEach((path) => {
        const length = Number(path.dataset.length || 0);
        path.style.transition = "none";
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.style.opacity = "1";
      });

      strokeEntry.paths[0]?.getBoundingClientRect();

      strokeEntry.paths.forEach((path) => {
        path.style.transition = `stroke-dashoffset ${strokeEntry.duration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease`;
        path.style.strokeDashoffset = "0";
      });

      await waitForWritingAnimation(strokeEntry.duration + 90);
    }
  }

  if (token !== writingPracticeState.animationToken) {
    return;
  }

  writingPracticeState.isAnimating = false;
  setWritingStrokeEntriesState(true, writingPracticeState.answerVisible ? 0.88 : 0.18);
  updateWritingPracticeControls();
}

function clearWritingPracticeCanvas(resetStatus = true) {
  writingPracticeState.strokes = [];

  if (resetStatus) {
    writingPracticeState.score = null;
    writingPracticeState.feedback = getWritingPracticeDefaultFeedback();
    writingPracticeState.tip = getWritingPracticeDefaultTip();
  }

  renderWritingOverlay();
  updateWritingPracticePanel();
}

function startWritingPracticeSession(mode = writingPracticeSettings.mode, order = writingPracticeSettings.order) {
  const nextMode = ["hiragana", "katakana", "random"].includes(mode) ? mode : "hiragana";
  const nextOrder = getWritingPracticeOrder(order);
  writingPracticeSettings.mode = nextMode;
  writingPracticeSettings.order = nextOrder;
  writingPracticeState.sessionItems = buildWritingPracticeSession(nextMode, nextOrder);
  writingPracticeState.sessionIndex = 0;
  resetWritingPracticeRound();
  renderWritingPractice();
}

function nextWritingPracticeItem() {
  if (writingPracticeState.isAnimating || writingPracticeState.isTransitioning) {
    return;
  }

  if (!writingPracticeState.sessionItems.length) {
    startWritingPracticeSession(writingPracticeSettings.mode, writingPracticeSettings.order);
    return;
  }

  if (writingPracticeState.sessionIndex + 1 >= writingPracticeState.sessionItems.length) {
    writingPracticeState.sessionItems = buildWritingPracticeSession(
      writingPracticeSettings.mode,
      writingPracticeSettings.order
    );
    writingPracticeState.sessionIndex = 0;
  } else {
    writingPracticeState.sessionIndex += 1;
  }

  resetWritingPracticeRound();
  renderWritingPractice();
}

function previousWritingPracticeItem() {
  if (writingPracticeState.isAnimating || writingPracticeState.isTransitioning) {
    return;
  }

  if (!writingPracticeState.sessionItems.length) {
    startWritingPracticeSession(writingPracticeSettings.mode, writingPracticeSettings.order);
    return;
  }

  if (writingPracticeState.sessionIndex <= 0) {
    writingPracticeState.sessionIndex = writingPracticeState.sessionItems.length - 1;
  } else {
    writingPracticeState.sessionIndex -= 1;
  }

  resetWritingPracticeRound();
  renderWritingPractice();
}

function openWritingPracticeForCharacter(char, script) {
  if (!char) {
    return;
  }

  const nextMode = script === "katakana" ? "katakana" : "hiragana";
  const nextItems = buildWritingPracticeSession(nextMode, writingPracticeSettings.order);
  const nextIndex = nextItems.findIndex((item) => item.char === char);

  state.charactersTab = "writing";
  writingPracticeSettings.mode = nextMode;
  writingPracticeState.sessionItems = nextItems;
  writingPracticeState.sessionIndex = nextIndex >= 0 ? nextIndex : 0;
  resetWritingPracticeRound();
  saveState();
  renderWritingPractice();
  renderCharactersPageLayout();
}

function toggleWritingGuide() {
  writingPracticeState.guideVisible = !writingPracticeState.guideVisible;
  updateWritingPracticePanel();
}

function toggleWritingAnswer() {
  if (!writingPracticeState.hasVectorGuide) {
    return;
  }

  cancelWritingPracticeAnimation();
  writingPracticeState.answerVisible = !writingPracticeState.answerVisible;

  if (writingPracticeState.answerVisible) {
    writingPracticeState.guideVisible = true;
    writingPracticeState.tip = "정답 모양을 켰어요. 획순을 보고 같은 흐름으로 다시 써봐요.";
    setWritingStrokeEntriesState(true, 0.88);
    updateWritingPracticePanel();
    return;
  }

  writingPracticeState.tip =
    writingPracticeState.score === null ? getWritingPracticeDefaultTip() : writingPracticeState.tip;
  setWritingStrokeEntriesState(false, 0);
  updateWritingPracticePanel();
}

function renderWritingPractice() {
  const shell = document.getElementById("writing-practice-shell");

  if (!shell) {
    return;
  }

  ensureWritingPracticeSession();

  const current = getCurrentWritingPracticeItem();

  if (!current) {
    endWritingPracticeTransition();
    updateWritingPracticePanel();
    return;
  }

  buildWritingPracticeStage(current);
  updateWritingPracticePanel();

  if (getCharactersTab(state.charactersTab) === "writing") {
    scheduleWritingPracticeLayout(false);
  }
}
