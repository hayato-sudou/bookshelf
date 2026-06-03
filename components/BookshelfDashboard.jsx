"use client";
import AddBookModal, { ColorCover } from "@/components/AddBookModal";
import { useState, useEffect, useRef } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_BOOKS = [
  { id: 1, title: "The Remains of the Day", author: "Kazuo Ishiguro", cover: "https://covers.openlibrary.org/b/id/8739161-M.jpg", status: "completed", rating: 5, pages: 258, currentPage: 258, tags: ["fiction", "classic"] },
  { id: 2, title: "Klara and the Sun", author: "Kazuo Ishiguro", cover: "https://covers.openlibrary.org/b/id/10481027-M.jpg", status: "reading", rating: 4, pages: 320, currentPage: 187, tags: ["sci-fi"] },
  { id: 3, title: "Educated", author: "Tara Westover", cover: "https://covers.openlibrary.org/b/id/8739162-M.jpg", status: "reading", rating: 4, pages: 352, currentPage: 80, tags: ["memoir"] },
  { id: 4, title: "The Name of the Wind", author: "Patrick Rothfuss", cover: "https://covers.openlibrary.org/b/id/11254-M.jpg", status: "unread", rating: 0, pages: 662, currentPage: 0, tags: ["fantasy"] },
  { id: 5, title: "Sapiens", author: "Yuval Noah Harari", cover: "https://covers.openlibrary.org/b/id/10519270-M.jpg", status: "completed", rating: 5, pages: 443, currentPage: 443, tags: ["non-fiction"] },
  { id: 6, title: "The Master and Margarita", author: "Mikhail Bulgakov", cover: "https://covers.openlibrary.org/b/id/8225428-M.jpg", status: "unread", rating: 0, pages: 480, currentPage: 0, tags: ["classic", "fantasy"] },
  { id: 7, title: "Never Let Me Go", author: "Kazuo Ishiguro", cover: "https://covers.openlibrary.org/b/id/8739160-M.jpg", status: "completed", rating: 4, pages: 288, currentPage: 288, tags: ["fiction"] },
  { id: 8, title: "The Midnight Library", author: "Matt Haig", cover: "https://covers.openlibrary.org/b/id/10225071-M.jpg", status: "unread", rating: 0, pages: 304, currentPage: 0, tags: ["fiction"] },
];

const STATUS_CONFIG = {
  all:       { label: "すべて",  color: "#C4A882" },
  reading:   { label: "読書中",  color: "#E8934A" },
  completed: { label: "読了",    color: "#6BAE8C" },
  unread:    { label: "未読",    color: "#7A9EC4" },
};

// ─── Pet SVG Component ────────────────────────────────────────────────────────
function PetSprite({ happiness }) {
  // happiness: 0-100 → affects eye/expression
  const eyeY = happiness > 60 ? 38 : 40;
  const mouthPath = happiness > 60
    ? "M 41 52 Q 50 58 59 52"  // smile
    : "M 41 55 Q 50 50 59 55"; // neutral
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      {/* Body */}
      <ellipse cx="50" cy="65" rx="28" ry="24" fill="#C4956A" />
      {/* Head */}
      <circle cx="50" cy="42" r="26" fill="#D4A574" />
      {/* Ears */}
      <ellipse cx="28" cy="22" rx="9" ry="13" fill="#C4956A" />
      <ellipse cx="72" cy="22" rx="9" ry="13" fill="#C4956A" />
      <ellipse cx="28" cy="22" rx="5" ry="9" fill="#E8B89A" />
      <ellipse cx="72" cy="22" rx="5" ry="9" fill="#E8B89A" />
      {/* Eyes */}
      <circle cx="40" cy={eyeY} r="5.5" fill="#2C1A0E" />
      <circle cx="60" cy={eyeY} r="5.5" fill="#2C1A0E" />
      <circle cx="42" cy={eyeY - 1.5} r="2" fill="white" />
      <circle cx="62" cy={eyeY - 1.5} r="2" fill="white" />
      {/* Nose */}
      <ellipse cx="50" cy="48" rx="4" ry="2.5" fill="#A0624A" />
      {/* Mouth */}
      <path d={mouthPath} stroke="#A0624A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      {happiness > 60 && (
        <>
          <ellipse cx="33" cy="50" rx="7" ry="4" fill="#E87070" opacity="0.35" />
          <ellipse cx="67" cy="50" rx="7" ry="4" fill="#E87070" opacity="0.35" />
        </>
      )}
      {/* Tail */}
      <path d="M 74 72 Q 95 60 90 80 Q 82 95 72 82" fill="#C4956A" />
      {/* Hat (reading accessory) */}
      <rect x="34" y="14" width="32" height="5" rx="2" fill="#5C4030" />
      <rect x="38" y="4" width="24" height="12" rx="3" fill="#7A5540" />
    </svg>
  );
}

