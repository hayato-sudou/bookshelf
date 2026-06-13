"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { searchBooks } from "../utils/googleBooksApi";
import { uploadBookCover, deleteBookCover } from "../utils/storageActions";
import { supabase } from "../utils/supabase";

// ─── カバーカラー定義 ──────────────────────────────────────────────────────────
// books.cover_color に保存するカラーコードと、それに対応する文字色・アクセント色
const COVER_COLORS = [
  { name: "琥珀",   bg: "#C4956A", text: "#2C1A0E", accent: "#E8C48A" },
  { name: "深緑",   bg: "#2D5A3D", text: "#E8F0E8", accent: "#6BAE8C" },
  { name: "紺碧",   bg: "#1A3A5C", text: "#E0EEFF", accent: "#7AB0E0" },
  { name: "桜",     bg: "#8C3A5A", text: "#FFE8F0", accent: "#D4849A" },
  { name: "墨",     bg: "#1E1E1E", text: "#E8E0D0", accent: "#888070" },
  { name: "藤",     bg: "#4A3A6A", text: "#F0E8FF", accent: "#A890D0" },
  { name: "朱",     bg: "#7A2A1A", text: "#FFE8E0", accent: "#D4806A" },
  { name: "苔",     bg: "#3A4A1A", text: "#F0F0E0", accent: "#90A860" },
];

// ─── ColorCover: thumbnail_url がない本に使うSVGカバー ────────────────────────
// cover_color（カラーコード）と title, author を受け取り、装飾付きカバーを生成する
export function ColorCover({ color, title, author, size = 80 }) {
  const c = COVER_COLORS.find(c => c.bg === color) || COVER_COLORS[0];
  const w = size;
  const h = size * 1.5; // 縦横比 2:3

  // タイトルを9文字で折り返し（SVGは自動改行非対応）
  const chars = (title || "").split("");
  const lines = [];
  let cur = "";
  for (const ch of chars) {
    cur += ch;
    if (cur.length >= 9) { lines.push(cur); cur = ""; }
  }
  if (cur) lines.push(cur);
  const displayLines = lines.slice(0, 3);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}
      style={{ borderRadius: 4, display: "block", flexShrink: 0 }}>
      <rect width={w} height={h} fill={c.bg} />
      {/* 装飾枠 */}
      <rect x={4} y={4} width={w-8} height={h-8}
        fill="none" stroke={c.accent} strokeWidth="0.8" opacity="0.5" />
      <rect x={7} y={7} width={w-14} height={h-14}
        fill="none" stroke={c.accent} strokeWidth="0.4" opacity="0.3" />
      {/* アクセント横線 */}
      <line x1={10} y1={h*0.62} x2={w-10} y2={h*0.62}
        stroke={c.accent} strokeWidth="0.6" opacity="0.6" />
      {/* タイトル */}
      {displayLines.map((line, i) => (
        <text key={i} x={w/2} y={h*0.28 + i*(size*0.145)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size*0.115} fontWeight="bold" fill={c.text}
          fontFamily="'Noto Serif JP', Georgia, serif" opacity="0.95">
          {line}
        </text>
      ))}
      {/* 著者名 */}
      {author && (
        <text x={w/2} y={h*0.78} textAnchor="middle" dominantBaseline="middle"
          fontSize={size*0.085} fill={c.text}
          fontFamily="'Noto Serif JP', Georgia, serif" opacity="0.6">
          {author.length > 10 ? author.slice(0,10)+"…" : author}
        </text>
      )}
    </svg>
  );
}

function mapVolume(volume) {
  const info = volume?.volumeInfo ?? {};
  return {
    id:           volume.id,
    title:        info.title ?? "タイトル不明",
    authors:      info.authors ?? [],
    thumbnail:    info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    publisher:    info.publisher ?? null,
    pageCount:    info.pageCount ?? null,
    category:     info.categories?.[0]?.split(" / ")[0] ?? "",
    description:  info.description ?? "",
    publishedDate: info.publishedDate ?? "",
  };
}

