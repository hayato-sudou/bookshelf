const GOOGLE_BOOKS_API_BASE = "https://www.googleapis.com/books/v1/volumes";

export interface BookInfo {
  id: string;             // Google Books の volume ID（既存コードで使用）
  title: string;
  authors: string[];
  thumbnail: string | null;
  publisher: string | null;
  pageCount: number | null;
  // AddBookModal が追加で使っているフィールド
  category: string;
  description: string;
  publishedDate: string;
}

function mapVolume(volume: any): BookInfo {
  const info = volume?.volumeInfo ?? {};
  return {
    id:            volume.id,
    title:         info.title          ?? "タイトル不明",
    authors:       info.authors        ?? [],
    thumbnail:     info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    publisher:     info.publisher      ?? null,
    pageCount:     info.pageCount      ?? null,
    category:      info.categories?.[0]?.split(" / ")[0] ?? "",
    description:   info.description    ?? "",
    publishedDate: info.publishedDate   ?? "",
  };
}

export async function searchBooks(
  keyword: string,
  maxResults = 10,
): Promise<BookInfo[]> {
  const trimmed = keyword.trim();
  if (!trimmed) throw new Error("キーワードを入力してください。");

  const params = new URLSearchParams({
    q: trimmed,
    maxResults: String(Math.min(Math.max(1, maxResults), 40)),
  });

  const res = await fetch(`${GOOGLE_BOOKS_API_BASE}?${params}`);
  if (!res.ok) throw new Error(`APIエラー: ${res.status} ${res.statusText}`);

  const data = await res.json();
  return (data.items ?? []).map(mapVolume);
}