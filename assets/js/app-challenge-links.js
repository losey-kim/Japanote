/* Japanote — challenge-links provider registration (split from app.js) */
(function registerJapanoteChallengeLinkProviders() {
  const japanoteChallengeLinks = window.japanoteChallengeLinks;

  function cloneChallengeSessionData(payload) {
    return JSON.parse(JSON.stringify(payload));
  }

  if (japanoteChallengeLinks && typeof japanoteChallengeLinks.registerProvider === "function") {
  japanoteChallengeLinks.registerProvider({
    resultViewId: "vocab-quiz-result-view",
    kind: "vocab-quiz",
    getTargetHash: () => "#quiz",
    getApplyMessage: () => "친구가 보낸 단어 퀴즈가 열렸어요.",
    createPayload: () => {
      if (!activeVocabQuizQuestions.length) {
        return null;
      }

      return {
        config: {
          level: getVocabLevel(),
          filter: getVocabFilter(),
          part: getVocabPartFilter(),
          questionField: getVocabQuizQuestionField(),
          optionField: getVocabQuizOptionField(),
          count: getVocabQuizCount(),
          duration: getVocabQuizDuration()
        },
        questions: cloneChallengeSessionData(activeVocabQuizQuestions)
      };
    },
    applyPayload: (payload) => {
      if (!Array.isArray(payload?.questions) || !payload.questions.length) {
        return false;
      }

      invalidateVocabQuizSession();
      state.vocabTab = "quiz";
      syncVocabLocationHash("quiz");
      state.vocabLevel = getVocabLevel(payload.config?.level);
      state.vocabFilter = getVocabFilter(payload.config?.filter);
      state.vocabPartFilter = getVocabPartFilter(payload.config?.part);
      state.vocabQuizQuestionField = getVocabQuizQuestionField(payload.config?.questionField);
      state.vocabQuizOptionField = getVocabQuizOptionField(
        payload.config?.optionField,
        state.vocabQuizQuestionField
      );
      state.vocabQuizCount = getVocabQuizCount(payload.config?.count);
      state.vocabQuizDuration = getVocabQuizDuration(payload.config?.duration);
      activeVocabQuizChallengePayload = cloneChallengeSessionData(payload);
      restoreChallengeVocabQuizSession();
      renderVocabPage();
      scrollToElementById("vocab-quiz-card");
      return true;
    }
  });

  japanoteChallengeLinks.registerProvider({
    resultViewId: "grammar-practice-result-view",
    kind: "grammar-practice",
    getApplyMessage: () => "친구가 보낸 문법 도전이 열렸어요.",
    createPayload: () => {
      if (!activeGrammarPracticeQuestions.length) {
        return null;
      }

      return {
        config: {
          level: getGrammarPracticeLevel(state.grammarPracticeLevel),
          filter: getGrammarFilter(state.grammarFilter),
          count: getGrammarPracticeCount(state.grammarPracticeCount),
          duration: getGrammarPracticeDuration(state.grammarPracticeDuration)
        },
        questions: cloneChallengeSessionData(activeGrammarPracticeQuestions)
      };
    },
    applyPayload: (payload) => {
      if (!Array.isArray(payload?.questions) || !payload.questions.length) {
        return false;
      }

      resetGrammarPracticeSessionState();
      state.grammarTab = "practice";
      state.grammarPracticeLevel = getGrammarPracticeLevel(payload.config?.level);
      state.grammarFilter = getGrammarFilter(payload.config?.filter);
      state.grammarPracticeCount = getGrammarPracticeCount(payload.config?.count);
      state.grammarPracticeDuration = getGrammarPracticeDuration(payload.config?.duration);
      activeGrammarPracticeQuestions = cloneChallengeSessionData(payload.questions);
      grammarPracticeState.results = [];
      grammarPracticeState.showResults = false;
      grammarPracticeState.resultFilter = "all";
      state.grammarPracticeStarted = true;
      state.grammarPracticeSessionQuestionIndex = 0;
      setQuizSessionDuration("grammar", state.grammarPracticeDuration);
      saveState();
      renderGrammarPageLayout();
      document.querySelector('[data-grammar-tab-panel="practice"]')?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return true;
    }
  });

  japanoteChallengeLinks.registerProvider({
    resultViewId: "kanji-practice-result-view",
    kind: "kanji-practice",
    getApplyMessage: () => "친구가 보낸 한자 도전이 열렸어요.",
    createPayload: () => {
      if (!activeKanjiPracticeQuestions.length) {
        return null;
      }

      return {
        config: {
          collectionFilter: getKanjiCollectionFilter(),
          grade: getKanjiGrade(),
          questionField: getKanjiPracticeQuestionField(),
          optionField: getKanjiPracticeOptionField(),
          count: getKanjiPracticeQuizCount(),
          duration: getKanjiPracticeQuizDuration()
        },
        questions: cloneChallengeSessionData(activeKanjiPracticeQuestions)
      };
    },
    applyPayload: (payload) => {
      if (!Array.isArray(payload?.questions) || !payload.questions.length) {
        return false;
      }

      resetKanjiPracticeSessionState(true);
      state.kanjiTab = "practice";
      state.kanjiCollectionFilter = getKanjiCollectionFilter(payload.config?.collectionFilter);
      state.kanjiGrade = getKanjiGrade(payload.config?.grade);
      state.kanjiPracticeQuestionField = getKanjiPracticeQuestionField(payload.config?.questionField);
      state.kanjiPracticeOptionField = getKanjiPracticeOptionField(
        payload.config?.optionField,
        state.kanjiPracticeQuestionField
      );
      state.kanjiPracticeQuizCount = getKanjiPracticeQuizCount(payload.config?.count);
      state.kanjiPracticeQuizDuration = getKanjiPracticeQuizDuration(payload.config?.duration);
      activeKanjiPracticeQuestions = cloneChallengeSessionData(payload.questions);
      kanjiPracticeState.results = [];
      kanjiPracticeState.showResults = false;
      kanjiPracticeState.resultFilter = "all";
      state.kanjiPracticeQuizStarted = true;
      state.kanjiPracticeQuizFinished = false;
      state.basicPracticeIndexes.kanji = 0;
      setQuizSessionDuration("kanjiPractice", state.kanjiPracticeQuizDuration);
      saveState();
      renderKanjiPageLayout();
      document.querySelector('[data-kanji-tab-panel="practice"]')?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return true;
    }
  });

  japanoteChallengeLinks.registerProvider({
    resultViewId: "kana-quiz-result-view",
    kind: "kana-quiz",
    getApplyMessage: () => "친구가 보낸 문자 도전이 열렸어요.",
    createPayload: () => {
      if (!Array.isArray(kanaQuizSheetState.sessionItems) || !kanaQuizSheetState.sessionItems.length) {
        return null;
      }

      return {
        config: {
          mode: kanaQuizSettings.mode,
          count: kanaQuizSettings.count,
          duration: kanaQuizSettings.duration
        },
        sessionItems: cloneChallengeSessionData(kanaQuizSheetState.sessionItems)
      };
    },
    applyPayload: (payload) => {
      if (!Array.isArray(payload?.sessionItems) || !payload.sessionItems.length) {
        return false;
      }

      const nextDuration = Number(payload.config?.duration);
      state.charactersTab = "quiz";
      kanaQuizSettings.mode = ["hiragana", "katakana", "random"].includes(payload.config?.mode)
        ? payload.config.mode
        : "hiragana";
      kanaQuizSettings.count = payload.config?.count ?? kanaQuizSettings.count;
      if (Number.isFinite(nextDuration) && nextDuration >= 0) {
        kanaQuizSettings.duration = nextDuration;
      }
      kanaQuizSheetState.mode = kanaQuizSettings.mode;
      kanaQuizSheetState.sessionItems = cloneChallengeSessionData(payload.sessionItems);
      kanaQuizSheetState.sessionIndex = 0;
      kanaQuizSheetState.answered = false;
      kanaQuizSheetState.finished = false;
      kanaQuizSheetState.open = true;
      kanaQuizSheetState.results = [];
      kanaQuizSheetState.resultFilter = "all";
      setQuizSessionDuration("kana", Number(kanaQuizSettings.duration));
      resetQuizSessionScore("kana");
      stopQuizSessionTimer("kana");
      saveState();
      renderCharactersPageLayout();
      renderKanaQuizSetup();
      renderQuizSessionHud("kana");
      renderKanaQuizSheet();
      resetQuizSessionTimer("kana", handleKanaQuizTimeout);
      document.querySelector('[data-characters-tab-panel="quiz"]')?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return true;
    }
  });
  }
})();
