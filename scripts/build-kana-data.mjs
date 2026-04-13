import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(repoRoot, "data-source", "kana-source.json");
const outputPath = resolve(repoRoot, "data", "kana.json");
const scripts = ["hiragana", "katakana"];
const entryFilePath = fileURLToPath(import.meta.url);

function loadJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read ${label}: ${error.message}`);
  }
}

function writeJson(filePath, payload) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || !value.length) {
    throw new Error(`${label} must be a non-empty array.`);
  }

  return value.map((item, index) => requireNonEmptyString(item, `${label}[${index}]`));
}

function isConvertibleHiraganaCodePoint(codePoint) {
  return (
    (codePoint >= 0x3041 && codePoint <= 0x3096) ||
    codePoint === 0x309d ||
    codePoint === 0x309e
  );
}

function convertHiraganaToKatakana(text, label) {
  return Array.from(requireNonEmptyString(text, label))
    .map((character) => {
      const codePoint = character.codePointAt(0);

      if (!isConvertibleHiraganaCodePoint(codePoint)) {
        throw new Error(`Failed to convert "${character}" in ${label} to katakana.`);
      }

      return String.fromCodePoint(codePoint + 0x60);
    })
    .join("");
}

function shuffleDeterministic(values, seedText) {
  let seed = 0;

  for (const character of seedText) {
    seed = (seed * 31 + character.codePointAt(0)) >>> 0;
  }

  const nextValues = [...values];

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [nextValues[index], nextValues[swapIndex]] = [nextValues[swapIndex], nextValues[index]];
  }

  return nextValues;
}

function uniqueValues(values) {
  return (Array.isArray(values) ? values : []).filter((value, index, source) => source.indexOf(value) === index);
}

function replaceTemplateTokens(template, tokens) {
  return requireNonEmptyString(template, "practiceTemplates.*.explanationTemplate").replace(
    /\{\{(char|reading|group)\}\}/g,
    (_, key) => tokens[key] || ""
  );
}

function validatePracticeTemplate(script, value) {
  const template = value && typeof value === "object" ? value : null;

  if (!template) {
    throw new Error(`practiceTemplates.${script} must be an object.`);
  }

  const explanationTemplate = requireNonEmptyString(
    template.explanationTemplate,
    `practiceTemplates.${script}.explanationTemplate`
  );

  if (!explanationTemplate.includes("{{char}}") || !explanationTemplate.includes("{{reading}}")) {
    throw new Error(`practiceTemplates.${script}.explanationTemplate must include {{char}} and {{reading}}.`);
  }

  return {
    label: requireNonEmptyString(template.label, `practiceTemplates.${script}.label`),
    heading: requireNonEmptyString(template.heading, `practiceTemplates.${script}.heading`),
    sourcePrefix: requireNonEmptyString(template.sourcePrefix, `practiceTemplates.${script}.sourcePrefix`),
    title: requireNonEmptyString(template.title, `practiceTemplates.${script}.title`),
    note: requireNonEmptyString(template.note, `practiceTemplates.${script}.note`),
    prompt: requireNonEmptyString(template.prompt, `practiceTemplates.${script}.prompt`),
    explanationTemplate
  };
}

function validateSourceGroups(groups) {
  if (!Array.isArray(groups) || !groups.length) {
    throw new Error("groups must be a non-empty array.");
  }

  const groupIds = new Set();
  const pairKeys = new Set();

  return groups.map((group, groupIndex) => {
    const normalizedGroup = group && typeof group === "object" ? group : null;

    if (!normalizedGroup) {
      throw new Error(`groups[${groupIndex}] must be an object.`);
    }

    const id = requireNonEmptyString(normalizedGroup.id, `groups[${groupIndex}].id`);
    const title = requireNonEmptyString(normalizedGroup.title, `groups[${groupIndex}].title`);

    if (groupIds.has(id)) {
      throw new Error(`Duplicate group id "${id}" found in groups.`);
    }

    groupIds.add(id);

    if (!Array.isArray(normalizedGroup.items) || !normalizedGroup.items.length) {
      throw new Error(`groups[${groupIndex}].items must be a non-empty array.`);
    }

    const items = normalizedGroup.items.map((item, itemIndex) => {
      const normalizedItem = item && typeof item === "object" ? item : null;

      if (!normalizedItem) {
        throw new Error(`groups[${groupIndex}].items[${itemIndex}] must be an object.`);
      }

      const reading = requireNonEmptyString(
        normalizedItem.reading,
        `groups[${groupIndex}].items[${itemIndex}].reading`
      );
      const hiragana = requireNonEmptyString(
        normalizedItem.hiragana,
        `groups[${groupIndex}].items[${itemIndex}].hiragana`
      );
      const pairKey = `${reading}\u0000${hiragana}`;

      if (pairKeys.has(pairKey)) {
        throw new Error(`Duplicate reading/hiragana pair "${reading}" / "${hiragana}" found.`);
      }

      pairKeys.add(pairKey);
      return normalizedItem.quiz === false ? { reading, hiragana, quiz: false } : { reading, hiragana };
    });

    return {
      id,
      title,
      items
    };
  });
}

function buildLibraryGroups(groups, script) {
  return groups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      reading: item.reading,
      char:
        script === "hiragana"
          ? item.hiragana
          : convertHiraganaToKatakana(item.hiragana, `groups.${group.id}.${item.reading}`),
      quiz: item.quiz !== false,
      group: group.title
    }))
  }));
}

function buildTrack(libraryGroups, template, toneCycle, script) {
  const quizItems = libraryGroups.flatMap((group) => group.items.filter((item) => item.quiz !== false));

  if (quizItems.length < 4) {
    throw new Error(`${script} quiz items must contain at least 4 quiz-enabled entries.`);
  }

  const items = quizItems.map((item, index) => {
    const distractors = uniqueValues(
      shuffleDeterministic(
        quizItems
          .filter((candidate) => candidate.char !== item.char)
          .map((candidate) => candidate.reading),
        `${script}:${item.char}:${item.reading}`
      )
    ).slice(0, 3);

    if (distractors.length < 3) {
      throw new Error(`Failed to build 4 options for ${script} item "${item.char}" (${item.reading}).`);
    }

    const options = shuffleDeterministic([item.reading, ...distractors], `${script}:options:${item.char}`);
    const answer = options.indexOf(item.reading);

    if (answer < 0) {
      throw new Error(`Failed to locate the correct answer for ${script} item "${item.char}".`);
    }

    return {
      id: `bp-${script}-${index}`,
      source: `${template.sourcePrefix} ${index + 1}`,
      title: template.title,
      note: template.note,
      prompt: template.prompt,
      display: item.char,
      displaySub: item.group,
      options,
      answer,
      explanation: replaceTemplateTokens(template.explanationTemplate, {
        char: item.char,
        reading: item.reading,
        group: item.group
      }),
      tone: toneCycle[index % toneCycle.length]
    };
  });

  return {
    label: template.label,
    heading: template.heading,
    items
  };
}

function buildKanaData(source) {
  const groups = validateSourceGroups(source?.groups);
  const toneCycle = requireStringArray(source?.toneCycle, "toneCycle");
  const practiceTemplates = {
    hiragana: validatePracticeTemplate("hiragana", source?.practiceTemplates?.hiragana),
    katakana: validatePracticeTemplate("katakana", source?.practiceTemplates?.katakana)
  };

  const library = {
    hiragana: buildLibraryGroups(groups, "hiragana"),
    katakana: buildLibraryGroups(groups, "katakana")
  };

  return {
    library,
    tracks: {
      hiragana: buildTrack(library.hiragana, practiceTemplates.hiragana, toneCycle, "hiragana"),
      katakana: buildTrack(library.katakana, practiceTemplates.katakana, toneCycle, "katakana")
    }
  };
}

function parseCliArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--source" && argv[index + 1]) {
      options.sourcePath = resolve(repoRoot, argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--output" && argv[index + 1]) {
      options.outputPath = resolve(repoRoot, argv[index + 1]);
      index += 1;
    }
  }

  return options;
}

export function buildKanaDataFile(options = {}) {
  const nextSourcePath = options.sourcePath || sourcePath;
  const nextOutputPath = options.outputPath || outputPath;
  const source = loadJson(nextSourcePath, "data-source/kana-source.json");
  const output = buildKanaData(source);

  writeJson(nextOutputPath, output);
  console.log(`Wrote ${nextOutputPath}`);
}

function isDirectRun() {
  return Boolean(process.argv[1] && resolve(process.argv[1]) === entryFilePath);
}

if (isDirectRun()) {
  try {
    // 런타임은 기존 data/kana.json 구조를 유지하고, 정본 스키마 확장만 이 스크립트에서 맡는다.
    buildKanaDataFile(parseCliArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