// ─── 検索結果の1件分カード ────────────────────────────────────────────────────
function SearchResultCard({ item, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10,
        cursor: "pointer",
        background: hovered ? "rgba(196,168,130,0.09)" : "transparent",
        border: `1px solid ${hovered ? "rgba(196,168,130,0.25)" : "transparent"}`,
        transition: "all 0.15s", marginBottom: 4,
      }}>
      {/* カバー */}
      <div style={{ width: 44, height: 66, flexShrink: 0, borderRadius: 4,
        overflow: "hidden", background: "#1A0F08",
        boxShadow: "2px 2px 8px rgba(0,0,0,0.4)" }}>
        {item.thumbnail
          ? <img src={item.thumbnail} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <ColorCover color={COVER_COLORS[0].bg} title={item.title} author="" size={44} />}
      </div>
      {/* テキスト情報 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E8D5B0", lineHeight: 1.35,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: "#8A7A6A", marginTop: 3 }}>
          {item.authors?.join(", ") || "著者不明"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
          {item.pageCount && (
            <span style={{ fontSize: 10, color: "#7A6A5A",
              background: "rgba(196,168,130,0.1)", borderRadius: 4, padding: "2px 6px" }}>
              {item.pageCount}P
            </span>
          )}
          {item.publishedDate && (
            <span style={{ fontSize: 10, color: "#7A6A5A",
              background: "rgba(196,168,130,0.1)", borderRadius: 4, padding: "2px 6px" }}>
              {item.publishedDate.slice(0,4)}年
            </span>
          )}
        </div>
      </div>
      {/* ＋ボタン */}
      <div style={{ alignSelf: "center", width: 28, height: 28, borderRadius: "50%",
        background: hovered ? "#6BAE8C" : "rgba(107,174,140,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, color: hovered ? "#0D0703" : "#6BAE8C",
        transition: "all 0.15s", flexShrink: 0, fontWeight: 700, lineHeight: 1 }}>
        +
      </div>
    </div>
  );
}

// ─── カラーピッカー ───────────────────────────────────────────────────────────
function ColorPicker({ selected, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {COVER_COLORS.map(c => (
        <button key={c.bg} onClick={() => onChange(c.bg)} title={c.name}
          style={{
            width: 28, height: 28, borderRadius: 6, background: c.bg, cursor: "pointer",
            border: selected === c.bg ? "2.5px solid #E8D5B0" : "2px solid transparent",
            transition: "transform 0.15s, border-color 0.15s",
            transform: selected === c.bg ? "scale(1.2)" : "scale(1)",
            boxShadow: selected === c.bg ? "0 0 8px rgba(232,213,176,0.4)" : "none",
          }} />
      ))}
    </div>
  );
}

// ─── スタイル定数 ─────────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: 11, color: "#6A5A4A", display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8,
};
const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(196,168,130,0.18)", borderRadius: 8,
  padding: "9px 12px", color: "#E8D5B0", fontSize: 13, outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s", boxSizing: "border-box",
};

// ─── メインモーダル ───────────────────────────────────────────────────────────
// props:
//   onClose: () => void
//   onAdd:   (bookData: object) => void
//     bookData は books テーブルの挿入データに対応
export default function AddBookModal({ onClose, onAdd }) {
  const [tab, setTab] = useState("search"); // "search" | "manual"

  // 検索タブ
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]     = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const searchInputRef             = useRef(null);
  const loaderRef                  = useRef(null);
  const INITIAL_COUNT              = 5;
  const MORE_COUNT                 = 15;

  // 手動登録タブ
  const [manual, setManual] = useState({
    title: "", author: "", pageCount: "", category: "",
    coverColor: COVER_COLORS[0].bg,
  });
  const [coverImageUrl,  setCoverImageUrl]  = useState(""); // アップロード済みURL
  const [coverImagePath, setCoverImagePath] = useState(""); // Storage上のpath（差し替え時の削除用）
  const [uploadLoading,  setUploadLoading]  = useState(false);
  const [uploadError,    setUploadError]    = useState("");
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    if (tab === "search") setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [tab]);

