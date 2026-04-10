import { readFile, writeFile } from "node:fs/promises";

const DATA_PATH = new URL("../data/kanji.json", import.meta.url);
const WIKTIONARY_API_URL = "https://ko.wiktionary.org/w/api.php";
const BATCH_SIZE = 50;
const RETRY_DELAYS_MS = [500, 1000, 2000];

const KOREAN_SECTION_TITLE = "\uD55C\uAD6D\uC5B4";
const HANJA_SECTION_TITLE = "\uD55C\uC790";
const HUN_LABEL = "\uD6C8";

const manualMeaningMap = {
  "\u56F3": "\uADF8\uB9BC, \uB3C4\uBA74",
  "\u5199": "\uBCA0\uB07C\uB2E4, \uBE44\uCD94\uB2E4",
  "\u5BFE": "\uC0C1\uB300, \uB9C8\uC8FC\uD558\uB2E4",
  "\u55B6": "\uC6B4\uC601\uD558\uB2E4, \uACBD\uC601\uD558\uB2E4",
  "\u691C": "\uAC80\uC0AC\uD558\uB2E4, \uC870\uC0AC\uD558\uB2E4",
  "\u96D1": "\uC7A1\uB2E4, \uC11E\uC774\uB2E4",
  "\u8CDB": "\uCC2C\uC131\uD558\uB2E4, \uB3D5\uB2E4",
  "\u820E": "\uC9D1, \uBA38\uBB34\uB974\uB2E4",
  "\u72EC": "\uD640\uB85C, \uD63C\uC790",
  "\u5E72": "\uB9C8\uB974\uB2E4, \uB9D0\uB9AC\uB2E4",
  "\u5DFB": "\uB450\uB8E8\uB9C8\uB9AC, \uB9D0\uB2E4",
  "\u90F7": "\uC2DC\uACE8, \uACE0\uD5A5",
  "\u53B3": "\uC5C4\uD558\uB2E4, \uC5C4\uC219\uD558\uB2E4",
  "\u6E08": "\uB05D\uB098\uB2E4, \uAD6C\uD558\uB2E4",
  "\u8695": "\uB204\uC5D0",
  "\u5F93": "\uB530\uB974\uB2E4, \uC88B\uB2E4",
  "\u7E26": "\uC138\uB85C",
  "\u51E6": "\uACF3, \uCC98\uB9AC\uD558\uB2E4",
  "\u92AD": "\uB3C8, \uB3D9\uC804",
  "\u88C5": "\uAFB8\uBBF8\uB2E4, \uCC28\uB9AC\uB2E4",
  "\u81D3": "\uB0B4\uC7A5, \uCC3D\uC790",
  "\u5C4A": "\uB2FF\uB2E4, \uC2E0\uACE0\uD558\uB2E4",
  "\u4FF3": "\uBC30\uC6B0, \uC775\uC0B4",
  "\u4E71": "\uC5B4\uC9C0\uB7FD\uB2E4, \uC5B4\uC9C0\uB7FD\uD788\uB2E4",
  "\u89A7": "\uBCF4\uB2E4, \uD6D1\uC5B4\uBCF4\uB2E4",
  "\u6B63": "\uBC14\uB974\uB2E4, \uC62C\uBC14\uB974\uB2E4",
  "\u5148": "\uBA3C\uC800, \uC55E",
  "\u539F": "\uBC8C\uD310, \uC6D0\uB798",
  "\u56FD": "\uB098\uB77C",
  "\u65B0": "\uC0C8\uB86D\uB2E4",
  "\u5730": "\uB545, \uACF3",
  "\u7B54": "\uB300\uB2F5, \uB300\uB2F5\uD558\uB2E4",
  "\u98A8": "\uBC14\uB78C, \uD48D",
  "\u6BCE": "\uB9E4\uBC88, \uB9C8\uB2E4",
  "\u4E07": "\uB9CC, \uB9CE\uB2E4",
  "\u98F2": "\uB9C8\uC2DC\uB2E4",
  "\u904B": "\uB098\uB974\uB2E4, \uC6B4",
  "\u6F22": "\uD55C\uB098\uB77C, \uC911\uAD6D",
  "\u6025": "\uAE09\uD558\uB2E4, \uC11C\uB450\uB974\uB2E4",
  "\u7814": "\uAC08\uB2E4, \uC5F0\uAD6C\uD558\uB2E4",
  "\u52DD": "\uC774\uAE30\uB2E4, \uB0AB\uB2E4",
  "\u6DF1": "\uAE4A\uB2E4",
  "\u7B2C": "\uCC28\uB840",
  "\u554F": "\uBB3B\uB2E4, \uBB38\uC81C",
  "\u5354": "\uD611\uB825\uD558\uB2E4, \uD568\uAED8\uD558\uB2E4",
  "\u6C0F": "\uC131\uC528",
  "\u713C": "\uAD7D\uB2E4, \uD0DC\uC6B0\uB2E4",
  "\u7136": "\uADF8\uB7EC\uD558\uB2E4",
  "\u5FC5": "\uBC18\uB4DC\uC2DC",
  "\u5229": "\uC774\uB85C\uC6C0, \uB0A0\uCE74\uB86D\uB2E4",
  "\u9678": "\uB965\uC9C0",
  "\u6C38": "\uC601\uC6D0\uD558\uB2E4, \uAE38\uB2E4",
  "\u685C": "\uBC9A\uAF43",
  "\u753A": "\uB9C8\uC744, \uAC70\uB9AC",
  "\u5F53": "\uB9DE\uB2E4, \uB9C8\uB545\uD558\uB2E4",
  "\u5B98": "\uAD00\uCCAD, \uAD00\uB9AC",
  "\u95A2": "\uAD00\uACC4, \uAD00\uBB38",
  "\u6319": "\uB4E4\uB2E4, \uAC70\uB860\uD558\uB2E4",
  "\u57CE": "\uC131",
  "\u6226": "\uC804\uC7C1, \uC2F8\uC6B0\uB2E4",
  "\u9271": "\uAD11\uC11D, \uAD11\uBB3C",
  "\u7DCF": "\uCD1D, \uBAA8\uB450",
  "\u62C5": "\uBA54\uB2E4, \uB2F4\uB2F9\uD558\uB2E4",
  "\u62DD": "\uC808\uD558\uB2E4, \uACF5\uACBD\uD558\uB2E4",
  "\u9006": "\uAC70\uC2A4\uB974\uB2E4, \uBC18\uB300",
  "\u7D4C": "\uC9C0\uB098\uB2E4, \uACBD\uACFC\uD558\uB2E4",
  "\u9650": "\uD55C\uACC4, \uD55C\uC815\uD558\uB2E4",
  "\u6545": "\uC608\uC804, \uAE4C\uB2ED",
  "\u8A2D": "\uC138\uC6B0\uB2E4, \uC124\uCE58\uD558\uB2E4",
  "\u5C5E": "\uC18D\uD558\uB2E4, \uBB34\uB9AC",
  "\u5831": "\uC54C\uB9AC\uB2E4, \uAC1A\uB2E4",
  "\u547C": "\uBD80\uB974\uB2E4",
  "\u518A": "\uCC45, \uCC45\uC790",
  "\u719F": "\uC775\uB2E4, \uC775\uC219\uD558\uB2E4",
  "\u76DB": "\uC131\uD558\uB2E4, \uBC88\uC131\uD558\uB2E4",
  "\u5C02": "\uC624\uB85C\uC9C0, \uC804\uBB38",
  "\u8535": "\uAC10\uCD94\uB2E4, \uCC3D\uACE0",
  "\u9810": "\uBBF8\uB9AC, \uB9E1\uAE30\uB2E4",
  "\u6B32": "\uC695\uC2EC, \uBC14\uB77C\uB2E4"
};

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSectionHeading(line, maxLevel) {
  const match = String(line).trim().match(/^(=+)\s*([^=]+?)\s*\1\s*$/);
  return match ? match[1].length <= maxLevel : false;
}

