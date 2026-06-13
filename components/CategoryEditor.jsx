"use client";
import { useState, useRef } from "react";

export default function CategoryEditor({ tags, allCategories, onChange }) {
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

      {/* サジェスト */}
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

      {/* 入力欄が空のときに既存カテゴリを候補表示 */}
      {!inputVal && allCategories.filter(c => !tags.includes(c)).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {allCategories.filter(c => !tags.includes(c)).map(c => (
            <button
              key={c}
              onClick={() => add(c)}
              style={{
                padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                background: "transparent",
                border: "1px solid rgba(196,168,130,0.15)",
                color: "#6A5A4A", fontSize: 11, fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(168,144,208,0.4)";
                e.currentTarget.style.color = "#C8B0F0";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(196,168,130,0.15)";
                e.currentTarget.style.color = "#6A5A4A";
              }}
            >
              + {c}
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