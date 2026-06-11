"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import {
  fetchUserBooks,
  addBook,
  updateUserBook,
  updateShelfName,
  deleteUserBook,
} from "@/utils/bookActions";
import AddBookModal, { ColorCover } from "@/components/AddBookModal";
import Sidebar from "@/components/Sidebar";

const STATUS_CONFIG = {
  all:       { label: "すべて",  color: "#C4A882" },
  reading:   { label: "読書中",  color: "#E8934A" },
  completed: { label: "読了",    color: "#6BAE8C" },
  unread:    { label: "未読",    color: "#7A9EC4" },
};

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
              padding: "2px 6px", borderRadius: 4, transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#E8D5B0"}
            onMouseLeave={e => e.currentTarget.style.color = "#8A7A6A"}
          >
            ✕ 絞り込み解除
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {allCategories.map(cat => {
          const active = selectedCategory === cat;
          const count  = books.filter(b => (b.tags ?? []).includes(cat)).length;
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
        {/* スパイン影 */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
          background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent)",
          borderRadius: "6px 0 0 6px",
        }} />
        {/* ステータスドット */}
        <div style={{
          position: "absolute", top: 6, right: 6, width: 8, height: 8,
          borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}`,
        }} />
      </div>

      {/* ホバートゥールチップ */}
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

// ─── Status Selector ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "unread",    label: "未読",    color: "#7A9EC4", icon: "📚" },
  { value: "reading",   label: "読書中",  color: "#E8934A", icon: "📖" },
  { value: "completed", label: "読了",    color: "#6BAE8C", icon: "✅" },
];

function StatusSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {STATUS_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, border: "1px solid",
              borderColor: active ? opt.color : "rgba(196,168,130,0.15)",
              background: active ? `${opt.color}22` : "transparent",
              color: active ? opt.color : "#6A5A4A",
              fontSize: 12, fontWeight: active ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.18s",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Book Detail Panel ────────────────────────────────────────────────────────
function BookDetailPanel({ book, allCategories, onClose, onUpdate, onDelete }) {
  const [status,        setStatus]        = useState(book.status || "unread");
  const [note,          setNote]          = useState(book.notes || "");
  const [rating,        setRating]        = useState(book.rating || 0);
  const [tags,          setTags]          = useState(book.tags ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 別の本を選択したらstateをリセット
  useEffect(() => {
    setStatus(book.status || "unread");
    setNote(book.notes || "");
    setRating(book.rating || 0);
    setTags(book.tags ?? []);
    setConfirmDelete(false);
  }, [book.id]);

  const handleSave = () => {
    onUpdate({ ...book, status, notes: note, rating, tags });
  };

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: "40vw",
      background: "#140C06", borderLeft: "1px solid rgba(196,168,130,0.15)",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", zIndex: 80,
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "slideInRight 0.3s cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      {/* 閉じるボタン */}
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

      {/* スクロールエリア */}
      <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
        {/* タイトル・著者 */}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#E8D5B0", marginBottom: 4 }}>
          {book.book?.title}
        </div>
        <div style={{ fontSize: 12, color: "#8A7A6A", marginBottom: 20 }}>
          {book.book?.author}
        </div>

        {/* ステータス */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, color: "#6A5A4A", marginBottom: 10,
            textTransform: "uppercase", letterSpacing: 1,
          }}>読書ステータス</div>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        {/* 評価 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, color: "#6A5A4A", marginBottom: 8,
            textTransform: "uppercase", letterSpacing: 1,
          }}>評価</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span
                key={s}
                onClick={() => setRating(rating === s ? 0 : s)}
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
            {rating > 0 && (
              <span style={{ fontSize: 11, color: "#6A5A4A", alignSelf: "center", marginLeft: 4 }}>
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* カテゴリ */}
        <div style={{ marginBottom: 20 }}>
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

        {/* メモ */}
        <div style={{ marginBottom: 20 }}>
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
              width: "100%", minHeight: 100, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(196,168,130,0.15)", borderRadius: 8,
              padding: "10px 12px", color: "#E8D5B0", fontSize: 12,
              resize: "vertical", fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.15)"}
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
              onClick={() => setConfirmDelete(true)}
              style={{
                width: "100%", padding: "10px", background: "transparent",
                border: "1px solid rgba(232,112,112,0.25)", borderRadius: 10,
                color: "#8A6A6A", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = "rgba(232,112,112,0.08)";
                e.currentTarget.style.borderColor = "rgba(232,112,112,0.5)";
                e.currentTarget.style.color       = "#E87070";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = "transparent";
                e.currentTarget.style.borderColor = "rgba(232,112,112,0.25)";
                e.currentTarget.style.color       = "#8A6A6A";
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
                  onClick={() => setConfirmDelete(false)}
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
                  onClick={() => onDelete(book.id)}
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
  const [showSearch,     setShowSearch]     = useState(false);
  const [userId,         setUserId]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [shelfName,      setShelfName]      = useState("わたしの本棚");

  const selectedBook = selectedBookId
    ? books.find(b => b.id === selectedBookId) ?? null
    : null;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase
        .from("profiles")
        .select("shelf_name")
        .eq("id", uid)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert({ id: uid });
        setShelfName("わたしの本棚");
      } else {
        setShelfName(profile.shelf_name || "わたしの本棚");
      }

      const userBooks = await fetchUserBooks(uid);
      setBooks(userBooks || []);
      setLoading(false);
    });
  }, []);

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
      await updateUserBook(updated.id, {
        status: updated.status,
        rating: updated.rating,
        notes:  updated.notes,
        tags:   updated.tags,
      });
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
    setSelectedBookId(null);
  };

  const filteredBooks = books
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => !categoryFilter || (b.tags ?? []).includes(categoryFilter));

  const allCategories = [...new Set(
    books.flatMap(b => b.tags ?? []).filter(Boolean)
  )].sort();

  const stats = {
    total:     books.length,
    completed: books.filter(b => b.status === "completed").length,
    reading:   books.filter(b => b.status === "reading").length,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0703", color: "#E8D5B0",
      fontFamily: "'Noto Serif JP', 'Georgia', serif",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeSlideUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,168,130,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>

        <Sidebar />

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
          </header>

          {/* 本棚エリア */}
          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>

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
          book={selectedBook}
          allCategories={allCategories}
          onClose={() => setSelectedBookId(null)}
          onUpdate={handleBookUpdate}
          onDelete={handleBookDelete}
        />
      )}
    </div>
  );
}