const handleFileChange = async (file) => {
  if (!file) return;

  // 前の画像があれば削除
  if (coverImagePath) {
    await deleteBookCover(coverImagePath);
  }

  setUploadLoading(true);
  setUploadError("");
  setCoverImageUrl("");
  setCoverImagePath("");

  // userIdはsupabaseセッションから取得
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setUploadError("ログインが必要です");
    setUploadLoading(false);
    return;
  }

  const result = await uploadBookCover(file, session.user.id);

  if (!result.ok) {
    setUploadError(result.error);
  } else {
    setCoverImageUrl(result.url);
    setCoverImagePath(result.path);
  }

  setUploadLoading(false);
};

// ── Google Books 検索（初回） ──
const handleSearch = async () => {
  if (!query.trim()) return;
  setLoading(true);
  setSearched(true);
  setResults([]);
  setStartIndex(0);
  setHasMore(false);
  try {
    const params = new URLSearchParams({
      q:          query.trim(),
      maxResults: String(INITIAL_COUNT),
      startIndex: "0",
    });
    const res   = await fetch(`/api/books/search?${params}`);
    const data  = await res.json();
    const items = (data.items ?? []).map(mapVolume);
    setResults(items);
    setHasMore(items.length >= INITIAL_COUNT);
    setStartIndex(INITIAL_COUNT);
  } catch {
    setResults([]);
  }
  setLoading(false);
};

// ── 追加ロード ──
const handleLoadMore = useCallback(async () => {
  if (loadingMore || !hasMore) return;
  setLoadingMore(true);
  try {
    const params = new URLSearchParams({
      q:          query.trim(),
      maxResults: String(MORE_COUNT),
      startIndex: String(startIndex),
    });
    const res   = await fetch(`/api/books/search?${params}`);
    const data  = await res.json();
    const items = (data.items ?? []).map(mapVolume);
    setResults(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      return [...prev, ...items.filter(i => !existingIds.has(i.id))];
    });
    setHasMore(false);
    setStartIndex(prev => prev + items.length);
  } catch {}
  setLoadingMore(false);
}, [loadingMore, hasMore, query, startIndex]);

