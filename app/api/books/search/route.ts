import { NextRequest, NextResponse } from "next/server";

// ══════════════════════════════════════════════════════
// § 1. 正規化ユーティリティ
// ══════════════════════════════════════════════════════

/** 全角英数記号 → 半角 */
function toHalfWidth(str: string): string {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    .replace(/　/g, " ")   // 全角スペース → 半角
    .replace(/．/g, ".")   // 全角ピリオド → 半角
    .replace(/・/g, "·");  // 中黒 → 正規中点（後で除去）
}

/** 検索ノイズ除去：中黒・中点・スペースを除去して連結 */
function normalize(str: string): string {
  return toHalfWidth(str)
    .replace(/[·・\s\-\.]/g, "") // 中黒・スペース・ハイフン・ピリオド除去
    .toLowerCase();
}

/** 著者名プレフィックスを除去して名前だけ取り出す */
function stripAuthorPrefix(str: string): string {
  return str.replace(/^(著者?|作者?|訳者?)[：:]\s*/, "").trim();
}

// ══════════════════════════════════════════════════════
// § 2. カタカナ ↔ ローマ字 対応辞書
//    （よく検索される外国人著者名のみ。必要に応じて追加）
// ══════════════════════════════════════════════════════

const KATAKANA_TO_ROMAN: [RegExp, string][] = [
  // ── ホラー・ミステリ ──
  [/スティーブン?キング/,          "Stephen King"],
  [/アガサ?クリスティ/,            "Agatha Christie"],
  [/アーサー?コナン?ドイル/,       "Arthur Conan Doyle"],
  // ── SF・ファンタジー ──
  [/J\.?K\.?ローリング/i,          "J.K. Rowling"],
  [/ジョージ?R\.?R\.?マーティン/i, "George R.R. Martin"],
  [/アシモフ|アイザック?アシモフ/,  "Isaac Asimov"],
  // ── 文学 ──
  [/ドストエフスキ[ーイ]/,          "Dostoevsky"],
  [/トルストイ/,                   "Tolstoy"],
  [/カフカ/,                       "Kafka"],
  [/ヘミングウェイ/,               "Hemingway"],
  [/ガルシア?マルケス/,            "Garcia Marquez"],
  // ── ビジネス・自己啓発 ──
  [/ドラッカー/,                   "Drucker"],
  [/マルコム?グラッドウェル/,      "Malcolm Gladwell"],
  // ── 現代小説 ──
  [/ダン?ブラウン/,                "Dan Brown"],
  [/パウロ?コエーリョ/,            "Paulo Coelho"],
];

/** カタカナ著者名をローマ字に変換（一致しなければnull） */
function katakanaToRoman(str: string): string | null {
  const normalized = str.replace(/[·・\s]/g, ""); // 中黒・スペース除去してから照合
  for (const [pattern, roman] of KATAKANA_TO_ROMAN) {
    if (pattern.test(normalized)) return roman;
  }
  return null;
}

// ══════════════════════════════════════════════════════
// § 3. クエリ組み立て
// ══════════════════════════════════════════════════════

function buildQuery(raw: string): string {
  const input = raw.trim();

  // ── ISBN判定: ハイフン除去後に10桁 or 13桁の数字 ──
  const digitsOnly = input.replace(/-/g, "");
  if (/^\d{10}$|^\d{13}$/.test(digitsOnly)) {
    return `isbn:${digitsOnly}`;
  }

  // ── 著者指定プレフィックス判定 ──
  if (/^(著者?|作者?|訳者?)[：:]/.test(input)) {
    const name = stripAuthorPrefix(input);
    const roman = katakanaToRoman(name);
    // ローマ字対応あり → カナ + ローマ字 両方で検索
    return roman
      ? `inauthor:${name}+OR+inauthor:"${roman}"`
      : `inauthor:${name}`;
  }

  // ── タイトル検索（デフォルト）──
  // 半角化して中黒・スペースを除去した「正規化済み文字列」でも検索
  const normalizedInput = toHalfWidth(input)
    .replace(/[·・]/g, " ") // 中黒はスペースに置換（Google側の分かち合いに対応）
    .replace(/\s+/g, " ")
    .trim();

  const roman = katakanaToRoman(input);

  // ローマ字対応あり → カナタイトル + ローマ字タイトル を OR
  if (roman) {
    return `intitle:${normalizedInput}+OR+intitle:"${roman}"`;
  }

  // 中黒・スペースありとなし、両方で OR 検索
  const noSeparator = input.replace(/[·・\s]/g, ""); // 区切りなし版
  if (noSeparator !== input) {
    return `intitle:${normalizedInput}+OR+intitle:${noSeparator}`;
  }

  return `intitle:${normalizedInput}`;
}

// ══════════════════════════════════════════════════════
// § 4. Route Handler
// ══════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q          = searchParams.get("q");
  const maxResults = searchParams.get("maxResults") ?? "10";

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "クエリパラメータ q が必要です。" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    q:            buildQuery(q),
    maxResults:   String(Math.min(Math.max(1, Number(maxResults)), 40)),
    langRestrict: "ja",
    orderBy:      "relevance",
  });

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) params.set("key", apiKey);

  // デバッグ用（開発環境のみ）
  if (process.env.NODE_ENV === "development") {
    console.log("[books/search] query:", params.get("q"));
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`
    );
    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[books/search] Google API error:", res.status, errorBody);
      return NextResponse.json(
        { error: `Google Books API エラー: ${res.status}`, detail: errorBody },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[books/search] fetch error:", err);
    return NextResponse.json(
      { error: "ネットワークエラーが発生しました。" },
      { status: 500 }
    );
  }
}