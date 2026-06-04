// utils/googleBooksApi.ts
// 直接 Google に叩かず /api/books/search 経由にすることで
// CORS 問題を回避し、APIキーをサーバー側に隠蔽する

export interface BookInfo {
  id: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  publisher: string | null;
  pageCount: number | null;
  category: string;
  description: string;
  publishedDate: string;
}

function mapVolume(volume: any): BookInfo {
  const info = volume?.volumeInfo ?? {};
  return {
    id:            volume.id,
    title:         info.title                                          ?? "タイトル不明",
    authors:       info.authors                                        ?? [],
    thumbnail:     info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    publisher:     info.publisher                                      ?? null,
    pageCount:     info.pageCount                                      ?? null,
    category:      info.categories?.[0]?.split(" / ")[0]              ?? "",
    description:   info.description                                    ?? "",
    publishedDate: info.publishedDate                                  ?? "",
  };
}

export async function searchBooks(
  keyword: string,
  maxResults = 10,
  langRestrict = ""
): Promise<BookInfo[]> {
  const trimmed = keyword.trim();
  if (!trimmed) throw new Error("キーワードを入力してください。");

  const params = new URLSearchParams({
    q: trimmed,
    maxResults: String(maxResults),
  });
  if (langRestrict) params.set("langRestrict", langRestrict);

  // 自プロジェクトの Route Handler を経由（CORS 回避 + APIキー隠蔽）
  const res = await fetch(`/api/books/search?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `エラー: ${res.status}`);
  }

  const data = await res.json();
  return (data.items ?? []).map(mapVolume);
}