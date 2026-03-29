#!/usr/bin/env python3
import argparse
import json
import time
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


DEFAULT_PART_DISPLAY = "\uc804\uccb4"
DEFAULT_PART_ENCODED = "%EC%A0%84%EC%B2%B4"
URL_TEMPLATE = (
    "https://ja.dict.naver.com/api/jako/getJLPTList"
    "?level={level}&part={part_encoded}&page={page}"
)
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://ja.dict.naver.com/",
    "User-Agent": "Mozilla/5.0",
}


def fetch_page(level: int, part_encoded: str, page: int, timeout: int, retries: int) -> dict[str, Any]:
    url = URL_TEMPLATE.format(level=level, part_encoded=part_encoded, page=page)
    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        try:
            request = Request(url, headers=HEADERS)
            with urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except Exception as exc:  # pragma: no cover - network retry path
            last_error = exc
            if attempt == retries:
                raise RuntimeError(
                    f"failed to fetch level={level} page={page} after {retries} attempts: {last_error}"
                ) from exc
            time.sleep(attempt)

    raise RuntimeError(f"unexpected fetch failure for level={level} page={page}: {last_error}")


def build_output_path(output_dir: Path, level: int) -> Path:
    return output_dir / f"jlpt_n{level}.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--level", type=int, required=True)
    parser.add_argument("--part-display", default=DEFAULT_PART_DISPLAY)
    parser.add_argument("--part-encoded", default=DEFAULT_PART_ENCODED)
    parser.add_argument("--output-dir", default="data")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--retries", type=int, default=5)
    parser.add_argument("--delay", type=float, default=0.0)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    first_page = fetch_page(args.level, args.part_encoded, 1, args.timeout, args.retries)
    total_pages = int(first_page["m_totalPage"])
    total_items_reported = int(first_page["m_total"])
    pages: list[dict[str, Any]] = [first_page]

    print(f"FETCHED=1/{total_pages}", flush=True)

    for page in range(2, total_pages + 1):
        pages.append(fetch_page(args.level, args.part_encoded, page, args.timeout, args.retries))
        if args.delay:
            time.sleep(args.delay)
        if page % 25 == 0 or page == total_pages:
            print(f"FETCHED={page}/{total_pages}", flush=True)

    all_items: list[dict[str, Any]] = []
    for payload in pages:
        all_items.extend(payload.get("m_items", []))

    seen_entry_ids: set[str | None] = set()
    unique_count = 0
    for item in all_items:
        entry_id = item.get("entry_id")
        if entry_id not in seen_entry_ids:
            seen_entry_ids.add(entry_id)
            unique_count += 1

    duplicate_count = len(all_items) - unique_count

    result = {
        "level": args.level,
        "part": args.part_display,
        "fetchedPages": total_pages,
        "pageRange": f"1-{total_pages}",
        "totalItemsReported": total_items_reported,
        "totalPagesReported": total_pages,
        "aggregatedItemCount": len(all_items),
        "uniqueEntryIdCount": unique_count,
        "duplicateCount": duplicate_count,
        "items": all_items,
    }

    output_path = build_output_path(output_dir, args.level)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OUT={output_path.resolve()}", flush=True)
    print(f"TOTAL_ITEMS_REPORTED={total_items_reported}", flush=True)
    print(f"TOTAL_PAGES_REPORTED={total_pages}", flush=True)
    print(f"AGGREGATED_ITEM_COUNT={len(all_items)}", flush=True)
    print(f"UNIQUE_ENTRY_ID_COUNT={unique_count}", flush=True)
    print(f"DUPLICATE_COUNT={duplicate_count}", flush=True)


if __name__ == "__main__":
    main()
