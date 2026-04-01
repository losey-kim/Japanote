  function createChoiceQuizLayout({
    shellClassName = "match-shell",
    sidebarClassName = "match-sidebar",
    sidebarHead,
    optionsShellConfig,
    sidebarExtra = "",
    startButton = "",
    boardClassName = "match-board",
    boardId,
    emptyId,
    boardMessageText,
    practiceViewId,
    cardConfig,
    resultConfig
  }) {
    const boardIdAttr = boardId ? ` id="${escapeHtml(boardId)}"` : "";

    return createPracticeLayout({
      shellClassName,
      sidebarClassName,
      sidebarHead,
      optionsShellConfig,
      sidebarExtra,
      startButton,
      boardMarkup: `
        <div class="${escapeHtml(boardClassName)}"${boardIdAttr}>
          ${createPracticeEmptyMessage({ id: emptyId, text: boardMessageText })}
          <div id="${escapeHtml(practiceViewId)}">
            ${createChoiceQuizCard(cardConfig)}
          </div>
          ${createPrefixedResultView(resultConfig)}
        </div>
      `
    });
  }

  function createChoiceQuizLayout({
    shellClassName = "match-shell",
    sidebarClassName = "match-sidebar",
    sidebarHead,
    optionsShellConfig,
    sidebarExtra = "",
    startButton = "",
    boardClassName = "match-board",
    boardId,
    emptyId,
    boardMessageText,
    practiceViewId,
    cardConfig,
    resultConfig
  }) {
    const boardIdAttr = boardId ? ` id="${escapeHtml(boardId)}"` : "";

    return createPracticeLayout({
      shellClassName,
      sidebarClassName,
      sidebarHead,
      optionsShellConfig,
      sidebarExtra,
      startButton,
      boardMarkup: `
        <div class="${escapeHtml(boardClassName)}"${boardIdAttr}>
          ${createPracticeEmptyMessage({ id: emptyId, text: boardMessageText })}
          <div id="${escapeHtml(practiceViewId)}">
            ${createChoiceQuizCard(cardConfig)}
          </div>
          ${createPrefixedResultView(resultConfig)}
        </div>
      `
    });
  }

  function createVocabQuizLayout() {
    const vocabQuizFieldSelectOptions = [
      { value: "reading", label: "단어, 읽기" },
      { value: "word", label: "단어" },
      { value: "meaning", label: "뜻" }
    ];

    return createChoiceQuizLayout({
      shellClassName: "match-shell vocab-quiz-shell",
      sidebarClassName: "match-sidebar vocab-quiz-sidebar",
      sidebarHead: '<div class="match-sidebar-head"><span class="eyebrow">QUIZ HUD</span><h3>단어 퀴즈</h3></div>',
      optionsShellConfig: {
        shellId: "vocab-quiz-options-shell",
        shellClassName: "match-options-shell",
        toggleId: "vocab-quiz-options-toggle",
        toggleTitle: "퀴즈 시작, 문제 설정",
        summaryId: "vocab-quiz-options-summary",
        summaryText: "단어, 읽기 10문제 15초",
        panelId: "vocab-quiz-options-panel",
        panelClassName: "study-options-panel-wide",
        isOpen: false,
        groups: [
          ...createQuizFieldGroups({
            questionField: {
              groupLabel: "문항 항목",
              id: "vocab-quiz-question-field",
              ariaLabel: "단어 퀴즈 문항 항목 선택",
              options: vocabQuizFieldSelectOptions
            },
            optionField: {
              groupLabel: "정답 항목",
              id: "vocab-quiz-option-field",
              ariaLabel: "단어 퀴즈 정답 항목 선택",
              options: vocabQuizFieldSelectOptions
            }
          }),
          {
            label: "문항 수",
            content: createQuestionCountSpinner({
              spinnerId: "vocab-quiz-count",
              ariaLabel: "단어 퀴즈 문항 개수",
              activeValue: 10
            })
          },
          {
            label: "제한 시간",
            content: createDurationSpinner({
              spinnerId: "vocab-quiz-time",
              ariaLabel: "단어 퀴즈 제한 시간",
              activeValue: 15
            })
          }
        ]
      },
      sidebarExtra: createVocabQuizSidebarToolbarHtml(),
      startButton: createActionButton({
        id: "vocab-quiz-restart",
        labelId: "vocab-quiz-restart-label",
        label: "퀴즈 다시 시작"
      }),
      boardClassName: "match-board vocab-quiz-board",
      boardId: "vocab-quiz-board",
      boardMessageText: QUIZ_BOARD_READY_MESSAGE,
      emptyId: "vocab-quiz-empty",
      practiceViewId: "vocab-quiz",
      cardConfig: {
        articleId: "vocab-quiz-card",
        className: "basic-practice-card vocab-quiz-card",
        metaItems: [
          { id: "vocab-quiz-track", text: "일일선" },
          { id: "vocab-quiz-source", text: "N5 일일선" }
        ],
        hudItems: [
          { label: "진행", valueId: "vocab-quiz-progress", value: "0 / 0" },
          { label: "남은 시간", valueId: "vocab-quiz-timer", value: "15초" }
        ],
        header: {
          className: "basic-practice-header",
          eyebrow: "VOCAB QUIZ",
          titleId: "vocab-quiz-title",
          title: "단어 퀴즈",
          noteClassName: "basic-practice-note",
          noteId: "vocab-quiz-note",
          note: "문항은 자동으로 제공됩니다."
        },
        promptBox: {
          className: "basic-practice-prompt-box",
          eyebrow: "QUESTION",
          textId: "vocab-quiz-prompt",
          text: "문항은 임의로 준비됩니다."
        },
        displayBox: {
          className: "basic-practice-display-box",
          titleId: "vocab-quiz-display",
          title: "-",
          subtitleId: "vocab-quiz-display-sub",
          subtitle: ""
        },
        optionsId: "vocab-quiz-options",
        feedbackId: "vocab-quiz-feedback",
        explanationId: "vocab-quiz-explanation",
        nextButtonId: "vocab-quiz-next",
        nextButtonLabel: "다음 문제 고르기"
      },
      resultConfig: {
        idPrefix: "vocab-quiz",
        filterAriaLabel: "단어 퀴즈 결과 보기",
        bulkActionLabel: QUIZ_RESULT_ALL_ACTION_LABEL
      }
    });
  }

  function createStarterKanjiLayout() {
    const starterKanjiQuestionFieldOptions = [
      { value: "display", label: "단어" },
      { value: "reading", label: "독음" }
    ];
    const starterKanjiOptionFieldOptions = [
      { value: "reading", label: "독음" },
      { value: "display", label: "단어" }
    ];

    return createChoiceQuizLayout({
      sidebarHead: '<div class="match-sidebar-head"><span class="eyebrow">QUIZ HUD</span><h3>한자 퀴즈</h3></div>',
      optionsShellConfig: {
        shellId: "starter-kanji-options-shell",
        shellClassName: "match-options-shell kanji-options-shell",
        toggleId: "starter-kanji-options-toggle",
        toggleTitle: "퀴즈 설정, 문제 설정",
        summaryId: "starter-kanji-options-summary",
        summaryText: "한자 10문항 15초",
        panelId: "starter-kanji-options-panel",
        panelClassName: "study-options-panel-wide",
        isOpen: false,
        groups: [
          ...createQuizFieldGroups({
            questionField: {
              groupLabel: "문항 항목",
              id: "starter-kanji-question-field",
              ariaLabel: "한자 퀴즈 문항 항목 선택",
              options: starterKanjiQuestionFieldOptions
            },
            optionField: {
              groupLabel: "보기 항목",
              id: "starter-kanji-option-field",
              ariaLabel: "한자 퀴즈 보기 항목 선택",
              options: starterKanjiOptionFieldOptions
            }
          }),
          ...createQuestionDurationGroups({
            countSpinnerId: "starter-kanji-count",
            countAriaLabel: "한자 퀴즈 문항 개수",
            countValue: 10,
            durationSpinnerId: "starter-kanji-time",
            durationAriaLabel: "한자 퀴즈 제한 시간",
            durationValue: 15
          })
        ]
      },
      sidebarExtra: createKanjiGradeCollectionToolbarHtml({
        toolbarAriaLabel: "한자 퀴즈 설정",
        toolbarClassName: "vocab-select-toolbar vocab-select-toolbar-sidebar kanji-filter-toolbar",
        gradeSelectId: "starter-kanji-grade-select",
        collectionSelectId: "starter-kanji-collection-select",
        ariaPrefix: "한자 퀴즈",
        collectionOptions: KANJI_COLLECTION_OPTIONS_BASIC,
        fieldOrder: "grade-first"
      }),
      startButton: createStartQuizButton({ id: "starter-kanji-start", labelId: "starter-kanji-start-label" }),
      emptyId: "starter-kanji-empty",
      practiceViewId: "starter-kanji-practice-view",
      cardConfig: {
        articleId: "starter-kanji-card",
        className: "basic-practice-card tone-gold kanji-practice-card",
        metaItems: [
          { text: "한자" },
          { id: "starter-kanji-source", text: "한자 1" },
          { id: "starter-kanji-progress", text: "1 / 5" }
        ],
        hudItems: [
          { label: "남은 시간", valueId: "starter-kanji-timer", value: "15초" },
          { label: "정답 수", valueId: "starter-kanji-correct", value: "0" }
        ],
        displayBox: {
          className: "basic-practice-display-box",
          titleId: "starter-kanji-display",
          title: "-",
          subtitleId: "starter-kanji-display-sub",
          subtitle: ""
        },
        optionsId: "starter-kanji-options",
        nextButtonId: "starter-kanji-next",
        nextButtonLabel: "다음 한자 문제 고르기"
      },
      resultConfig: {
        idPrefix: "starter-kanji",
        className: "match-result-view kanji-result-view",
        filterAriaLabel: "한자 퀴즈 결과 보기",
        bulkActionLabel: QUIZ_RESULT_RETRY_ALL_ACTION_LABEL,
        footerHtml:
          '<div class="quiz-actions"><button class="primary-btn button-with-icon" id="starter-kanji-restart" type="button"><span class="material-symbols-rounded" aria-hidden="true">autorenew</span><span>모든 문제 다시 시작</span></button></div>'
      }
    });
  }