// ─── Coin Burst Animation ─────────────────────────────────────────────────────
function CoinBurst({ active, onDone }) {
  useEffect(() => {
    if (active) { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }
  }, [active, onDone]);
  if (!active) return null;
  const coins = Array.from({ length: 6 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {coins.map(i => (
        <div key={i} style={{
          position: "absolute", left: `${30 + i * 8}%`, top: "40%",
          fontSize: 20, animation: `coinFly${i % 3} 0.8s ease-out forwards`,
          animationDelay: `${i * 0.06}s`,
        }}>🪙</div>
      ))}
    </div>
  );
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({ book, onClick }) {
  const [hovered, setHovered] = useState(false);
  const progress = book.pages > 0 ? (book.currentPage / book.pages) * 100 : 0;

  const statusColor = { reading: "#E8934A", completed: "#6BAE8C", unread: "#7A9EC4" }[book.status];

  return (
    <div
      onClick={() => onClick(book)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
        transform: hovered ? "translateY(-10px) rotateY(-5deg) scale(1.04)" : "translateY(0) rotateY(0deg) scale(1)",
        transformStyle: "preserve-3d",
        borderRadius: 6,
        boxShadow: hovered
          ? "8px 16px 32px rgba(0,0,0,0.6), 2px 4px 8px rgba(0,0,0,0.4)"
          : "4px 8px 16px rgba(0,0,0,0.45), 1px 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      {/* Book cover */}
      <div style={{ width: "100%", aspectRatio: "2/3", overflow: "hidden", borderRadius: 6, background: "#2C1A0E" }}>
        <img
          src={book.cover}
          alt={book.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
            filter: book.status === "unread" ? "saturate(0.4) brightness(0.7)" : "none",
            transition: "filter 0.3s" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        {/* Spine shadow */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
          background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent)", borderRadius: "6px 0 0 6px" }} />
        {/* Status dot */}
        <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%",
          background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
        {/* Reading progress bar */}
        {book.status === "reading" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
            background: "rgba(0,0,0,0.5)", borderRadius: "0 0 6px 6px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#E8934A",
              borderRadius: "0 0 0 6px", transition: "width 0.5s ease" }} />
          </div>
        )}
      </div>
      {/* Tooltip on hover */}
      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,12,6,0.96)", border: "1px solid rgba(196,168,130,0.25)",
          borderRadius: 8, padding: "8px 10px", width: 140, zIndex: 20,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#E8D5B0", lineHeight: 1.3, marginBottom: 3 }}>{book.title}</div>
          <div style={{ fontSize: 10, color: "#8A7A6A" }}>{book.author}</div>
          {book.status === "reading" && (
            <div style={{ fontSize: 10, color: "#E8934A", marginTop: 4 }}>{book.currentPage} / {book.pages} ページ</div>
          )}
          {book.rating > 0 && (
            <div style={{ fontSize: 11, marginTop: 3 }}>{"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&langRestrict=ja`);
      const data = await res.json();
      setResults(data.items || []);
    } catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#1A0F08", border: "1px solid rgba(196,168,130,0.2)", borderRadius: 16,
        width: 560, maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 64px rgba(0,0,0,0.8)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(196,168,130,0.1)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#E8D5B0", marginBottom: 12 }}>📚 本を検索する</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="タイトル、著者名で検索..."
              autoFocus
              style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(196,168,130,0.2)",
                borderRadius: 8, padding: "10px 14px", color: "#E8D5B0", fontSize: 13,
                outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={search} style={{ padding: "10px 18px", background: "#C4956A", border: "none",
              borderRadius: 8, color: "#1A0F08", fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "inherit" }}>
              {loading ? "…" : "検索"}
            </button>
          </div>
        </div>
        {/* Results */}
        <div style={{ overflowY: "auto", padding: "12px 16px", flex: 1 }}>
          {results.map(item => {
            const info = item.volumeInfo;
            return (
              <div key={item.id} style={{ display: "flex", gap: 12, padding: "10px 8px",
                borderRadius: 8, cursor: "pointer", transition: "background 0.15s",
                marginBottom: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(196,168,130,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                onClick={() => onAdd(item)}>
                {info.imageLinks?.thumbnail && (
                  <img src={info.imageLinks.thumbnail} alt="" style={{ width: 44, height: 60,
                    objectFit: "cover", borderRadius: 4 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#E8D5B0",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {info.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#8A7A6A", marginTop: 2 }}>
                    {info.authors?.join(", ") || "著者不明"}
                  </div>
                  <div style={{ fontSize: 10, color: "#6A5A4A", marginTop: 4 }}>
                    {info.pageCount ? `${info.pageCount}ページ` : ""} {info.publishedDate?.slice(0,4) || ""}
                  </div>
                </div>
                <div style={{ alignSelf: "center", fontSize: 20, color: "#6BAE8C" }}>+</div>
              </div>
            );
          })}
          {results.length === 0 && !loading && query && (
            <div style={{ textAlign: "center", color: "#6A5A4A", fontSize: 13, padding: "32px 0" }}>
              検索結果が見つかりませんでした
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Book Detail Panel ────────────────────────────────────────────────────────
function BookDetailPanel({ book, onClose, onUpdate }) {
  const [page, setPage] = useState(book.currentPage);
  const [note, setNote] = useState(book.notes || "");
  const [rating, setRating] = useState(book.rating);
  const [burst, setBurst] = useState(false);

  const handleSave = () => {
    const added = Math.max(0, page - book.currentPage);
    if (added > 0) setBurst(true);
    onUpdate({ ...book, currentPage: page, notes: note, rating });
  };

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 340,
      background: "#140C06", borderLeft: "1px solid rgba(196,168,130,0.15)",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", zIndex: 80,
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "slideInRight 0.3s cubic-bezier(0.34,1.2,0.64,1)" }}>
      <CoinBurst active={burst} onDone={() => setBurst(false)} />
      {/* Close */}
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none",
        border: "none", color: "#8A7A6A", fontSize: 22, cursor: "pointer", lineHeight: 1, zIndex: 5 }}>×</button>
      {/* Cover */}
      <div style={{ height: 200, background: "#0A0604", display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background:
          `url(${book.cover}) center/cover`, filter: "blur(20px) brightness(0.3)", transform: "scale(1.1)" }} />
        <img src={book.cover} alt={book.title} style={{ height: 150, width: "auto", borderRadius: 6,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)", position: "relative", zIndex: 1 }} />
      </div>
      {/* Info */}
      <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#E8D5B0", marginBottom: 4 }}>{book.title}</div>
        <div style={{ fontSize: 12, color: "#8A7A6A", marginBottom: 16 }}>{book.author}</div>

        {/* Rating */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6A5A4A", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>評価</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} onClick={() => setRating(s)} style={{ fontSize: 22, cursor: "pointer",
                color: s <= rating ? "#E8C84A" : "#3A2A1A", transition: "transform 0.1s, color 0.1s",
                transform: s <= rating ? "scale(1.1)" : "scale(1)" }}>★</span>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#6A5A4A", textTransform: "uppercase", letterSpacing: 1 }}>読書進捗</div>
            <div style={{ fontSize: 11, color: "#E8934A" }}>{Math.round((page / book.pages) * 100)}%</div>
          </div>
          <input type="range" min={0} max={book.pages} value={page}
            onChange={e => setPage(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#E8934A" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#6A5A4A" }}>0</span>
            <span style={{ fontSize: 12, color: "#E8D5B0", fontWeight: 600 }}>{page} / {book.pages} ページ</span>
          </div>
        </div>

        {/* Coins preview */}
        <div style={{ background: "rgba(196,168,130,0.08)", borderRadius: 10, padding: "10px 14px",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🪙</span>
          <div>
            <div style={{ fontSize: 11, color: "#C4A882", fontWeight: 600 }}>
              保存で +{Math.max(0, Math.floor((page - book.currentPage) / 10))} コイン獲得！
            </div>
            <div style={{ fontSize: 10, color: "#6A5A4A" }}>10ページ読む = 1コイン</div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6A5A4A", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>メモ・感想</div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="読書メモを残そう..."
            style={{ width: "100%", minHeight: 80, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(196,168,130,0.15)", borderRadius: 8, padding: "10px 12px",
              color: "#E8D5B0", fontSize: 12, resize: "vertical", fontFamily: "inherit",
              outline: "none", boxSizing: "border-box" }} />
        </div>

        <button onClick={handleSave} style={{ width: "100%", padding: "12px", background: "#C4956A",
          border: "none", borderRadius: 10, color: "#1A0F08", fontWeight: 700, fontSize: 14,
          cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
          transition: "transform 0.1s, background 0.1s" }}
          onMouseEnter={e => e.target.style.background = "#D4A574"}
          onMouseLeave={e => e.target.style.background = "#C4956A"}
          onMouseDown={e => e.target.style.transform = "scale(0.97)"}
          onMouseUp={e => e.target.style.transform = "scale(1)"}>
          💾 保存する
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function BookshelfDashboard() {
  const [books, setBooks] = useState(MOCK_BOOKS);
  const [filter, setFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [coins, setCoins] = useState(142);
  const [petHappiness, setPetHappiness] = useState(72);
  const [petBlink, setPetBlink] = useState(false);
  const [petWag, setPetWag] = useState(false);

  // Pet blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setPetBlink(true);
      setTimeout(() => setPetBlink(false), 180);
    }, 3500 + Math.random() * 1500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Pet tail wag on hover
  const handlePetHover = () => { setPetWag(true); setTimeout(() => setPetWag(false), 600); };

  const filteredBooks = filter === "all" ? books : books.filter(b => b.status === filter);

  const stats = {
    total: books.length,
    completed: books.filter(b => b.status === "completed").length,
    reading: books.filter(b => b.status === "reading").length,
    totalPages: books.reduce((s, b) => s + b.currentPage, 0),
  };

  const handleBookUpdate = (updated) => {
    const added = Math.max(0, Math.floor((updated.currentPage - (books.find(b => b.id === updated.id)?.currentPage || 0)) / 10));
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b));
    if (added > 0) {
      setCoins(c => c + added);
      setPetHappiness(h => Math.min(100, h + added * 2));
    }
    setSelectedBook(null);
  };

  const handleAddBook = (googleBook) => {
    const info = googleBook.volumeInfo;
    const newBook = {
      id: Date.now(), title: info.title, author: info.authors?.[0] || "不明",
      cover: info.imageLinks?.thumbnail || "", status: "unread",
      rating: 0, pages: info.pageCount || 200, currentPage: 0, tags: [],
    };
    setBooks(prev => [newBook, ...prev]);
    setShowSearch(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0703", color: "#E8D5B0",
      fontFamily: "'Noto Serif JP', 'Georgia', serif", position: "relative", overflow: "hidden" }}>

      {/* CSS Keyframes injected inline */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes coinFly0 { to { transform: translateY(-60px) rotate(360deg); opacity: 0; } }
        @keyframes coinFly1 { to { transform: translateY(-80px) translateX(20px) rotate(-360deg); opacity: 0; } }
        @keyframes coinFly2 { to { transform: translateY(-70px) translateX(-20px) rotate(180deg); opacity: 0; } }
        @keyframes petWag { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
        @keyframes floatPet { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{opacity:0.3} 50%{opacity:0.7} 100%{opacity:0.3} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(196,168,130,0)} 50%{box-shadow:0 0 0 6px rgba(196,168,130,0.12)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,168,130,0.2); border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(196,168,130,0.2); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #C4956A; cursor: pointer; }
        textarea:focus { border-color: rgba(196,168,130,0.35) !important; }
        input:focus { border-color: rgba(196,168,130,0.35) !important; }
      `}</style>

      {/* Ambient background glow */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: "20%", width: 600, height: 600,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(196,149,106,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: "10%", width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(107,174,140,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", minHeight: "100vh" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 64, background: "rgba(10,6,3,0.8)", borderRight: "1px solid rgba(196,168,130,0.08)",
          display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 8,
          backdropFilter: "blur(10px)", position: "sticky", top: 0, height: "100vh" }}>
          {/* Logo */}
          <div style={{ fontSize: 26, marginBottom: 16 }}>📖</div>
          {[
            { icon: "🏠", label: "本棚", active: true },
            { icon: "🔍", label: "検索", action: () => setShowSearch(true) },
            { icon: "🐾", label: "ペット" },
            { icon: "🏪", label: "ショップ" },
            { icon: "📊", label: "統計" },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              title={item.label}
              style={{ width: 42, height: 42, borderRadius: 12, border: "none",
                background: item.active ? "rgba(196,168,130,0.15)" : "transparent",
                fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", transition: "background 0.2s, transform 0.1s",
                boxShadow: item.active ? "0 0 0 1px rgba(196,168,130,0.2)" : "none" }}
              onMouseEnter={e => !item.active && (e.currentTarget.style.background = "rgba(196,168,130,0.08)")}
              onMouseLeave={e => !item.active && (e.currentTarget.style.background = "transparent")}>
              {item.icon}
            </button>
          ))}
        </aside>

        {/* ── Main Area ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Top Bar */}
          <header style={{ padding: "20px 28px 16px", display: "flex", alignItems: "center",
            gap: 16, borderBottom: "1px solid rgba(196,168,130,0.08)",
            background: "rgba(10,6,3,0.6)", backdropFilter: "blur(10px)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#E8D5B0", letterSpacing: -0.5 }}>
                わたしの本棚
              </div>
              <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 2 }}>
                {stats.total}冊 · 読了 {stats.completed}冊 · 読書中 {stats.reading}冊
              </div>
            </div>

            {/* Coin badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(196,168,130,0.1)",
              border: "1px solid rgba(196,168,130,0.2)", borderRadius: 20, padding: "6px 14px",
              animation: "pulse 3s infinite" }}>
              <span style={{ fontSize: 16 }}>🪙</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#C4A882" }}>{coins}</span>
            </div>

            {/* Pages */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(107,174,140,0.08)",
              border: "1px solid rgba(107,174,140,0.2)", borderRadius: 20, padding: "6px 14px" }}>
              <span style={{ fontSize: 12 }}>📄</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6BAE8C" }}>{stats.totalPages.toLocaleString()}P</span>
            </div>

            {/* Add book button */}
            <button onClick={() => setShowSearch(true)}
              style={{ padding: "8px 18px", background: "#C4956A", border: "none", borderRadius: 10,
                color: "#1A0F08", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                letterSpacing: 0.3, transition: "transform 0.1s, background 0.15s" }}
              onMouseEnter={e => e.target.style.background = "#D4A574"}
              onMouseLeave={e => e.target.style.background = "#C4956A"}
              onMouseDown={e => e.target.style.transform = "scale(0.96)"}
              onMouseUp={e => e.target.style.transform = "scale(1)"}>
              ＋ 本を追加
            </button>
          </header>

          {/* Content area — shelf + pet side by side */}
          <div style={{ flex: 1, display: "flex", gap: 0 }}>

            {/* ─ Bookshelf Area ─ */}
            <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", minWidth: 0 }}>

              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setFilter(key)}
                    style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: filter === key ? cfg.color : "rgba(196,168,130,0.15)",
                      background: filter === key ? `${cfg.color}22` : "transparent",
                      color: filter === key ? cfg.color : "#6A5A4A", fontSize: 12,
                      fontWeight: filter === key ? 700 : 400, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.2s" }}>
                    {cfg.label}
                    <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                      {key === "all" ? books.length : books.filter(b => b.status === key).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Shelf divider line */}
              <div style={{ borderBottom: "2px solid rgba(196,168,130,0.12)", marginBottom: 28, position: "relative" }}>
                <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 6,
                  background: "linear-gradient(to bottom, rgba(196,168,130,0.08), transparent)" }} />
              </div>

              {/* Book grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                gap: "24px 16px", perspective: 800 }}>
                {filteredBooks.map((book, i) => (
                  <div key={book.id} style={{ animation: `fadeSlideUp 0.4s ease both`, animationDelay: `${i * 0.04}s` }}>
                    <BookCard book={book} onClick={setSelectedBook} />
                  </div>
                ))}
              </div>

              <style>{`
                @keyframes fadeSlideUp {
                  from { opacity: 0; transform: translateY(16px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              {/* Shelf floor */}
              <div style={{ marginTop: 32, height: 8, background: "rgba(196,168,130,0.08)",
                borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
            </div>

            {/* ─ Pet & Stats Panel ─ */}
            <aside style={{ width: 240, borderLeft: "1px solid rgba(196,168,130,0.08)",
              background: "rgba(8,4,2,0.5)", display: "flex", flexDirection: "column",
              padding: "24px 16px", gap: 20, backdropFilter: "blur(8px)" }}>

              {/* Pet */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6A5A4A", letterSpacing: 1, textTransform: "uppercase",
                  marginBottom: 12 }}>マイペット</div>
                <div onMouseEnter={handlePetHover} style={{ width: 120, height: 120, margin: "0 auto",
                  animation: `floatPet 3s ease-in-out infinite`,
                  filter: "drop-shadow(0 8px 24px rgba(196,149,106,0.25))",
                  cursor: "pointer" }}>
                  <div style={{ animation: petWag ? "petWag 0.5s ease" : "none" }}>
                    <PetSprite happiness={petBlink ? 30 : petHappiness} />
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#D4A574" }}>ブックモ</div>
                <div style={{ fontSize: 10, color: "#6A5A4A", marginTop: 2 }}>本の妖精・Lv.4</div>
              </div>

              {/* Happiness bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#6A5A4A" }}>きもち</span>
                  <span style={{ fontSize: 10, color: petHappiness > 70 ? "#E8934A" : "#6A5A4A" }}>
                    {petHappiness >= 80 ? "😊 うれしい" : petHappiness >= 50 ? "😐 ふつう" : "😔 さびしい"}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(196,168,130,0.1)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${petHappiness}%`, borderRadius: 3,
                    background: petHappiness > 70 ? "#E8934A" : petHappiness > 40 ? "#C4A050" : "#7A9EC4",
                    transition: "width 0.6s ease, background 0.4s ease" }} />
                </div>
              </div>

              {/* EXP bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#6A5A4A" }}>EXP</span>
                  <span style={{ fontSize: 10, color: "#6BAE8C" }}>340 / 400</span>
                </div>
                <div style={{ height: 6, background: "rgba(196,168,130,0.1)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: "85%", borderRadius: 3,
                    background: "#6BAE8C", animation: "shimmer 2s infinite" }} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(196,168,130,0.08)", paddingTop: 16 }}>

                {/* Stats */}
                <div style={{ fontSize: 11, color: "#6A5A4A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                  読書記録
                </div>
                {[
                  { label: "今月読んだページ", value: "1,240P", icon: "📄" },
                  { label: "連続読書", value: "7日", icon: "🔥" },
                  { label: "コイン残高", value: `${coins}枚`, icon: "🪙" },
                  { label: "積読消化率", value: "62%", icon: "📊" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "8px 0",
                    borderBottom: i < 3 ? "1px solid rgba(196,168,130,0.05)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{s.icon}</span>
                      <span style={{ fontSize: 11, color: "#6A5A4A" }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#C4A882" }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Shop CTA */}
              <button style={{ width: "100%", padding: "10px", background: "rgba(196,168,130,0.08)",
                border: "1px solid rgba(196,168,130,0.15)", borderRadius: 10, color: "#C4A882",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.2s", letterSpacing: 0.3 }}
                onMouseEnter={e => e.target.style.background = "rgba(196,168,130,0.14)"}
                onMouseLeave={e => e.target.style.background = "rgba(196,168,130,0.08)"}>
                🏪 ショップを見る
              </button>
            </aside>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} onAdd={handleAddBook} />}
      {selectedBook && (
        <BookDetailPanel book={selectedBook} onClose={() => setSelectedBook(null)} onUpdate={handleBookUpdate} />
      )}
    </div>
  );
}
