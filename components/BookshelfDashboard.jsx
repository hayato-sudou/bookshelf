"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import {
  fetchUserBooks,
  addBook,
  updateUserBook,
  updateShelfName,
  recordReadingProgress,
  deleteUserBook,
} from "@/utils/bookActions";
import AddBookModal, { ColorCover } from "@/components/AddBookModal";

const STATUS_CONFIG = {
  all:       { label: "すべて",  color: "#C4A882" },
  reading:   { label: "読書中",  color: "#E8934A" },
  completed: { label: "読了",    color: "#6BAE8C" },
  unread:    { label: "未読",    color: "#7A9EC4" },
};

// ─── Pet SVG ──────────────────────────────────────────────────────────────────
function PetSprite({ happiness }) {
  const eyeY = happiness > 60 ? 38 : 40;
  const mouthPath = happiness > 60 ? "M 41 52 Q 50 58 59 52" : "M 41 55 Q 50 50 59 55";
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <ellipse cx="50" cy="65" rx="28" ry="24" fill="#C4956A" />
      <circle cx="50" cy="42" r="26" fill="#D4A574" />
      <ellipse cx="28" cy="22" rx="9" ry="13" fill="#C4956A" />
      <ellipse cx="72" cy="22" rx="9" ry="13" fill="#C4956A" />
      <ellipse cx="28" cy="22" rx="5" ry="9" fill="#E8B89A" />
      <ellipse cx="72" cy="22" rx="5" ry="9" fill="#E8B89A" />
      <circle cx="40" cy={eyeY} r="5.5" fill="#2C1A0E" />
      <circle cx="60" cy={eyeY} r="5.5" fill="#2C1A0E" />
      <circle cx="42" cy={eyeY - 1.5} r="2" fill="white" />
      <circle cx="62" cy={eyeY - 1.5} r="2" fill="white" />
      <ellipse cx="50" cy="48" rx="4" ry="2.5" fill="#A0624A" />
      <path d={mouthPath} stroke="#A0624A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {happiness > 60 && (
        <>
          <ellipse cx="33" cy="50" rx="7" ry="4" fill="#E87070" opacity="0.35" />
          <ellipse cx="67" cy="50" rx="7" ry="4" fill="#E87070" opacity="0.35" />
        </>
      )}
      <path d="M 74 72 Q 95 60 90 80 Q 82 95 72 82" fill="#C4956A" />
      <rect x="34" y="14" width="32" height="5" rx="2" fill="#5C4030" />
      <rect x="38" y="4" width="24" height="12" rx="3" fill="#7A5540" />
    </svg>
  );
}

// ─── Coin Burst ───────────────────────────────────────────────────────────────
function CoinBurst({ active, onDone }) {
  useEffect(() => {
    if (active) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [active, onDone]);
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{
          position: "absolute", left: `${30 + i * 8}%`, top: "40%",
          fontSize: 20, animation: `coinFly${i % 3} 0.8s ease-out forwards`,
          animationDelay: `${i * 0.06}s`,
        }}>🪙</div>
      ))}
    </div>
  );
}

