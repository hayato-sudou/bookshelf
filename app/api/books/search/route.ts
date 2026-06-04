import { NextRequest, NextResponse } from "next/server";

// ══════════════════════════════════════════════════════
// § 1. 正規化ユーティリティ
// ══════════════════════════════════════════════════════

function toHalfWidth(str: string): string {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    .replace(/　/g, " ")
    .replace(/．/g, ".")
    .replace(/・/g, "·");
}

function stripAuthorPrefix(str: string): string {
  return str.replace(/^(著者?|作者?|訳者?)[：:]\s*/, "").trim();
}

// ══════════════════════════════════════════════════════
// § 2. カタカナ → ローマ字辞書
// ══════════════════════════════════════════════════════

const KATAKANA_TO_ROMAN: [RegExp, string][] = [
  [/スティーブン?キング/,           "Stephen King"],
  [/アガサ?クリスティ/,             "Agatha Christie"],
  [/アーサー?コナン?ドイル/,        "Arthur Conan Doyle"],
  [/J\.?K\.?ローリング/i,           "J.K. Rowling"],
  [/ジョージ?R\.?R\.?マーティン/i,  "George R.R. Martin"],
  [/アシモフ|アイザック?アシモフ/,   "Isaac Asimov"],
  [/ドストエフスキ[ーイ]/,           "Dostoevsky"],
  [/トルストイ/,                    "Tolstoy"],
  [/カフカ/,                        "Kafka"],
  [/ヘミングウェイ/,                "Hemingway"],
  [/ガルシア?マルケス/,             "Garcia Marquez"],
  [/ドラッカー/,                    "Drucker"],
  [/マルコム?グラッドウェル/,       "Malcolm Gladwell"],
  [/ダン?ブラウン/,                 "Dan Brown"],
  [/パウロ?コエーリョ/,             "Paulo Coelho"],
];

function katakanaToRoman(str: string): string | null {
  const normalized = str.replace(/[·・\s]/g, "");
  for (const [pattern, roman] of KATAKANA_TO_ROMAN) {
    if (pattern.test(normalized)) return roman;
  }
  return null;
}

// ══════════════════════════════════════════════════════
// § 3. 「タイトル 著者」複合パターン判定
//    スペース区切りの2トークンで、片方が著者辞書にヒットする場合
// ══════════════════════════════════════════════════════

function tryParseCompound(input: string): string | null {
  // 半角・全角スペースで最大2分割
  const parts = input.split(/[\s　]+/);
  if (parts.length < 2) return null;

  // 先頭トークンが著者名の場合：著者 タイトル
  const firstRoman = katakanaToRoman(parts[0]);
  if (firstRoman) {
    const titlePart = parts.slice(1).join(" ");
    return `intitle:${titlePart}+inauthor:"${firstRoman}"`;
  }

  // 末尾トークンが著者名の場合：タイトル 著者
  const lastRoman = katakanaToRoman(parts[parts.length - 1]);
  if (lastRoman) {
    const titlePart = parts.slice(0, -1).join(" ");
    return `intitle:${titlePart}+inauthor:"${lastRoman}"`;
  }

  // 日本語著者名パターン（姓2文字+名2文字、スペース区切り）
  // 例: "東野 圭吾 白夜行" → inauthor:東野圭吾 intitle:白夜行
  if (parts.length >= 2 && /^[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{1,4}$/.test(parts[0])) {
    // 先頭2トークンを著者名候補とし、残りをタイトルとして試みる
    const authorCandidate = parts.slice(0, 2).join("");
    const titleCandidate  = parts.slice(2).join(" ");
    if (titleCandidate) {
      return `intitle:${titleCandidate}+inauthor:${authorCandidate}`;
    }
    // タイトルなし → 著者検索のみ
    return `inauthor:${authorCandidate}`;
  }

  return null;
}

// ══════════════════════════════════════════════════════
// § 4. メインのクエリ組み立て
// ══════════════════════════════════════════════════════

function buildQuery(raw: string): string {
  const input = raw.trim();

  // ISBN
  const digitsOnly = input.replace(/-/g, "");
  if (/^\d{10}$|^\d{13}$/.test(digitsOnly)) {
    return `isbn:${digitsOnly}`;
  }

  // 著者指定プレフィックス
  if (/^(著者?|作者?|訳者?)[：:]/.test(input)) {
    const name  = stripAuthorPrefix(input);
    const roman = katakanaToRoman(name);
    return roman
      ? `inauthor:${name}+OR+inauthor:"${roman}"`
      : `inauthor:${name}`;
  }

  // タイトル＋著者の複合パターン
  const compound = tryParseCompound(input);
  if (compound) return compound;

  // タイトル検索（デフォルト）
  const normalized = toHalfWidth(input)
    .replace(/[·・]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const roman       = katakanaToRoman(input);
  const noSeparator = input.replace(/[·・\s]/g, "");

  if (roman) {
    return `intitle:${normalized}+OR+intitle:"${roman}"`;
  }
  if (noSeparator !== input) {
    return `intitle:${normalized}+OR+intitle:${noSeparator}`;
  }
  return `intitle:${normalized}`;
}

// ══════════════════════════════════════════════════════
// § 5. Route Handler
// ══════════════════════════════════════════════════════

async function fetchVolumes(
  q: string,
  maxResults: number,
  startIndex: number,
  withLangRestrict: boolean
): Promise<any[]> {
  const params = new URLSearchParams({
    q,
    maxResults:  String(maxResults),
    startIndex:  String(startIndex),
    orderBy:     "relevance",
  });
  if (withLangRestrict) params.set("langRestrict", "ja");

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q          = searchParams.get("q");
  const maxResults = Math.min(Number(searchParams.get("maxResults") ?? "5"), 40);
  const startIndex = Number(searchParams.get("startIndex") ?? "0");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "クエリパラメータ q が必要です。" },
      { status: 400 }
    );
  }

  const query = buildQuery(q);

  if (process.env.NODE_ENV === "development") {
    console.log("[books/search] query:", query, "startIndex:", startIndex, "maxResults:", maxResults);
  }

  try {
    // 邦書優先で取得
    let items = await fetchVolumes(query, maxResults, startIndex, true);

    // 追加ロード時（startIndex > 0）かつ件数不足 → langRestrict なしで補完
    if (startIndex > 0 && items.length < maxResults) {
      const supplement = await fetchVolumes(
        query,
        maxResults - items.length,
        startIndex + items.length,
        false
      );
      // 重複除去（id基準）
      const existingIds = new Set(items.map((i: any) => i.id));
      items = [...items, ...supplement.filter((i: any) => !existingIds.has(i.id))];
    }

    return NextResponse.json({ items });

  } catch (err) {
    console.error("[books/search] fetch error:", err);
    return NextResponse.json(
      { error: "ネットワークエラーが発生しました。" },
      { status: 500 }
    );
  }
}