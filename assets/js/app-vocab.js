/* Japanote — vocab data loading helpers (split from app.js, phase 1) */
function getVocabStore() {
  if (globalThis.japanoteVocabStore && typeof globalThis.japanoteVocabStore.ensureLevels === "function") {
    return globalThis.japanoteVocabStore;
  }

  return null;
}

function getRequestedVocabLevels(level = "N5") {
  if (level === allLevelValue) {
    return [...contentLevels];
  }

  return contentLevels.includes(level) ? [level] : ["N5"];
}

function ensureVocabLevelsLoaded(level = "N5") {
  const vocabStore = getVocabStore();
  const requestedLevels = Array.isArray(level)
    ? Array.from(new Set(level.filter((itemLevel) => contentLevels.includes(itemLevel))))
    : getRequestedVocabLevels(level);

  if (!vocabStore) {
    return Promise.resolve([]);
  }

  return vocabStore.ensureLevels(requestedLevels);
}

const vocabFilterLabels = {
  all: "전체",
  review: "다시 볼래요",
  mastered: "익혔어요",
  unmarked: "아직 안 봤어요"
};

function getVocabItemPart(item) {
  return normalizeQuizText(item?.part) || "기타";
}