// ─── ShelfNameEditor ──────────────────────────────────────────────────────────
function ShelfNameEditor({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(name);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const commit = () => {
    const trimmed = draft.trim() || "わたしの本棚";
    setEditing(false);
    if (trimmed !== name) onSave(trimmed);
    else setDraft(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  commit();
    if (e.key === "Escape") { setEditing(false); setDraft(name); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        maxLength={30}
        aria-label="本棚名を編集"
        style={{
          fontSize: 22, fontWeight: 700, color: "#E8D5B0",
          background: "rgba(196,168,130,0.1)",
          border: "1px solid rgba(196,168,130,0.4)",
          borderRadius: 6, padding: "2px 10px",
          outline: "none", fontFamily: "inherit",
          letterSpacing: -0.5, width: 260,
        }}
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      title="クリックして名前を変更"
      aria-label={`本棚名: ${name}。クリックして変更`}
      style={{
        fontSize: 22, fontWeight: 700, color: "#E8D5B0",
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "inherit", letterSpacing: -0.5, padding: "2px 4px",
        borderRadius: 6, transition: "background 0.15s",
        display: "flex", alignItems: "center", gap: 6,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(196,168,130,0.1)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      {name}
      <span style={{ fontSize: 13, color: "#4A3A2A", fontWeight: 400 }} aria-hidden="true">✏️</span>
    </button>
  );
}

// ─── CategoryFilter ───────────────────────────────────────────────────────────
function CategoryFilter({ books, selectedCategory, onChange }) {
  const allCategories = [...new Set(
    books.flatMap(b => b.tags ?? []).filter(Boolean)
  )].sort();

  if (allCategories.length === 0) return null;

  return (
    <div style={{
      paddingTop: 10,
      borderTop: "1px solid rgba(196,168,130,0.08)",
    }}>
      {/* ラベル行 */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10, color: "#4A3A2A",
          textTransform: "uppercase", letterSpacing: 0.8,
        }}>
          カテゴリで絞り込む
        </span>
        {selectedCategory && (
          <button
            onClick={() => onChange(null)}
            style={{
              fontSize: 10, color: "#8A7A6A", background: "none",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              padding: "2px 6px", borderRadius: 4,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#E8D5B0"}
            onMouseLeave={e => e.currentTarget.style.color = "#8A7A6A"}
          >
            ✕ 絞り込み解除
          </button>
        )}
      </div>

      {/* カテゴリボタン一覧 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {allCategories.map(cat => {
          const active = selectedCategory === cat;
          // このカテゴリが付いている本の冊数
          const count = books.filter(b => (b.tags ?? []).includes(cat)).length;
          return (
            <button
              key={cat}
              onClick={() => onChange(active ? null : cat)}
              aria-pressed={active}
              title={`${count}冊に付与`}
              style={{
                padding: "4px 12px", borderRadius: 20, border: "1px solid",
                borderColor: active ? "#A890D0" : "rgba(196,168,130,0.15)",
                background: active ? "rgba(168,144,208,0.18)" : "transparent",
                color: active ? "#C8B0F0" : "#6A5A4A",
                fontSize: 11, fontWeight: active ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {cat}
              <span style={{
                fontSize: 9,
                color: active ? "#A890D0" : "#4A3A2A",
                background: active ? "rgba(168,144,208,0.25)" : "rgba(196,168,130,0.1)",
                borderRadius: 8, padding: "1px 5px",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* アクティブ時の説明文 */}
      {selectedCategory && (
        <div style={{ fontSize: 10, color: "#4A3A2A", marginTop: 8 }}>
          「{selectedCategory}」を含む本のみ表示中
        </div>
      )}
    </div>
  );
}

// ─── CategoryEditor ───────────────────────────────────────────────────────────
function CategoryEditor({ tags, allCategories, onChange }) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  const add = (cat) => {
    const trimmed = cat.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInputVal("");
  };

  const remove = (cat) => onChange(tags.filter(t => t !== cat));
  const [petBlink, setPetBlink] = useState(false);
  const [petWag,   setPetWag]   = useState(false);

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      add(inputVal);
    }
    if (e.key === "Backspace" && inputVal === "" && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  };

  const suggestions = allCategories.filter(
    c => !tags.includes(c) && c.toLowerCase().includes(inputVal.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 20,
            background: "rgba(168,144,208,0.15)",
            border: "1px solid rgba(168,144,208,0.3)",
            color: "#C8B0F0", fontSize: 11,
          }}>
            {tag}
            <button
              onClick={() => remove(tag)}
              aria-label={`${tag}を削除`}
              style={{
                background: "none", border: "none", color: "#8A70B0",
                cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1,
              }}
            >×</button>
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="カテゴリを入力してEnter"
        aria-label="カテゴリを追加"
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(196,168,130,0.18)", borderRadius: 8,
          padding: "8px 12px", color: "#E8D5B0", fontSize: 12,
          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
        onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"}
      />

      {inputVal && suggestions.length > 0 && (
        <div style={{
          marginTop: 4, background: "#1A0F08",
          border: "1px solid rgba(196,168,130,0.2)",
          borderRadius: 8, overflow: "hidden",
        }}>
          {suggestions.slice(0, 5).map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); add(s); setInputVal(""); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "7px 12px", background: "none", border: "none",
                color: "#C4A882", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(196,168,130,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#4A3A2A", marginTop: 5 }}>
        Enterまたはカンマで追加・Backspaceで末尾削除
      </div>
    </div>
  );
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({ book, onClick }) {
  const [hovered, setHovered] = useState(false);
  const pageCount   = book.book?.page_count || 0;
  const currentPage = book.current_page || 0;
  const progress    = pageCount > 0 ? (currentPage / pageCount) * 100 : 0;
  const statusColor = { reading: "#E8934A", completed: "#6BAE8C", unread: "#7A9EC4" }[book.status];

  return (
    <div
      onClick={() => onClick(book)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", cursor: "pointer",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
        transform: hovered
          ? "translateY(-10px) rotateY(-5deg) scale(1.04)"
          : "translateY(0) rotateY(0deg) scale(1)",
        transformStyle: "preserve-3d", borderRadius: 6,
        boxShadow: hovered
          ? "8px 16px 32px rgba(0,0,0,0.6), 2px 4px 8px rgba(0,0,0,0.4)"
          : "4px 8px 16px rgba(0,0,0,0.45), 1px 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "2/3", overflow: "hidden", borderRadius: 6, background: "#2C1A0E" }}>
        {book.book?.thumbnail_url
          ? <img src={book.book.thumbnail_url} alt={book.book?.title}
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                filter: book.status === "unread" ? "saturate(0.4) brightness(0.7)" : "none",
                transition: "filter 0.3s",
              }}
              onError={e => { e.target.style.display = "none"; }} />
          : <ColorCover
              color={book.book?.cover_color || "#C4956A"}
              title={book.book?.title || ""}
              author={book.book?.author || ""}
              size={88}
            />
        }
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
          background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent)",
          borderRadius: "6px 0 0 6px",
        }} />
        <div style={{
          position: "absolute", top: 6, right: 6, width: 8, height: 8,
          borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}`,
        }} />
        {book.status === "reading" && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
            background: "rgba(0,0,0,0.5)", borderRadius: "0 0 6px 6px",
          }}>
            <div style={{
              height: "100%", width: `${progress}%`, background: "#E8934A",
              borderRadius: "0 0 0 6px", transition: "width 0.5s ease",
            }} />
          </div>
        )}
      </div>
      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(20,12,6,0.96)", border: "1px solid rgba(196,168,130,0.25)",
          borderRadius: 8, padding: "8px 10px", width: 140, zIndex: 20, backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#E8D5B0", lineHeight: 1.3, marginBottom: 3 }}>
            {book.book?.title}
          </div>
          <div style={{ fontSize: 10, color: "#8A7A6A" }}>{book.book?.author}</div>
          {book.status === "reading" && (
            <div style={{ fontSize: 10, color: "#E8934A", marginTop: 4 }}>
              {currentPage} / {pageCount} ページ
            </div>
          )}
          {book.rating > 0 && (
            <div style={{ fontSize: 11, marginTop: 3 }}>
              {"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}
            </div>
          )}
          {(book.tags ?? []).length > 0 && (
            <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 3 }}>
              {book.tags.slice(0, 3).map(t => (
                <span key={t} style={{
                  fontSize: 9, padding: "1px 6px", borderRadius: 10,
                  background: "rgba(168,144,208,0.2)", color: "#C8B0F0",
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Book Detail Panel ────────────────────────────────────────────────────────
function BookDetailPanel({ book, allCategories, onClose, onUpdate, onDelete }) {
  const [page,          setPage]          = useState(book.current_page || 0);
  const [note,          setNote]          = useState(book.notes || "");
  const [rating,        setRating]        = useState(book.rating || 0);
  const [tags,          setTags]          = useState(book.tags ?? []);
  const [burst,         setBurst]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const pageCount = book.book?.page_count || 0;

  // book.idが変わるたびに全stateをリセット
  useEffect(() => {
    console.log("useEffect発火 book.id:", book.id, "book.tags:", book.tags); // ← 追加
    setPage(book.current_page || 0);
    setNote(book.notes || "");
    setRating(book.rating || 0);
    setTags(book.tags ?? []);
    setConfirmDelete(false);
  }, [book.id]);

  const handleSave = () => {
    console.log("保存するtags:", tags);        // ← 追加
    console.log("book.tags:", book.tags);      // ← 追加
    const added = Math.max(0, page - (book.current_page || 0));
    if (added > 0) setBurst(true);
    onUpdate({ ...book, current_page: page, notes: note, rating, tags });
  };

  const handleDeleteClick   = () => setConfirmDelete(true);
  const handleDeleteCancel  = () => setConfirmDelete(false);
  const handleDeleteConfirm = () => onDelete(book.id);

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 340,
      background: "#140C06", borderLeft: "1px solid rgba(196,168,130,0.15)",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", zIndex: 80,
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "slideInRight 0.3s cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      <CoinBurst active={burst} onDone={() => setBurst(false)} />

      <button
        onClick={onClose}
        aria-label="詳細パネルを閉じる"
        style={{
          position: "absolute", top: 16, right: 16, background: "none",
          border: "none", color: "#8A7A6A", fontSize: 22, cursor: "pointer",
          lineHeight: 1, zIndex: 5,
        }}
      >×</button>

      {/* カバー */}
      <div style={{
        height: 200, background: "#0A0604",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {book.book?.thumbnail_url ? (
          <>
            <div style={{
              position: "absolute", inset: 0,
              background: `url(${book.book.thumbnail_url}) center/cover`,
              filter: "blur(20px) brightness(0.3)", transform: "scale(1.1)",
            }} />
            <img src={book.book.thumbnail_url} alt={book.book?.title}
              style={{
                height: 150, width: "auto", borderRadius: 6,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)", position: "relative", zIndex: 1,
              }}
            />
          </>
        ) : (
          <ColorCover
            color={book.book?.cover_color || "#C4956A"}
            title={book.book?.title || ""}
            author={book.book?.author || ""}
            size={100}
          />
        )}
      </div>

      {/* 詳細 */}
      <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#E8D5B0", marginBottom: 4 }}>
          {book.book?.title}
        </div>
        <div style={{ fontSize: 12, color: "#8A7A6A", marginBottom: 16 }}>
          {book.book?.author}
        </div>

        {/* 評価 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, color: "#6A5A4A", marginBottom: 6,
            textTransform: "uppercase", letterSpacing: 1,
          }}>評価</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5].map(s => (
              <span
                key={s}
                onClick={() => setRating(s)}
                role="button"
                aria-label={`${s}星`}
                style={{
                  fontSize: 22, cursor: "pointer",
                  color: s <= rating ? "#E8C84A" : "#3A2A1A",
                  transition: "transform 0.1s, color 0.1s",
                  transform: s <= rating ? "scale(1.1)" : "scale(1)",
                }}
              >★</span>
            ))}
          </div>
        </div>

        {/* カテゴリ */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, color: "#6A5A4A", marginBottom: 8,
            textTransform: "uppercase", letterSpacing: 1,
          }}>カテゴリ</div>
          <CategoryEditor
            tags={tags}
            allCategories={allCategories}
            onChange={setTags}
          />
        </div>

        {/* 進捗 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 8,
          }}>
            <div style={{ fontSize: 11, color: "#6A5A4A", textTransform: "uppercase", letterSpacing: 1 }}>
              読書進捗
            </div>
            <div style={{ fontSize: 11, color: "#E8934A" }}>
              {pageCount > 0 ? Math.round((page / pageCount) * 100) : 0}%
            </div>
          </div>
          <input
            type="range" min={0} max={pageCount || 100} value={page}
            onChange={e => setPage(Number(e.target.value))}
            aria-label="読書進捗"
            style={{ width: "100%", accentColor: "#E8934A" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#6A5A4A" }}>0</span>
            <span style={{ fontSize: 12, color: "#E8D5B0", fontWeight: 600 }}>
              {page} / {pageCount} ページ
            </span>
          </div>
        </div>

        {/* コインプレビュー */}
        <div style={{
          background: "rgba(196,168,130,0.08)", borderRadius: 10,
          padding: "10px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>🪙</span>
          <div>
            <div style={{ fontSize: 11, color: "#C4A882", fontWeight: 600 }}>
              保存で +{Math.max(0, Math.floor(
                Math.max(0, page - (book.max_page_reached || 0)) / 10
              ))} コイン獲得！
            </div>
            <div style={{ fontSize: 10, color: "#6A5A4A" }}>10ページ読む = 1コイン</div>
          </div>
        </div>

        {/* メモ */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, color: "#6A5A4A", marginBottom: 6,
            textTransform: "uppercase", letterSpacing: 1,
          }}>メモ・感想</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="読書メモを残そう..."
            aria-label="読書メモ"
            style={{
              width: "100%", minHeight: 80, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(196,168,130,0.15)", borderRadius: 8,
              padding: "10px 12px", color: "#E8D5B0", fontSize: 12,
              resize: "vertical", fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          style={{
            width: "100%", padding: "12px", background: "#C4956A",
            border: "none", borderRadius: 10, color: "#1A0F08",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 0.5,
            transition: "transform 0.1s, background 0.1s",
          }}
          onMouseEnter={e => e.target.style.background = "#D4A574"}
          onMouseLeave={e => e.target.style.background = "#C4956A"}
          onMouseDown={e => e.target.style.transform = "scale(0.97)"}
          onMouseUp={e => e.target.style.transform = "scale(1)"}
        >
          💾 保存する
        </button>

        {/* 削除エリア */}
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(196,168,130,0.08)", paddingTop: 12 }}>
          {!confirmDelete ? (
            <button
              onClick={handleDeleteClick}
              style={{
                width: "100%", padding: "10px", background: "transparent",
                border: "1px solid rgba(232,112,112,0.25)", borderRadius: 10,
                color: "#8A6A6A", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background    = "rgba(232,112,112,0.08)";
                e.currentTarget.style.borderColor   = "rgba(232,112,112,0.5)";
                e.currentTarget.style.color         = "#E87070";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background    = "transparent";
                e.currentTarget.style.borderColor   = "rgba(232,112,112,0.25)";
                e.currentTarget.style.color         = "#8A6A6A";
              }}
            >
              🗑️ 本棚から削除する
            </button>
          ) : (
            <div style={{
              background: "rgba(232,112,112,0.08)",
              border: "1px solid rgba(232,112,112,0.3)",
              borderRadius: 10, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 12, color: "#E8D5B0", marginBottom: 4, fontWeight: 600 }}>
                本当に削除しますか？
              </div>
              <div style={{ fontSize: 11, color: "#8A7A6A", marginBottom: 12 }}>
                「{book.book?.title}」を本棚から削除します。この操作は元に戻せません。
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleDeleteCancel}
                  style={{
                    flex: 1, padding: "8px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(196,168,130,0.2)",
                    borderRadius: 8, color: "#8A7A6A", fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#E8D5B0"}
                  onMouseLeave={e => e.currentTarget.style.color = "#8A7A6A"}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  style={{
                    flex: 1, padding: "8px",
                    background: "rgba(232,112,112,0.15)",
                    border: "1px solid rgba(232,112,112,0.4)",
                    borderRadius: 8, color: "#E87070", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(232,112,112,0.28)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(232,112,112,0.15)"}
                >
                  削除する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function BookshelfDashboard() {
  const [books,          setBooks]          = useState([]);
  const [filter,         setFilter]         = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const selectedBook = selectedBookId
  ? books.find(b => b.id === selectedBookId) ?? null
  : null;
  const [showSearch,     setShowSearch]     = useState(false);
  const [coins,          setCoins]          = useState(0);
  const [userId,         setUserId]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [shelfName,      setShelfName]      = useState("わたしの本棚");
  const [petHappiness,   setPetHappiness]   = useState(72);
  const [petBlink,       setPetBlink]       = useState(false);
  const [petWag,         setPetWag]         = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase
        .from("profiles")
        .select("coins, shelf_name")
        .eq("id", uid)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert({ id: uid });
        setCoins(0);
        setShelfName("わたしの本棚");
      } else {
        setCoins(profile.coins || 0);
        setShelfName(profile.shelf_name || "わたしの本棚");
      }

      const userBooks = await fetchUserBooks(uid);
      setBooks(userBooks || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setPetBlink(true);
      setTimeout(() => setPetBlink(false), 180);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const handlePetHover = () => {
    setPetWag(true);
    setTimeout(() => setPetWag(false), 600);
  };

  const handleShelfNameSave = async (name) => {
    setShelfName(name);
    await updateShelfName(userId, name);
  };

  const handleAddBook = async (bookData) => {
    if (!userId) return;
    await addBook(userId, bookData);
    const updated = await fetchUserBooks(userId);
    setBooks(updated || []);
    setShowSearch(false);
  };

  const handleBookUpdate = async (updated) => {
    try {
      const original = books.find(b => b.id === updated.id);
      const newPage  = updated.current_page || 0;

      await updateUserBook(updated.id, {
        current_page: newPage,
        rating:       updated.rating,
        notes:        updated.notes,
        tags:         updated.tags,
        status: newPage >= (updated.book?.page_count || 0)
          ? "completed"
          : newPage > 0 ? "reading" : "unread",
      });

      // pagesAdded ではなく newPage を渡す（関数内で max_page_reached と比較）
      const earned = await recordReadingProgress(updated.id, userId, newPage);
      if (earned > 0) setCoins(c => c + earned);

      const refreshed = await fetchUserBooks(userId);
      setBooks(refreshed || []);
    } catch (e) {
      console.error("保存失敗:", e);
    }
  };

  const handleBookDelete = async (userBookId) => {
    await deleteUserBook(userBookId);
    const refreshed = await fetchUserBooks(userId);
    setBooks(refreshed || []);
    setSelectedBookId(null); // 削除時だけ閉じる
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const filteredBooks = books
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => !categoryFilter || (b.tags ?? []).includes(categoryFilter));

  const allCategories = [...new Set(
    books.flatMap(b => b.tags ?? []).filter(Boolean)
  )].sort();

  const stats = {
    total:      books.length,
    completed:  books.filter(b => b.status === "completed").length,
    reading:    books.filter(b => b.status === "reading").length,
    totalPages: books.reduce((s, b) => s + (b.current_page || 0), 0),
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0703", color: "#E8D5B0",
      fontFamily: "'Noto Serif JP', 'Georgia', serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes coinFly0 { to { transform: translateY(-60px) rotate(360deg); opacity: 0; } }
        @keyframes coinFly1 { to { transform: translateY(-80px) translateX(20px) rotate(-360deg); opacity: 0; } }
        @keyframes coinFly2 { to { transform: translateY(-70px) translateX(-20px) rotate(180deg); opacity: 0; } }
        @keyframes floatPet { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer  { 0%{opacity:0.3} 50%{opacity:0.7} 100%{opacity:0.3} }
        @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(196,168,130,0)} 50%{box-shadow:0 0 0 6px rgba(196,168,130,0.12)} }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes petWag   { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,168,130,0.2); border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(196,168,130,0.2); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #C4956A; cursor: pointer; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <aside
          aria-label="サイドバー"
          style={{
            width: 64, background: "rgba(10,6,3,0.8)",
            borderRight: "1px solid rgba(196,168,130,0.08)",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "20px 0", gap: 8, position: "sticky", top: 0, height: "100vh",
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 16 }}>📖</div>
          {[
            { icon: "🏠", label: "本棚",    active: true },
            { icon: "🔍", label: "検索",    action: () => setShowSearch(true) },
            { icon: "🏡", label: "箱庭",    action: () => {
                sessionStorage.setItem("pendingGardenCoins", String(coins));
                router.push("/garden");
              }
            },
            { icon: "🏪", label: "ショップ" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              title={item.label}
              aria-label={item.label}
              style={{
                width: 42, height: 42, borderRadius: 12, border: "none",
                background: item.active ? "rgba(196,168,130,0.15)" : "transparent",
                fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
                boxShadow: item.active ? "0 0 0 1px rgba(196,168,130,0.2)" : "none",
              }}
              onMouseEnter={e => !item.active && (e.currentTarget.style.background = "rgba(196,168,130,0.08)")}
              onMouseLeave={e => !item.active && (e.currentTarget.style.background = "transparent")}
            >
              {item.icon}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Header */}
          <header style={{
            padding: "20px 28px 16px", display: "flex", alignItems: "center", gap: 16,
            borderBottom: "1px solid rgba(196,168,130,0.08)",
            background: "rgba(10,6,3,0.6)", backdropFilter: "blur(10px)",
          }}>
            <div style={{ flex: 1 }}>
              <ShelfNameEditor name={shelfName} onSave={handleShelfNameSave} />
              <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 2 }}>
                {stats.total}冊 · 読了 {stats.completed}冊 · 読書中 {stats.reading}冊
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(196,168,130,0.1)", border: "1px solid rgba(196,168,130,0.2)",
              borderRadius: 20, padding: "6px 14px", animation: "pulse 3s infinite",
            }}>
              <span style={{ fontSize: 16 }}>🪙</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#C4A882" }}>{coins}</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(107,174,140,0.08)", border: "1px solid rgba(107,174,140,0.2)",
              borderRadius: 20, padding: "6px 14px",
            }}>
              <span style={{ fontSize: 12 }}>📄</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6BAE8C" }}>
                {stats.totalPages.toLocaleString()}P
              </span>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              style={{
                padding: "8px 18px", background: "#C4956A", border: "none", borderRadius: 10,
                color: "#1A0F08", fontWeight: 700, fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: 0.3, transition: "transform 0.1s, background 0.15s",
              }}
              onMouseEnter={e => e.target.style.background = "#D4A574"}
              onMouseLeave={e => e.target.style.background = "#C4956A"}
              onMouseDown={e => e.target.style.transform = "scale(0.96)"}
              onMouseUp={e => e.target.style.transform = "scale(1)"}
            >
              ＋ 本を追加
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 14px", background: "transparent",
                border: "1px solid rgba(196,168,130,0.2)", borderRadius: 10,
                color: "#6A5A4A", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#E8D5B0"; e.currentTarget.style.borderColor = "rgba(196,168,130,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6A5A4A"; e.currentTarget.style.borderColor = "rgba(196,168,130,0.2)"; }}
            >
              ログアウト
            </button>
          </header>

          <div style={{ flex: 1, display: "flex" }}>

            {/* 本棚エリア */}
            <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", minWidth: 0 }}>

              {/* ステータスフィルター */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    style={{
                      padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: filter === key ? cfg.color : "rgba(196,168,130,0.15)",
                      background: filter === key ? `${cfg.color}22` : "transparent",
                      color: filter === key ? cfg.color : "#6A5A4A",
                      fontSize: 12, fontWeight: filter === key ? 700 : 400,
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                    }}
                  >
                    {cfg.label}
                    <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                      {key === "all" ? books.length : books.filter(b => b.status === key).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* カテゴリフィルター */}
              <div style={{ marginBottom: 20 }}>
                <CategoryFilter
                  books={books}
                  selectedCategory={categoryFilter}
                  onChange={setCategoryFilter}
                />
              </div>

              {loading && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#6A5A4A", fontSize: 14 }}>
                  読み込み中...
                </div>
              )}

              {!loading && filteredBooks.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📚</div>
                  <div style={{ fontSize: 14, color: "#6A5A4A", marginBottom: 16 }}>
                    {categoryFilter
                      ? `「${categoryFilter}」の本はまだありません`
                      : "まだ本が登録されていません"}
                  </div>
                  {!categoryFilter && (
                    <button
                      onClick={() => setShowSearch(true)}
                      style={{
                        padding: "10px 20px", background: "#C4956A", border: "none",
                        borderRadius: 10, color: "#1A0F08", fontWeight: 700,
                        fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      最初の本を追加する
                    </button>
                  )}
                </div>
              )}

              {!loading && filteredBooks.length > 0 && (
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                  gap: "24px 16px", perspective: 800,
                }}>
                  {filteredBooks.map((book, i) => (
                    <div
                      key={book.id}
                      style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: `${i * 0.04}s` }}
                    >
                      <BookCard book={book} onClick={b => setSelectedBookId(b.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ペットパネル */}
            <aside
              aria-label="ペットと統計"
              style={{
                width: 240, borderLeft: "1px solid rgba(196,168,130,0.08)",
                background: "rgba(8,4,2,0.5)", display: "flex", flexDirection: "column",
                padding: "24px 16px", gap: 20,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 11, color: "#6A5A4A", letterSpacing: 1,
                  textTransform: "uppercase", marginBottom: 12,
                }}>マイペット</div>
                <div
                  onMouseEnter={handlePetHover}
                  style={{
                    width: 120, height: 120, margin: "0 auto",
                    animation: "floatPet 3s ease-in-out infinite",
                    filter: "drop-shadow(0 8px 24px rgba(196,149,106,0.25))",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ animation: petWag ? "petWag 0.5s ease" : "none" }}>
                    <PetSprite happiness={petBlink ? 30 : petHappiness} />
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#D4A574" }}>ブックモ</div>
                <div style={{ fontSize: 10, color: "#6A5A4A", marginTop: 2 }}>本の妖精・Lv.4</div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#6A5A4A" }}>きもち</span>
                  <span style={{ fontSize: 10, color: "#E8934A" }}>
                    {petHappiness >= 80 ? "😊 うれしい" : petHappiness >= 50 ? "😐 ふつう" : "😔 さびしい"}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(196,168,130,0.1)", borderRadius: 3 }}>
                  <div style={{
                    height: "100%", width: `${petHappiness}%`, borderRadius: 3,
                    background: "#E8934A", transition: "width 0.6s ease",
                  }} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(196,168,130,0.08)", paddingTop: 16 }}>
                <div style={{
                  fontSize: 11, color: "#6A5A4A", letterSpacing: 1,
                  textTransform: "uppercase", marginBottom: 12,
                }}>読書記録</div>
                {[
                  { label: "総読了ページ", value: `${stats.totalPages.toLocaleString()}P`, icon: "📄" },
                  { label: "読了冊数",     value: `${stats.completed}冊`,                  icon: "✅" },
                  { label: "コイン残高",   value: `${coins}枚`,                            icon: "🪙" },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < 2 ? "1px solid rgba(196,168,130,0.05)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{s.icon}</span>
                      <span style={{ fontSize: 11, color: "#6A5A4A" }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#C4A882" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>

    {showSearch && (
    <AddBookModal
      onClose={() => setShowSearch(false)}
      onAdd={handleAddBook}
    />
    )}

    {selectedBook && (
      <BookDetailPanel
        book={selectedBook}          // books配列から引いた常に最新のオブジェクト
        allCategories={allCategories}
        onClose={() => setSelectedBookId(null)}
        onUpdate={handleBookUpdate}
        onDelete={handleBookDelete}
      />
    )}
    </div>
  );
}