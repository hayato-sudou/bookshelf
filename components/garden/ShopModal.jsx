"use client";
import { useState } from "react";
import { FURNITURE_CATALOG } from "@/constants/furnitureCatalog";

function FurnitureCatalogCard({ item, coins, totalPages, onBuy }) {
  const [hovered, setHovered] = useState(false);
  const isLocked      = totalPages < item.unlockPages;
  const canAfford     = coins >= item.coinCost;
  const isInteractable = !isLocked && canAfford;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered && isInteractable ? "rgba(196,168,130,0.1)" : "rgba(255,255,255,0.03)",
        border:       `1px solid ${hovered && isInteractable ? "rgba(196,168,130,0.3)" : "rgba(196,168,130,0.1)"}`,
        borderRadius: 12, padding: "14px 16px",
        opacity:      isLocked ? 0.45 : 1,
        transition:   "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E8D5B0" }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "#6A5A4A", marginTop: 3, lineHeight: 1.4 }}>{item.description}</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(196,168,130,0.1)", borderRadius: 20,
          padding: "4px 10px", flexShrink: 0, marginLeft: 12,
        }}>
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#C4A882" }}>{item.coinCost}</span>
        </div>
      </div>

      {isLocked ? (
        <div style={{ fontSize: 10, color: "#6A5A4A", marginTop: 6 }}>
          🔒 {item.unlockPages.toLocaleString()}P 読んでアンロック
        </div>
      ) : (
        <button
          onClick={() => onBuy(item)}
          disabled={!canAfford}
          style={{
            width: "100%", padding: "8px",
            background: canAfford ? "#C4956A" : "#2A1A0A",
            border: "none", borderRadius: 8,
            color: canAfford ? "#1A0F08" : "#4A3A2A",
            fontWeight: 700, fontSize: 12, cursor: canAfford ? "pointer" : "default",
            fontFamily: "inherit", marginTop: 8,
            transition: "background 0.15s",
          }}
        >
          {canAfford ? "✦ クラフトする" : "コインが足りません"}
        </button>
      )}
    </div>
  );
}

export default function ShopModal({ coins, totalPages, onClose, onBuy }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { key: "all",       label: "すべて" },
    { key: "furniture", label: "家具" },
    { key: "magic",     label: "魔法" },
    { key: "decoration",label: "装飾" },
  ];

  const filtered = FURNITURE_CATALOG.filter(
    item => activeCategory === "all" || item.category === activeCategory
  );

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "#130B05", border: "1px solid rgba(196,168,130,0.18)",
        borderRadius: 18, width: "100%", maxWidth: 480, maxHeight: "80vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.85)",
        animation: "modalIn 0.25s cubic-bezier(0.34,1.3,0.64,1)",
      }}>
        {/* ヘッダー */}
        <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E8D5B0" }}>🏪 魔法のクラフトショップ</div>
              <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 2 }}>
                所持コイン：🪙 <span style={{ color: "#C4A882", fontWeight: 700 }}>{coins}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6A5A4A", fontSize: 22, cursor: "pointer" }}>×</button>
          </div>

          {/* カテゴリタブ */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {categories.map(c => (
              <button key={c.key} onClick={() => setActiveCategory(c.key)} style={{
                padding: "5px 14px", borderRadius: 20, border: "1px solid",
                borderColor: activeCategory === c.key ? "#C4956A" : "rgba(196,168,130,0.15)",
                background: activeCategory === c.key ? "rgba(196,149,106,0.2)" : "transparent",
                color: activeCategory === c.key ? "#C4956A" : "#6A5A4A",
                fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(196,168,130,0.08)", flexShrink: 0 }} />

        {/* アイテム一覧 */}
        <div style={{ overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(item => (
            <FurnitureCatalogCard
              key={item.id}
              item={item}
              coins={coins}
              totalPages={totalPages}
              onBuy={onBuy}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes modalIn { from{opacity:0;transform:scale(0.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}