function getSectionByTitle(raw, title, level) {
  const lines = String(raw || "").split(/\r?\n/);
  const headingRegex = new RegExp(`^${"=".repeat(level)}\\s*${escapeRegExp(title)}\\s*${"=".repeat(level)}\\s*$`);
  let start = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (headingRegex.test(lines[index].trim())) {
      start = index + 1;
      break;
    }
  }

  if (start < 0) {
    return "";
  }

  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    if (isSectionHeading(lines[index], level)) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join("\n");
}

function getScopedWikitext(raw) {
  const koreanSection = getSectionByTitle(raw, KOREAN_SECTION_TITLE, 2);
  const rootHanjaSection = getSectionByTitle(raw, HANJA_SECTION_TITLE, 2);

  if (!koreanSection) {
    return rootHanjaSection || raw;
  }

  const koreanHanjaSection = getSectionByTitle(koreanSection, HANJA_SECTION_TITLE, 3);
  return [koreanHanjaSection || koreanSection, rootHanjaSection].filter(Boolean).join("\n");
}

function cleanMarkup(text) {
  let value = String(text || "");

  value = value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, " ");
  value = value.replace(/<[^>]+>/g, " ");
  value = value.replace(/\{\{ko-hanja form of\|[^|}]+\|([^}]+)\}\}/g, "$1");
  value = value.replace(/\{\{lang\|[^|}]+\|([^}]+)\}\}/g, "$1");
  value = value.replace(/\{\{l\|[^|}]+\|([^}|]+)(?:\|([^}]+))?\}\}/g, (_, target, label) => label || target);
  value = value.replace(/\{\{q\|([^}]+)\}\}/g, "$1");
  value = value.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  value = value.replace(/\[\[([^\]]+)\]\]/g, "$1");
  value = value.replace(/'''/g, "");
  value = value.replace(/''/g, "");
  value = value.replace(/\{\{[^{}]*\}\}/g, " ");
  value = value.replace(/\[[^\]]+\]/g, " ");
  value = value.replace(/&nbsp;/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  value = value.replace(/^[*#:;\-\s]+/, "").trim();
  value = value.replace(/[.。]+$/g, "").trim();

  return value;
}

function shouldKeepMeaningPart(part) {
  return (
    part &&
    part !== "\uC131" &&
    !part.includes("\uD55C\uC790 \uD45C\uAE30") &&
    !part.includes("\uC57D\uC790") &&
    !part.includes("\uC131\uC528") &&
    !part.includes("\uBB38\uC5B4\uCCB4") &&
    !part.includes("\uD55C\uAD6D \uC778\uBA74\uC6A9 \uD55C\uC790\uC758 \uD558\uB098") &&
    !part.includes("\uB2E4\uC74C \uB2E8\uC5B4") &&
    !part.includes("\uC18D\uC790") &&
    !part.includes("\uAC04\uCCB4\uC790") &&
    !part.includes("\uB3D9\uC790") &&
    !part.includes("\uD615\uC131\uC790") &&
    !part.includes("\uC5B4\uAC04\uC758 \uD558\uB098") &&
    !part.includes("\uC811\uBBF8\uC0AC") &&
    !part.includes("\uB73B\uC744") &&
    !/[{}[\]|]/.test(part)
  );
}

function splitMeaning(text) {
  const cleaned = cleanMarkup(text)
    .replace(/^\d+\.\s*/, "")
    .replace(/^\(|\)$/g, "")
    .replace(/\s+\d+\.\s*/g, ", ")
    .trim();

  if (!cleaned) {
    return [];
  }

  return uniqueValues(
    cleaned
      .split(/\s*[,/;]\s*/)
      .map((part) => part.replace(/\(.*/, "").replace(/^[^)]*\)\s*/, "").trim())
      .filter((part) => !/^[()]/.test(part))
      .filter((part) => part.length <= 24)
      .filter(shouldKeepMeaningPart)
  );
}

function extractMeaningCandidates(raw) {
  const scoped = getScopedWikitext(raw);
  const candidates = [];
  let match = scoped.match(/\{\{ko-hanja\|([^|}]+)(?:\|[^}]*)?\}\}/);

  if (match) {
    candidates.push(...splitMeaning(match[1]));
  }

  match = scoped.match(/\{\{ko-hanja form of\|[^|}]+\|([^}]+)\}\}/);
  if (match) {
    candidates.push(...splitMeaning(match[1]));
  }

  match = scoped.match(new RegExp(`(?:^|\\n)\\{\\{[^{}\\n]*?(?:^|\\|)${HUN_LABEL}=([^|}]+)`, "m"));
  if (match) {
    candidates.push(...splitMeaning(match[1]));
  }

  match = scoped.match(new RegExp(`(?:^|\\n)\\*\\s*\\[\\[${HUN_LABEL}\\]\\]\\([^)]*\\):\\s*(.+?)(?:\\n|$)`, "m"));
  if (match) {
    candidates.push(...splitMeaning(match[1]));
  }

  match = scoped.match(/(?:^|\n)[*#]\s*'''1\.'''\s*(.+?)(?:\n|$)/m);
  if (match) {
    candidates.push(...splitMeaning(match[1]));
  }

  return uniqueValues(candidates);
}

function chooseMeaning(char, raw, existingMeaning = "") {
  const manualMeaning = manualMeaningMap[char];
  if (manualMeaning) {
    return manualMeaning;
  }

  const candidates = extractMeaningCandidates(raw);
  if (candidates.length) {
    return candidates.slice(0, 2).join(", ");
  }

  return "";
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWiktionaryBatch(chars, attempt = 0) {
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    formatversion: "2",
    format: "json",
    utf8: "1",
    origin: "*",
    titles: chars.join("|")
  });

  try {
    const response = await fetch(`${WIKTIONARY_API_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "JapanoteBot/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
  } catch (error) {
    if (attempt < RETRY_DELAYS_MS.length) {
      await delay(RETRY_DELAYS_MS[attempt]);
      return fetchWiktionaryBatch(chars, attempt + 1);
    }

    throw error;
  }
}

async function main() {
  const rows = JSON.parse(await readFile(DATA_PATH, "utf8"));
  const chars = rows.map((row) => row[0]).filter(Boolean);
  const pageContentByChar = new Map();

  // 위키낱말사전은 간헐적으로 연결이 끊겨서 배치 요청과 재시도를 같이 쓴다.
  for (let index = 0; index < chars.length; index += BATCH_SIZE) {
    const batch = chars.slice(index, index + BATCH_SIZE);
    const pages = await fetchWiktionaryBatch(batch);

    pages.forEach((page) => {
      const content = page?.revisions?.[0]?.slots?.main?.content || "";
      if (page?.title) {
        pageContentByChar.set(page.title, content);
      }
    });

    console.log(`Fetched ${Math.min(index + BATCH_SIZE, chars.length)} / ${chars.length}`);
  }

  const nextRows = rows.map((row) => {
    const [char, grade, reading, readingsDisplay, strokeCount, existingMeaning = ""] = Array.isArray(row) ? row : [];
    const meaning = chooseMeaning(char, pageContentByChar.get(char) || "", existingMeaning);
    return [char, grade, reading, readingsDisplay, strokeCount, meaning];
  });

  const missing = nextRows.filter((row) => !String(row[5] || "").trim()).map((row) => row[0]);
  await writeFile(DATA_PATH, `${JSON.stringify(nextRows, null, 2)}\n`, "utf8");

  console.log(`Updated ${nextRows.length} kanji rows.`);
  if (missing.length) {
    console.warn(`Missing meanings for ${missing.length} kanji: ${missing.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
