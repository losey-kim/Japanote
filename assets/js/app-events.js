/* Japanote — DOM event wiring (split from app.js) */
function attachEventListeners() {
  const flashcardToggle = document.getElementById("flashcard-toggle");
  const flashcardPrev = document.getElementById("flashcard-prev");
  const flashcardNext = document.getElementById("flashcard-next");
  const flashcardAgain = document.getElementById("flashcard-again");
  const flashcardMastered = document.getElementById("flashcard-mastered");
  const vocabTabButtons = document.querySelectorAll("[data-vocab-tab]");
  const vocabViewButtons = document.querySelectorAll("[data-vocab-view]");
  const vocabLevelSelect = document.getElementById("vocab-level-select");
  const vocabFilterSelect = document.getElementById("vocab-filter-select");
  const vocabPartSelect = document.getElementById("vocab-part-select");
  const vocabList = document.getElementById("vocab-list");
  const vocabPagePrev = document.getElementById("vocab-page-prev");
  const vocabPageNext = document.getElementById("vocab-page-next");
  const vocabQuizOptionsToggle = document.getElementById("vocab-quiz-options-toggle");
  const vocabQuizQuestionField = document.getElementById("vocab-quiz-question-field");
  const vocabQuizOptionField = document.getElementById("vocab-quiz-option-field");
  const vocabQuizCountSpinner = document.querySelector('[data-spinner-id="vocab-quiz-count"]');
  const vocabQuizTimeSpinner = document.querySelector('[data-spinner-id="vocab-quiz-time"]');
  const vocabQuizLevelSelect = document.getElementById("vocab-quiz-level-select");
  const vocabQuizFilterSelect = document.getElementById("vocab-quiz-filter-select");
  const vocabQuizPartSelect = document.getElementById("vocab-quiz-part-select");
  const vocabQuizResultFilter = document.querySelectorAll("#vocab-quiz-result-view [data-result-filter]");
  const vocabQuizResultBulkAction = document.getElementById("vocab-quiz-result-bulk-action");
  const vocabQuizResultMasteredAction = document.getElementById("vocab-quiz-result-mastered-action");
  const vocabQuizResultList = document.getElementById("vocab-quiz-result-list");
  const vocabQuizNext = document.getElementById("vocab-quiz-next");
  const vocabQuizRestart = document.getElementById("vocab-quiz-restart");
  const quizNext = document.getElementById("quiz-next");
  const quizRestart = document.getElementById("quiz-restart");
  const quizClearMistakes = document.getElementById("quiz-clear-mistakes");
  const quizOptionsToggle = document.getElementById("quiz-options-toggle");
  const quizLevelButtons = document.querySelectorAll("[data-quiz-level]");
  const quizSizeButtons = document.querySelectorAll("[data-quiz-size]");
  const quizModeButtons = document.querySelectorAll("[data-quiz-mode]");
  const quizTimeButtons = document.querySelectorAll("[data-quiz-time]");
  const grammarPracticeOptionsToggle = document.getElementById("grammar-practice-options-toggle");
  const grammarPracticeLevelSelect = document.getElementById("grammar-practice-level-select");
  const grammarPracticeFilterSelect = document.getElementById("grammar-practice-filter-select");
  const grammarPracticeCountSpinner = document.querySelector('[data-spinner-id="grammar-practice-count"]');
  const grammarPracticeTimeSpinner = document.querySelector('[data-spinner-id="grammar-practice-time"]');
  const grammarPracticeStart = document.getElementById("grammar-practice-start");
  const grammarPracticeResultBulkAction = document.getElementById("grammar-practice-result-bulk-action");
  const grammarPracticeResultMasteredAction = document.getElementById("grammar-practice-result-mastered-action");
  const grammarPracticeResultFilter = document.querySelectorAll("#grammar-practice-result-view [data-result-filter]");
  const grammarPracticeResultList = document.getElementById("grammar-practice-result-list");
  const grammarViewButtons = document.querySelectorAll("[data-grammar-view]");
  const grammarLevelSelect = document.getElementById("grammar-level-select");
  const grammarFilterSelect = document.getElementById("grammar-filter-select");
  const grammarList = document.getElementById("grammar-list");
  const grammarPagePrev = document.getElementById("grammar-page-prev");
  const grammarPageNext = document.getElementById("grammar-page-next");
  const grammarFlashcardToggle = document.getElementById("grammar-flashcard-toggle");
  const grammarFlashcardPrev = document.getElementById("grammar-flashcard-prev");
  const grammarFlashcardNext = document.getElementById("grammar-flashcard-next");
  const grammarFlashcardReview = document.getElementById("grammar-flashcard-review");
  const grammarFlashcardMastered = document.getElementById("grammar-flashcard-mastered");
  const readingOptionsToggle = document.getElementById("reading-options-toggle");
  const readingLevelSelect = document.getElementById("reading-level-select");
  const readingCountSpinner = document.querySelector('[data-spinner-id="reading-count"]');
  const readingTimeSpinner = document.querySelector('[data-spinner-id="reading-time"]');
  const readingStart = document.getElementById("reading-start");
  const readingPracticeResultFilter = document.querySelectorAll("#reading-practice-result-view [data-result-filter]");
  const readingNext = document.getElementById("reading-next");
  const basicPracticeNext = document.getElementById("basic-practice-next");
  const kanjiList = document.getElementById("kanji-list");
  const kanjiOptionsToggle = document.getElementById("kanji-options-toggle");
  const kanjiGradeButtons = document.querySelectorAll("[data-kanji-grade-option]");
  const kanjiViewButtons = document.querySelectorAll("[data-kanji-view]");
  const kanjiCollectionSelect = document.getElementById("kanji-collection-select");
  const kanjiGradeSelect = document.getElementById("kanji-grade-select");
  const kanjiPagePrev = document.getElementById("kanji-page-prev");
  const kanjiPageNext = document.getElementById("kanji-page-next");
  const kanjiFlashcardToggle = document.getElementById("kanji-flashcard-toggle");
  const kanjiFlashcardPrev = document.getElementById("kanji-flashcard-prev");
  const kanjiFlashcardNext = document.getElementById("kanji-flashcard-next");
  const kanjiFlashcardReview = document.getElementById("kanji-flashcard-review");
  const kanjiFlashcardMastered = document.getElementById("kanji-flashcard-mastered");
  const kanjiPracticeOptionsToggle = document.getElementById("kanji-practice-options-toggle");
  const kanjiPracticeQuestionField = document.getElementById("kanji-practice-question-field");
  const kanjiPracticeOptionField = document.getElementById("kanji-practice-option-field");
  const kanjiPracticeCollectionSelect = document.getElementById("kanji-practice-collection-select");
  const kanjiPracticeGradeSelect = document.getElementById("kanji-practice-grade-select");
  const kanjiPracticeStart = document.getElementById("kanji-practice-start");
  const kanjiPracticeCountSpinner = document.querySelector('[data-spinner-id="kanji-practice-count"]');
  const kanjiPracticeTimeSpinner = document.querySelector('[data-spinner-id="kanji-practice-time"]');
  const kanjiPracticeNext = document.getElementById("kanji-practice-next");
  const kanjiPracticeRestart = document.getElementById("kanji-practice-restart");
  const kanjiPracticeResultBulkAction = document.getElementById("kanji-practice-result-bulk-action");
  const kanjiPracticeResultMasteredAction = document.getElementById("kanji-practice-result-mastered-action");
  const kanjiPracticeResultFilter = document.querySelectorAll("#kanji-practice-result-view [data-result-filter]");
  const kanjiPracticeResultList = document.getElementById("kanji-practice-result-list");
  const kanjiTabButtons = document.querySelectorAll("[data-kanji-tab]");
  const grammarPracticeNext = document.getElementById("grammar-practice-next");
  const kanaQuizNext = document.getElementById("kana-quiz-next");
  const kanaQuizRestart = document.getElementById("kana-quiz-restart");
  const kanaQuizResultFilter = document.querySelectorAll("#kana-quiz-result-view [data-result-filter]");
  const kanaSetupToggle = document.getElementById("kana-setup-toggle");
  const kanaModeButtons = document.querySelectorAll("[data-kana-mode]");
  const kanaCountSpinner = document.querySelector('[data-spinner-id="kana-quiz-count"]');
  const kanaTimeSpinner = document.querySelector('[data-spinner-id="kana-quiz-time"]');
  const kanaSetupStart = document.getElementById("kana-setup-start");
  const charactersTabButtons = document.querySelectorAll("[data-characters-tab]");
  const charactersLibraryTabButtons = document.querySelectorAll("[data-characters-library-tab]");
  const grammarTabButtons = document.querySelectorAll("[data-grammar-tab]");
  const writingSetupToggle = document.getElementById("writing-setup-toggle");
  const writingModeButtons = document.querySelectorAll("[data-writing-mode]");
  const writingOrderButtons = document.querySelectorAll("[data-writing-order]");
  const writingReplay = document.getElementById("writing-practice-replay");
  const writingGuideToggle = document.getElementById("writing-guide-toggle");
  const writingRevealToggle = document.getElementById("writing-practice-reveal");
  const writingPrev = document.getElementById("writing-practice-prev");
  const writingClear = document.getElementById("writing-practice-clear");
  const writingScore = document.getElementById("writing-practice-score-btn");
  const writingNext = document.getElementById("writing-practice-next");
  const writingCanvas = document.getElementById("writing-overlay-canvas");

  attachVocabStudyListeners({
    flashcardToggle,
    flashcardPrev,
    flashcardNext,
    flashcardAgain,
    flashcardMastered,
    vocabList,
    vocabTabButtons,
    vocabViewButtons,
    vocabLevelSelect,
    vocabFilterSelect,
    vocabPartSelect,
    vocabPagePrev,
    vocabPageNext
  });
  attachStateOptionsToggle(vocabQuizOptionsToggle, "vocabQuizOptionsOpen", renderVocabPage);
  attachLinkedFieldSelectors({
    questionSelect: vocabQuizQuestionField,
    optionSelect: vocabQuizOptionField,
    getQuestionField: getVocabQuizQuestionField,
    getOptionField: getVocabQuizOptionField,
    normalizeQuestionField: getVocabQuizQuestionField,
    normalizeOptionField: (value, previousOptionField) => getVocabQuizField(value, previousOptionField),
    normalizeStoredQuestionField: getVocabQuizQuestionField,
    normalizeStoredOptionField: getVocabQuizOptionField,
    getDefaultOptionField: getDefaultVocabQuizOptionField,
    getDefaultQuestionField: getDefaultVocabQuizQuestionField,
    questionStateKey: "vocabQuizQuestionField",
    optionStateKey: "vocabQuizOptionField",
    invalidate: invalidateVocabQuizSession,
    render: renderVocabPage
  });
  attachStateSpinner({
    spinner: vocabQuizCountSpinner,
    options: vocabQuizCountOptions,
    getCurrentValue: () => state.vocabQuizCount,
    setValue: (value) => {
      state.vocabQuizCount = value;
    },
    invalidate: invalidateVocabQuizSession,
    render: renderVocabPage
  });
  attachStateSpinner({
    spinner: vocabQuizTimeSpinner,
    options: quizDurationOptions,
    getCurrentValue: () => state.vocabQuizDuration,
    setValue: (value) => {
      state.vocabQuizDuration = value;
    },
    invalidate: invalidateVocabQuizSession,
    render: renderVocabPage
  });
  attachSelectValueListener(vocabQuizLevelSelect, setVocabLevel);
  attachSelectValueListener(vocabQuizFilterSelect, setVocabFilter);
  attachSelectValueListener(vocabQuizPartSelect, setVocabPartFilter);
  attachResultFilterButtonListeners({
    buttons: vocabQuizResultFilter,
    getNextValue: getVocabQuizResultFilter,
    getCurrentValue: getVocabQuizResultFilter,
    setValue: (value) => {
      state.vocabQuizResultFilter = value;
    },
    shouldSaveState: true,
    render: renderVocabQuizResults
  });
  attachBulkResultActionListener({
    button: vocabQuizResultBulkAction,
    getResults: getFilteredVocabQuizResults,
    datasetKey: "vocabQuizBulkAction",
    removeItem: removeWordFromReviewList,
    saveItem: saveWordToReviewList,
    render: renderVocabPage
  });
  attachBulkResultActionListener({
    button: vocabQuizResultMasteredAction,
    getResults: getFilteredVocabQuizResults,
    datasetKey: "vocabQuizMasteredBulkAction",
    removeActionValue: "remove-mastered",
    removeItem: removeWordFromMasteredList,
    saveItem: saveWordToMasteredList,
    render: renderVocabPage
  });
  attachToggleResultActionListener({
    list: vocabQuizResultList,
    actions: [
      {
        selector: "[data-vocab-quiz-review]",
        getId: (button) => button.dataset.vocabQuizReview,
        isSelected: isWordSavedToReviewList,
        selectItem: saveWordToReviewList,
        unselectItem: removeWordFromReviewList
      },
      {
        selector: "[data-vocab-quiz-mastered]",
        getId: (button) => button.dataset.vocabQuizMastered,
        isSelected: isWordSavedToMasteredList,
        selectItem: saveWordToMasteredList,
        unselectItem: removeWordFromMasteredList
      }
    ],
    render: renderVocabPage
  });
  attachClickListener(vocabQuizNext, nextVocabQuizQuestion);
  attachClickListener(vocabQuizRestart, restartVocabQuiz);
  const vocabPageRoot = document.getElementById("flashcards");
  if (vocabPageRoot) {
    vocabPageRoot.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-vocab-today-review-start]");
      if (!trigger || !vocabPageRoot.contains(trigger)) {
        return;
      }

      event.preventDefault();
      handleVocabTodayReviewStartClick();
    });
  }
  attachClickListener(quizNext, nextQuiz);
  attachClickListener(quizRestart, startNewQuizSession);
  attachClickListener(quizClearMistakes, clearQuizMistakes);
  attachStateOptionsToggle(quizOptionsToggle, "quizOptionsOpen", renderQuizControls);
  attachValueButtonListeners(quizLevelButtons, (button) => button.dataset.quizLevel, setQuizLevel);
  attachValueButtonListeners(quizSizeButtons, (button) => getQuizSessionSize(button.dataset.quizSize), (nextSize) => {
    if (state.quizSessionSize === nextSize) {
      return;
    }

    state.quizSessionSize = nextSize;
    startNewQuizSession();
  });
  attachValueButtonListeners(quizModeButtons, (button) => getQuizMode(button.dataset.quizMode), (nextMode) => {
    if (state.quizMode === nextMode) {
      return;
    }

    state.quizMode = nextMode;
    startNewQuizSession();
  });
  attachValueButtonListeners(quizTimeButtons, (button) => button.dataset.quizTime, setQuizDuration);
  attachGrammarStudyListeners({
    grammarViewButtons,
    grammarLevelSelect,
    grammarFilterSelect,
    grammarPagePrev,
    grammarPageNext,
    grammarFlashcardToggle,
    grammarFlashcardPrev,
    grammarFlashcardNext,
    grammarFlashcardReview,
    grammarFlashcardMastered,
    grammarList
  });
  attachStateOptionsToggle(grammarPracticeOptionsToggle, "grammarPracticeOptionsOpen", renderGrammarPracticeControls);
  attachSelectValueListener(grammarPracticeLevelSelect, setGrammarPracticeLevel);
  attachSelectValueListener(grammarPracticeFilterSelect, setGrammarFilter);
  attachStateSpinner({
    spinner: grammarPracticeCountSpinner,
    options: grammarPracticeCountOptions,
    getCurrentValue: () => state.grammarPracticeCount,
    setValue: (value) => {
      state.grammarPracticeCount = value;
    },
    invalidate: () => {
      invalidateGrammarPracticeSession();
    },
    render: renderGrammarPractice
  });
  attachStateSpinner({
    spinner: grammarPracticeTimeSpinner,
    options: grammarPracticeDurationOptions,
    getCurrentValue: () => state.grammarPracticeDuration,
    setValue: (value) => {
      state.grammarPracticeDuration = value;
    },
    invalidate: () => {
      setQuizSessionDuration("grammar", state.grammarPracticeDuration);
    },
    render: renderGrammarPractice
  });
  attachClickListener(grammarPracticeStart, restartGrammarPractice);
  attachBulkResultActionListener({
    button: grammarPracticeResultBulkAction,
    getResults: getFilteredGrammarPracticeResults,
    datasetKey: "grammarPracticeBulkAction",
    removeActionValue: "remove-review",
    removeItem: removeGrammarFromReviewList,
    saveItem: saveGrammarToReviewList,
    render: renderGrammarPractice
  });
  attachBulkResultActionListener({
    button: grammarPracticeResultMasteredAction,
    getResults: getFilteredGrammarPracticeResults,
    datasetKey: "grammarPracticeMasteredBulkAction",
    removeActionValue: "remove-mastered",
    removeItem: removeGrammarFromMasteredList,
    saveItem: saveGrammarToMasteredList,
    render: renderGrammarPractice
  });
  attachResultFilterButtonListeners({
    buttons: grammarPracticeResultFilter,
    getNextValue: getGrammarPracticeResultFilter,
    getCurrentValue: () => getGrammarPracticeResultFilter(grammarPracticeState.resultFilter),
    setValue: (value) => {
      grammarPracticeState.resultFilter = value;
    },
    render: renderGrammarPracticeResults
  });
  attachToggleResultActionListener({
    list: grammarPracticeResultList,
    actions: [
      {
        selector: "[data-grammar-practice-review]",
        getId: (button) => button.dataset.grammarPracticeReview,
        isSelected: isGrammarSavedToReviewList,
        selectItem: saveGrammarToReviewList,
        unselectItem: removeGrammarFromReviewList
      },
      {
        selector: "[data-grammar-practice-mastered]",
        getId: (button) => button.dataset.grammarPracticeMastered,
        isSelected: isGrammarSavedToMasteredList,
        selectItem: saveGrammarToMasteredList,
        unselectItem: removeGrammarFromMasteredList
      }
    ],
    render: renderGrammarPractice
  });
  attachStateOptionsToggle(readingOptionsToggle, "readingOptionsOpen", renderReadingControls);
  attachSelectValueListener(readingLevelSelect, setReadingLevel);
  attachStateSpinner({
    spinner: readingCountSpinner,
    options: readingCountOptions,
    getCurrentValue: () => state.readingCount,
    setValue: (value) => {
      state.readingCount = value;
    },
    invalidate: () => {
      invalidateReadingPracticeSession();
    },
    render: renderReadingPractice
  });
  attachStateSpinner({
    spinner: readingTimeSpinner,
    options: readingDurationOptions,
    getCurrentValue: () => state.readingDuration,
    setValue: (value) => {
      state.readingDuration = value;
    },
    invalidate: () => {
      setQuizSessionDuration("reading", state.readingDuration);
    },
    render: renderReadingPractice
  });
  attachClickListener(readingStart, restartReadingPractice);
  attachResultFilterButtonListeners({
    buttons: readingPracticeResultFilter,
    getNextValue: getReadingPracticeResultFilter,
    getCurrentValue: () => getReadingPracticeResultFilter(readingPracticeState.resultFilter),
    setValue: (value) => {
      readingPracticeState.resultFilter = value;
    },
    render: renderReadingPracticeResults
  });
  attachClickListener(readingNext, nextReadingSet);
  attachClickListener(basicPracticeNext, nextBasicPracticeSet);
  attachKanjiStudyListeners({
    kanjiOptionsToggle,
    kanjiGradeButtons,
    kanjiViewButtons,
    kanjiCollectionSelect,
    kanjiGradeSelect,
    kanjiPagePrev,
    kanjiPageNext,
    kanjiFlashcardToggle,
    kanjiFlashcardPrev,
    kanjiFlashcardNext,
    kanjiFlashcardReview,
    kanjiFlashcardMastered,
    kanjiList
  });
  attachStateOptionsToggle(kanjiPracticeOptionsToggle, "kanjiPracticeQuizOptionsOpen", renderKanjiPracticeControls);
  attachLinkedFieldSelectors({
    questionSelect: kanjiPracticeQuestionField,
    optionSelect: kanjiPracticeOptionField,
    getQuestionField: getKanjiPracticeQuestionField,
    getOptionField: getKanjiPracticeOptionField,
    normalizeQuestionField: getKanjiPracticeQuestionField,
    normalizeOptionField: (value, previousOptionField) => getKanjiPracticeQuizField(value, previousOptionField),
    normalizeStoredQuestionField: getKanjiPracticeQuestionField,
    normalizeStoredOptionField: getKanjiPracticeOptionField,
    getDefaultOptionField: getDefaultKanjiPracticeOptionField,
    getDefaultQuestionField: getDefaultKanjiPracticeQuestionField,
    questionStateKey: "kanjiPracticeQuestionField",
    optionStateKey: "kanjiPracticeOptionField",
    invalidate: invalidateKanjiPracticeSession,
    render: renderKanjiPageLayout
  });
  attachSelectValueListener(kanjiPracticeCollectionSelect, setKanjiCollectionFilter);
  attachSelectValueListener(kanjiPracticeGradeSelect, setKanjiGrade);
  attachClickListener(kanjiPracticeStart, () => {
    if (state.kanjiPracticeQuizStarted) {
      invalidateKanjiPracticeSession();
      saveState();
      renderKanjiPageLayout();
      return;
    }

    if (!startNewKanjiPracticeSession()) {
      renderKanjiPageLayout();
      return;
    }

    saveState();
    renderKanjiPageLayout();
    scrollToElementById("kanji-practice-card");
  });
  attachStateSpinner({
    spinner: kanjiPracticeCountSpinner,
    options: kanjiPracticeQuizCountOptions,
    getCurrentValue: () => state.kanjiPracticeQuizCount,
    setValue: (value) => {
      state.kanjiPracticeQuizCount = value;
    },
    invalidate: invalidateKanjiPracticeSession,
    render: renderKanjiPageLayout
  });
  attachStateSpinner({
    spinner: kanjiPracticeTimeSpinner,
    options: quizDurationOptions,
    getCurrentValue: () => state.kanjiPracticeQuizDuration,
    setValue: (value) => {
      state.kanjiPracticeQuizDuration = value;
    },
    invalidate: invalidateKanjiPracticeSession,
    render: renderKanjiPageLayout
  });
  attachClickListener(kanjiPracticeNext, nextKanjiPracticeSet);
  attachClickListener(kanjiPracticeRestart, restartKanjiPractice);
  attachBulkResultActionListener({
    button: kanjiPracticeResultBulkAction,
    getResults: getFilteredKanjiPracticeResults,
    datasetKey: "kanjiPracticeBulkAction",
    removeActionValue: "remove-review",
    removeItem: removeKanjiFromReviewList,
    saveItem: saveKanjiToReviewList,
    render: renderKanjiPageLayout
  });
  attachBulkResultActionListener({
    button: kanjiPracticeResultMasteredAction,
    getResults: getFilteredKanjiPracticeResults,
    datasetKey: "kanjiPracticeMasteredBulkAction",
    removeActionValue: "remove-mastered",
    removeItem: removeKanjiFromMasteredList,
    saveItem: saveKanjiToMasteredList,
    render: renderKanjiPageLayout
  });
  attachResultFilterButtonListeners({
    buttons: kanjiPracticeResultFilter,
    getNextValue: getKanjiPracticeResultFilter,
    getCurrentValue: () => getKanjiPracticeResultFilter(kanjiPracticeState.resultFilter),
    setValue: (value) => {
      kanjiPracticeState.resultFilter = value;
    },
    render: renderKanjiPracticeResults
  });
  attachToggleResultActionListener({
    list: kanjiPracticeResultList,
    actions: [
      {
        selector: "[data-kanji-result-review]",
        getId: (button) => button.dataset.kanjiResultReview,
        isSelected: isKanjiSavedToReviewList,
        selectItem: saveKanjiToReviewList,
        unselectItem: removeKanjiFromReviewList
      },
      {
        selector: "[data-kanji-result-mastered]",
        getId: (button) => button.dataset.kanjiResultMastered,
        isSelected: isKanjiSavedToMasteredList,
        selectItem: saveKanjiToMasteredList,
        unselectItem: removeKanjiFromMasteredList
      }
    ],
    render: renderKanjiPageLayout
  });
  attachValueButtonListeners(kanjiTabButtons, (button) => button.dataset.kanjiTab, setKanjiTab);
  attachClickListener(grammarPracticeNext, nextGrammarPracticeSet);
  attachClickListener(kanaQuizNext, nextKanaQuizSheetQuestion);
  attachStateOptionsToggle(kanaSetupToggle, "kanaSetupOpen", renderKanaQuizSetup);
  attachValueButtonListeners(kanaModeButtons, (button) => button.dataset.kanaMode || "hiragana", (nextMode) => {
    kanaQuizSettings.mode = nextMode;
    renderKanaQuizSetup();
  });
  attachStateSpinner({
    spinner: kanaCountSpinner,
    options: kanaQuizCountOptions,
    getCurrentValue: () => kanaQuizSettings.count,
    setValue: (nextValue) => {
      kanaQuizSettings.count = nextValue;
    },
    render: renderKanaQuizSetup
  });
  attachStateSpinner({
    spinner: kanaTimeSpinner,
    options: kanaQuizDurationOptions,
    getCurrentValue: () => kanaQuizSettings.duration,
    setValue: (nextValue) => {
      kanaQuizSettings.duration = nextValue;
    },
    render: renderKanaQuizSetup
  });
  attachClickListener(kanaSetupStart, () => {
    if (kanaQuizSheetState.open) {
      closeKanaQuizSheet();
      return;
    }

    startKanaQuizSession(kanaQuizSettings.mode);
  });
  attachClickListener(kanaQuizRestart, () => {
    startKanaQuizSession(kanaQuizSettings.mode);
  });
  Object.entries(quizSessions).forEach(([key, session]) => {
    attachClickListener(document.getElementById(session.pauseButtonElement), () => {
      toggleQuizSessionPause(key);
    });
  });
  attachResultFilterButtonListeners({
    buttons: kanaQuizResultFilter,
    getNextValue: getKanaQuizResultFilter,
    getCurrentValue: () => getKanaQuizResultFilter(kanaQuizSheetState.resultFilter),
    setValue: (value) => {
      kanaQuizSheetState.resultFilter = value;
    },
    render: renderKanaQuizResults
  });
  attachValueButtonListeners(
    charactersTabButtons,
    (button) => getCharactersTab(button.dataset.charactersTab),
    (nextTab) => updateSimpleStateAndRender("charactersTab", nextTab, renderCharactersPageLayout)
  );
  attachValueButtonListeners(
    charactersLibraryTabButtons,
    (button) => getCharactersLibraryTab(button.dataset.charactersLibraryTab),
    (nextTab) => updateSimpleStateAndRender("charactersLibraryTab", nextTab, renderCharactersPageLayout)
  );
  attachValueButtonListeners(
    grammarTabButtons,
    (button) => getGrammarTab(button.dataset.grammarTab),
    (nextTab) => updateSimpleStateAndRender("grammarTab", nextTab, renderGrammarPageLayout)
  );
  attachValueButtonListeners(writingModeButtons, (button) => button.dataset.writingMode || "hiragana", (nextMode) => {
    if (nextMode === writingPracticeSettings.mode) {
      return;
    }

    startWritingPracticeSession(nextMode);
  });
  attachStateOptionsToggle(writingSetupToggle, "writingSetupOpen", renderWritingPracticeSetup);
  attachValueButtonListeners(
    writingOrderButtons,
    (button) => getWritingPracticeOrder(button.dataset.writingOrder),
    (nextOrder) => {
      if (nextOrder === writingPracticeSettings.order) {
        return;
      }

      startWritingPracticeSession(writingPracticeSettings.mode, nextOrder);
    }
  );
  attachClickListener(writingReplay, replayWritingStrokeAnimation);
  attachClickListener(writingGuideToggle, toggleWritingGuide);
  attachClickListener(writingRevealToggle, toggleWritingAnswer);
  attachClickListener(writingPrev, previousWritingPracticeItem);
  attachClickListener(writingClear, () => {
    clearWritingPracticeCanvas(true);
  });
  attachClickListener(writingScore, scoreWritingPractice);
  attachClickListener(writingNext, nextWritingPracticeItem);
  if (writingCanvas) {
    writingCanvas.addEventListener("pointerdown", handleWritingPointerDown);
    writingCanvas.addEventListener("pointermove", handleWritingPointerMove);
    writingCanvas.addEventListener("pointerup", finishWritingPointer);
    writingCanvas.addEventListener("pointercancel", finishWritingPointer);
  }
  observeWritingPracticeLayout();
  window.addEventListener("resize", () => {
    if (!document.getElementById("writing-practice-shell") || getCharactersTab(state.charactersTab) !== "writing") {
      return;
    }

    scheduleWritingPracticeLayout(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && kanaQuizSheetState.open) {
      closeKanaQuizSheet();
    }
  });
}

attachEventListeners();
