import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 型定義
export type Book = {
  id: string;
  google_books_id: string | null;
  source: "google_books" | "manual";
  title: string;
  author: string;
  page_count: number | null;
  thumbnail_url: string | null;
  cover_color: string | null;
  cover_style: "image" | "color";
  category: string;
};

export type UserBook = {
  id: string;
  user_id: string;
  book_id: string;
  status: "unread" | "reading" | "completed";
  current_page: number;
  max_page_reached: number;  // 追加
  rating: number | null;
  notes: string | null;
  tags: string[];
  book: Book;
};