import { NextRequest, NextResponse } from "next/server";

// GET /api/books/search?q=キーワード&maxResults=10&langRestrict=ja
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q            = searchParams.get("q");
  const maxResults   = searchParams.get("maxResults") ?? "10";
  const langRestrict = searchParams.get("langRestrict") ?? "";

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "クエリパラメータ q が必要です。" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    q,
    maxResults: String(Math.min(Math.max(1, Number(maxResults)), 40)),
  });
  if (langRestrict) params.set("langRestrict", langRestrict);

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) params.set("key", apiKey);

  try {
    // ※ next: { revalidate } を削除 — Next.js 16 では fetch オプションとして非対応
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