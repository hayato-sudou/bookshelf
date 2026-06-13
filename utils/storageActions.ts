import { supabase } from "./supabase";

const BUCKET = "book-covers";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

export async function uploadBookCover(
  file: File,
  userId: string
): Promise<UploadResult> {
  // バリデーション
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "JPEG・PNG・WebP形式のみアップロードできます" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "ファイルサイズは5MB以下にしてください" };
  }

  // ファイル名：衝突を避けるためuuid的なランダム文字列を使用
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) {
    return { ok: false, error: "アップロードに失敗しました: " + error.message };
  }

  // signed URLを取得（private bucket のため）
  const { data, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1年

  if (urlError || !data) {
    return { ok: false, error: "URL取得に失敗しました" };
  }

  return { ok: true, url: data.signedUrl, path };
}

export async function deleteBookCover(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}