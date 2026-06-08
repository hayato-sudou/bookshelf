import { supabase } from "./supabase";

// ── 本棚を取得 ──────────────────────────────────────────────
export async function fetchUserBooks(userId: string) {
  const { data, error } = await supabase
    .from("user_books")
    .select(`*, book:books(*)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ── 本棚名を更新 ────────────────────────────────────────────
export async function updateShelfName(userId: string, name: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ shelf_name: name.trim() || "わたしの本棚" })
    .eq("id", userId);

  if (error) throw error;
}

// ── 本を追加 ────────────────────────────────────────────────
export async function addBook(userId: string, bookData: {
  source: string;
  google_books_id: string | null;
  title: string;
  author: string;
  page_count: number | null;
  thumbnail_url: string | null;
  cover_color: string | null;
  cover_style: string;
  category: string;
  description: string;
  publisher: string;
  published_date: string;
}) {
  let bookId: string;

  if (bookData.google_books_id) {
    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", bookData.google_books_id)
      .single();

    if (existing) {
      bookId = existing.id;
    } else {
      const { data, error } = await supabase
        .from("books")
        .insert(bookData)
        .select("id")
        .single();
      if (error) throw error;
      bookId = data.id;
    }
  } else {
    const { data, error } = await supabase
      .from("books")
      .insert(bookData)
      .select("id")
      .single();
    if (error) throw error;
    bookId = data.id;
  }

  const { error } = await supabase
    .from("user_books")
    .insert({ user_id: userId, book_id: bookId, status: "unread", tags: [] });

  if (error) throw error;
}

// ── 読書進捗・メモ・評価・タグを更新 ──────────────────────────
export async function updateUserBook(userBookId: string, updates: {
  current_page?: number;
  status?: "unread" | "reading" | "completed";
  rating?: number | null;
  notes?: string;
  tags?: string[];
}) {
  if (updates.current_page !== undefined) {
    if (updates.current_page > 0 && !updates.status) {
      updates.status = "reading";
    }
  }

  if (updates.rating === 0) {
    updates.rating = null;
  }

  const { error } = await supabase
    .from("user_books")
    .update(updates)
    .eq("id", userBookId);

  if (error) throw error;
}

// ── 読書ログを記録してコインを加算 ──────────────────────────
export async function recordReadingProgress(
  userBookId: string,
  userId: string,
  newPage: number  // current_page の新しい値を受け取る
): Promise<number> {
  // max_page_reached を取得
  const { data, error: fetchError } = await supabase
    .from("user_books")
    .select("max_page_reached")
    .eq("id", userBookId)
    .single();

  if (fetchError) throw fetchError;

  const maxReached = data.max_page_reached ?? 0;

  // 新規到達ページ分だけコイン対象
  const newPages = Math.max(0, newPage - maxReached);

  // max_page_reached を更新（戻しても上書きしない）
  if (newPage > maxReached) {
    const { error: updateError } = await supabase
      .from("user_books")
      .update({ max_page_reached: newPage })
      .eq("id", userBookId);

    if (updateError) throw updateError;
  }

  // ログ記録（newPages > 0 の時のみ）
  if (newPages > 0) {
    await supabase
      .from("reading_logs")
      .insert({ user_book_id: userBookId, pages_read: newPages });
  }

  const coinsEarned = Math.floor(newPages / 10);
  if (coinsEarned > 0) {
    await supabase.rpc("increment_coins", {
      user_id: userId,
      amount: coinsEarned,
    });
  }

  return coinsEarned;
}

// ── 本を削除（user_booksレコードの物理削除）──────────────────
export async function deleteUserBook(userBookId: string) {
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", userBookId);

  if (error) throw error;
}