// ── スクロール末尾検知 ──
useEffect(() => {
  const el = loaderRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) handleLoadMore(); },
    { threshold: 0.1 }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, [handleLoadMore]);

  // ── API結果から本を登録 ──
  const handleSelectApiBook = (item) => {
    // item は BookInfo 型。?.や?.[0]など防御コードがすべて不要に
    onAdd({
      source: "google_books",
      google_books_id: item.id,
      title: item.title,
      author: item.authors[0] ?? "",
      page_count: item.pageCount,
      thumbnail_url: item.thumbnail,
      cover_color: null,
      cover_style: item.thumbnail ? "image" : "color",
      category: item.category,
      description: item.description,
      publisher: item.publisher ?? "",
      published_date: item.publishedDate,
    });
    onClose();
  };

  // ── 手動登録 ──
  const handleManualSubmit = () => {
    if (!manual.title.trim()) { setManualError("タイトルは必須です"); return; }
    setManualError("");
    const hasCover = coverImageUrl !== "";
    onAdd({
      source: "manual",
      google_books_id: null,
      title: manual.title.trim(),
      author: manual.author.trim(),
      page_count: manual.pageCount ? parseInt(manual.pageCount) : null,
      thumbnail_url: hasCover ? coverImageUrl : null,
      cover_color: hasCover ? null : manual.coverColor,
      cover_style: hasCover ? "image" : "color",
      category: manual.category.trim(),
      description: "", publisher: "", published_date: "",
    });
    onClose();
  };

  return (
    <>
      {/* オーバーレイ */}
      <div onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>

        {/* モーダル本体 */}
        <div style={{
          background: "#130B05", border: "1px solid rgba(196,168,130,0.18)",
          borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "88vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(196,168,130,0.06)",
          animation: "modalIn 0.28s cubic-bezier(0.34,1.3,0.64,1)",
        }}>

          {/* ヘッダー */}
          <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E8D5B0", letterSpacing: -0.3 }}>
                📚 本を追加する
              </div>
              <button onClick={onClose} style={{
                background: "none", border: "none", color: "#6A5A4A",
                fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4,
                borderRadius: 6, transition: "color 0.15s",
              }}
                onMouseEnter={e => e.target.style.color = "#E8D5B0"}
                onMouseLeave={e => e.target.style.color = "#6A5A4A"}>×</button>
            </div>

            {/* タブ切り替え */}
            <div style={{
              display: "flex", gap: 2,
              background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3,
            }}>
              {[
                { key: "search", icon: "🔍", label: "キーワード検索" },
                { key: "manual", icon: "✏️", label: "手動で登録" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
                  cursor: "pointer",
                  background: tab === t.key ? "rgba(196,168,130,0.18)" : "transparent",
                  color: tab === t.key ? "#E8D5B0" : "#6A5A4A",
                  fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                  fontFamily: "inherit", transition: "all 0.18s", letterSpacing: 0.2,
                  boxShadow: tab === t.key ? "0 0 0 1px rgba(196,168,130,0.2)" : "none",
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(196,168,130,0.1)", margin: "16px 0 0", flexShrink: 0 }} />

          {/* ═══ 検索タブ ═══ */}
          {tab === "search" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minHeight: 0 }}>
              {/* 検索バー */}
              <div style={{ padding: "14px 20px", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input ref={searchInputRef} value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="タイトル / 著者:夏目漱石 / ISBN番号"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"} />
                  <button onClick={handleSearch} disabled={loading} style={{
                    padding: "10px 20px",
                    background: loading ? "#4A3A2A" : "#C4956A",
                    border: "none", borderRadius: 10, color: loading ? "#8A7A6A" : "#0D0703",
                    fontWeight: 700, fontSize: 13, cursor: loading ? "default" : "pointer",
                    fontFamily: "inherit", transition: "background 0.15s", whiteSpace: "nowrap",
                  }}>
                    {loading ? "検索中…" : "検索"}
                  </button>
                </div>
              </div>

{/* 結果エリア */}
<div style={{ overflowY: "auto", padding: "0 12px 16px", flex: 1, minHeight: 0 }}>

  {loading && (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 28, display: "inline-block",
        animation: "spin 1s linear infinite" }}>⟳</div>
      <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 8 }}>検索中...</div>
    </div>
  )}

  {!loading && results.map(item => (
    <SearchResultCard key={item.id} item={item} onSelect={handleSelectApiBook} />
  ))}

  {/* 無限スクロールのトリガー要素 */}
  {hasMore && (
    <div ref={loaderRef} style={{ padding: "16px 0", textAlign: "center" }}>
      {loadingMore
        ? <div style={{ fontSize: 12, color: "#6A5A4A" }}>さらに読み込み中...</div>
        : <div style={{ fontSize: 11, color: "#4A3A2A" }}>スクロールで続きを表示</div>
      }
    </div>
  )}

  {/* 終端メッセージ */}
  {!loading && !hasMore && results.length > 0 && (
    <div style={{ textAlign: "center", padding: "12px 0",
      fontSize: 11, color: "#4A3A2A",
      borderTop: "1px solid rgba(196,168,130,0.08)" }}>
      全 {results.length} 件を表示しました
    </div>
  )}

  {/* 検索結果なし */}
  {!loading && searched && results.length === 0 && (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
      <div style={{ fontSize: 13, color: "#6A5A4A", marginBottom: 12 }}>
        検索結果が見つかりませんでした
      </div>
      <button onClick={() => setTab("manual")} style={{
        fontSize: 12, color: "#C4956A", background: "none",
        border: "1px solid rgba(196,168,130,0.25)", borderRadius: 8,
        padding: "7px 16px", cursor: "pointer", fontFamily: "inherit",
      }}>
        ✏️ 手動で登録する →
      </button>
    </div>
  )}

  {/* 未検索 */}
  {!loading && !searched && (
    <div style={{ textAlign: "center", padding: "44px 0" }}>
      <div style={{ fontSize: 44, marginBottom: 10, opacity: 0.25 }}>🔍</div>
      <div style={{ fontSize: 12, color: "#4A3A2A" }}>
        キーワードを入力して検索してください
      </div>
    </div>
  )}
</div>
            </div>
          )}

          {/* ═══ 手動登録タブ ═══ */}
          {tab === "manual" && (
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "20px 24px" }}>

                {/* カバープレビュー + 基本情報 */}
                <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>

                  {/* プレビュー */}
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#5A4A3A", marginBottom: 8,
                      textTransform: "uppercase", letterSpacing: 1 }}>プレビュー</div>
                    <div style={{ boxShadow: "4px 6px 20px rgba(0,0,0,0.55)",
                      borderRadius: 6, display: "inline-block" }}>
                      {manual.thumbnailUrl
                        ? <img src={manual.thumbnailUrl} alt="cover preview"
                            style={{ width: 72, height: 108, objectFit: "cover",
                              borderRadius: 6, display: "block" }}
                            onError={e => e.target.style.display = "none"} />
                        : <ColorCover color={manual.coverColor}
                            title={manual.title || "タイトル"}
                            author={manual.author} size={72} />
                      }
                    </div>
                    {/* 登録元バッジ */}
                    <div style={{ marginTop: 8, fontSize: 9, color: "#5A4A3A",
                      background: "rgba(196,168,130,0.08)", borderRadius: 4,
                      padding: "3px 8px", display: "inline-block" }}>
                      手動登録
                    </div>
                  </div>

                  {/* タイトル・著者 */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>
                        タイトル <span style={{ color: "#E87070" }}>*</span>
                      </label>
                      <input value={manual.title}
                        onChange={e => { setManual(p => ({...p, title: e.target.value})); setManualError(""); }}
                        placeholder="本のタイトルを入力"
                        style={{ ...inputStyle,
                          borderColor: manualError ? "rgba(232,112,112,0.5)" : "rgba(196,168,130,0.18)" }}
                        onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
                        onBlur={e => e.target.style.borderColor =
                          manualError ? "rgba(232,112,112,0.5)" : "rgba(196,168,130,0.18)"} />
                      {manualError && (
                        <div style={{ fontSize: 11, color: "#E87070", marginTop: 4 }}>{manualError}</div>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>著者名</label>
                      <input value={manual.author}
                        onChange={e => setManual(p => ({...p, author: e.target.value}))}
                        placeholder="著者名を入力"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
                        onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"} />
                    </div>
                  </div>
                </div>

                {/* ページ数 / カテゴリ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>総ページ数（任意）</label>
                    <input type="number" min="1" value={manual.pageCount}
                      onChange={e => setManual(p => ({...p, pageCount: e.target.value}))}
                      placeholder="例: 320"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"} />
                  </div>
                  <div>
                    <label style={labelStyle}>カテゴリ（任意）</label>
                    <input value={manual.category}
                      onChange={e => setManual(p => ({...p, category: e.target.value}))}
                      placeholder="例: 小説、ビジネス"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"} />
                  </div>
                </div>

                {/* 表紙設定セクション */}
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(196,168,130,0.1)",
                  borderRadius: 12, padding: 16, marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, color: "#8A7A6A", marginBottom: 14,
                    textTransform: "uppercase", letterSpacing: 1 }}>表紙の設定</div>

                  {/* ドロップゾーン */}
                  <div
                    role="button"
                    aria-label="表紙画像をアップロード。クリックまたはファイルをドロップ"
                    tabIndex={0}
                    onClick={() => document.getElementById("cover-file-input").click()}
                    onKeyDown={e => e.key === "Enter" && document.getElementById("cover-file-input").click()}
                    onDragOver={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "rgba(196,168,130,0.6)";
                      e.currentTarget.style.background  = "rgba(196,168,130,0.08)";
                    }}
                    onDragLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(196,168,130,0.2)";
                      e.currentTarget.style.background  = "transparent";
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "rgba(196,168,130,0.2)";
                      e.currentTarget.style.background  = "transparent";
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    style={{
                      border: "1.5px dashed rgba(196,168,130,0.2)",
                      borderRadius: 10, padding: "20px 16px",
                      textAlign: "center", cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                      marginBottom: 14,
                    }}
                  >
                    <input
                      id="cover-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(file);
                        // 同じファイルを再選択できるようにリセット
                        e.target.value = "";
                      }}
                    />

                    {uploadLoading ? (
                      <div>
                        <div style={{ fontSize: 22, display: "inline-block",
                          animation: "spin 1s linear infinite", marginBottom: 6 }}>⟳</div>
                        <div style={{ fontSize: 12, color: "#6A5A4A" }}>アップロード中...</div>
                      </div>
                    ) : coverImageUrl ? (
                      <div>
                        <div style={{ fontSize: 12, color: "#6BAE8C", marginBottom: 4 }}>✅ アップロード済み</div>
                        <div style={{ fontSize: 11, color: "#4A3A2A" }}>クリックで画像を変更</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>🖼️</div>
                        <div style={{ fontSize: 12, color: "#6A5A4A", marginBottom: 4 }}>
                          クリックまたはドラッグ&ドロップ
                        </div>
                        <div style={{ fontSize: 10, color: "#4A3A2A" }}>
                          JPEG・PNG・WebP／5MB以下
                        </div>
                      </div>
                    )}
                  </div>

                  {/* エラー表示 */}
                  {uploadError && (
                    <div style={{
                      fontSize: 11, color: "#E87070", marginBottom: 12,
                      padding: "8px 12px", borderRadius: 8,
                      background: "rgba(232,112,112,0.08)",
                      border: "1px solid rgba(232,112,112,0.2)",
                    }}>
                      ❌ {uploadError}
                    </div>
                  )}

                  {/* URLがない場合のカラーピッカー */}
                  <div style={{ opacity: coverImageUrl ? 0.35 : 1, transition: "opacity 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(196,168,130,0.1)" }} />
                      <span style={{ fontSize: 10, color: "#4A3A2A" }}>画像がない場合はカラーカバーを使用</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(196,168,130,0.1)" }} />
                    </div>
                    <label style={{ ...labelStyle, marginBottom: 10 }}>カバーカラーを選択</label>
                    <ColorPicker selected={manual.coverColor}
                      onChange={color => setManual(p => ({...p, coverColor: color}))} />
                    <div style={{ fontSize: 10, color: "#5A4A3A", marginTop: 8 }}>
                      選択中：<span style={{ color: "#C4A882", fontWeight: 600 }}>
                        {COVER_COLORS.find(c => c.bg === manual.coverColor)?.name}
                      </span>
                      　— タイトルが自動でカバーに配置されます
                    </div>
                  </div>
                </div>

                {/* 登録ボタン */}
                <button onClick={handleManualSubmit} style={{
                  width: "100%", padding: "13px",
                  background: "#C4956A", border: "none", borderRadius: 12,
                  color: "#0D0703", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
                  transition: "background 0.15s, transform 0.1s",
                  boxShadow: "0 4px 16px rgba(196,149,106,0.3)",
                }}
                  onMouseEnter={e => e.target.style.background = "#D4A574"}
                  onMouseLeave={e => e.target.style.background = "#C4956A"}
                  onMouseDown={e => e.target.style.transform = "scale(0.98)"}
                  onMouseUp={e => e.target.style.transform = "scale(1)"}>
                  📖 本棚に追加する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
