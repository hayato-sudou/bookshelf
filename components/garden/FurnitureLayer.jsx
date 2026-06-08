"use client";
import { useState } from "react";
import { CELL_SIZE } from "@/constants/gardenConfig";

// ── CSSドット絵定義（imageUrl がない家具のフォールバック） ─────
// box-shadow でピクセルアート描画
const CSS_FURNITURE_STYLES = {
  "furniture--desk-chair": {
    width:  CELL_SIZE * 3,
    height: CELL_SIZE * 2,
    render: () => (
      <div style={{ position: "relative", width: "100%", height: "100%", imageRendering: "pixelated" }}>
        {/* 机の天板 */}
        <div style={{
          position: "absolute", top: "30%", left: "8%",
          width: "65%", height: "18%",
          background: "#8B6340",
          boxShadow: "0 2px 0 #5C3D1E",
        }} />
        {/* 机の脚 */}
        <div style={{ position: "absolute", top: "48%", left: "12%", width: "8%", height: "35%", background: "#5C3D1E" }} />
        <div style={{ position: "absolute", top: "48%", left: "60%", width: "8%", height: "35%", background: "#5C3D1E" }} />
        {/* ノート */}
        <div style={{ position: "absolute", top: "15%", left: "18%", width: "28%", height: "15%", background: "#F5E8C0", boxShadow: "1px 0 0 #C4A882" }} />
        {/* インク瓶 */}
        <div style={{ position: "absolute", top: "10%", left: "50%", width: "10%", height: "20%", background: "#2D4A7A", borderRadius: "0 0 3px 3px" }} />
        {/* 椅子 */}
        <div style={{ position: "absolute", top: "45%", left: "72%", width: "20%", height: "12%", background: "#7A5230" }} />
        <div style={{ position: "absolute", top: "57%", left: "74%", width: "6%", height: "25%", background: "#5C3D1E" }} />
        <div style={{ position: "absolute", top: "57%", left: "86%", width: "6%", height: "25%", background: "#5C3D1E" }} />
      </div>
    ),
  },
  "furniture--fireplace": {
    width:  CELL_SIZE * 3,
    height: CELL_SIZE * 3,
    render: ({ isAnimating }) => (
      <div style={{ position: "relative", width: "100%", height: "100%", imageRendering: "pixelated" }}>
        {/* 暖炉外枠 */}
        <div style={{ position: "absolute", inset: "5%", background: "#6B4A2A", borderRadius: "4px 4px 0 0" }} />
        {/* 開口部 */}
        <div style={{ position: "absolute", top: "20%", left: "20%", width: "60%", height: "50%", background: "#1A0A00", borderRadius: "4px 4px 0 0" }} />
        {/* 炎レイヤー1 */}
        <div style={{
          position: "absolute", top: "35%", left: "28%", width: "20%", height: "30%",
          background: "#FF6B00",
          borderRadius: "50% 50% 0 0",
          animation: isAnimating ? "flicker1 0.6s ease-in-out infinite alternate" : "none",
        }} />
        {/* 炎レイヤー2 */}
        <div style={{
          position: "absolute", top: "30%", left: "40%", width: "24%", height: "38%",
          background: "#FF9F00",
          borderRadius: "50% 50% 0 0",
          animation: isAnimating ? "flicker2 0.5s ease-in-out infinite alternate" : "none",
        }} />
        {/* 炎ハイライト */}
        <div style={{
          position: "absolute", top: "38%", left: "45%", width: "12%", height: "22%",
          background: "#FFDB00",
          borderRadius: "50% 50% 0 0",
          animation: isAnimating ? "flicker1 0.4s ease-in-out infinite alternate" : "none",
        }} />
        {/* 暖炉台座 */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%", background: "#8B6340" }} />
        <style>{`
          @keyframes flicker1 { from{transform:scaleY(1) scaleX(1)} to{transform:scaleY(1.1) scaleX(0.92)} }
          @keyframes flicker2 { from{transform:scaleY(1) scaleX(1)} to{transform:scaleY(0.95) scaleX(1.05)} }
        `}</style>
      </div>
    ),
  },
  "furniture--magic-lamp": {
    width:  CELL_SIZE * 2,
    height: CELL_SIZE * 2,
    render: ({ isAnimating }) => (
      <div style={{ position: "relative", width: "100%", height: "100%", imageRendering: "pixelated" }}>
        {/* ランプ本体 */}
        <div style={{ position: "absolute", top: "30%", left: "25%", width: "50%", height: "45%", background: "#C4956A", borderRadius: "50%", boxShadow: isAnimating ? "0 0 16px #FFD700, 0 0 32px rgba(255,200,0,0.4)" : "none" }} />
        {/* 注ぎ口 */}
        <div style={{ position: "absolute", top: "38%", left: "65%", width: "20%", height: "12%", background: "#A07040", borderRadius: "0 4px 4px 0" }} />
        {/* 取っ手 */}
        <div style={{ position: "absolute", top: "24%", left: "10%", width: "20%", height: "8%", background: "#A07040", borderRadius: "4px" }} />
        {/* 光 */}
        {isAnimating && (
          <div style={{
            position: "absolute", top: "10%", left: "35%", width: "30%", height: "25%",
            background: "radial-gradient(circle, rgba(255,220,80,0.8), transparent)",
            animation: "lampGlow 1.5s ease-in-out infinite alternate",
          }} />
        )}
        <style>{`@keyframes lampGlow { from{opacity:0.5;transform:scale(1)} to{opacity:1;transform:scale(1.3)} }`}</style>
      </div>
    ),
  },
  "furniture--bookshelf": {
    width:  CELL_SIZE * 2,
    height: CELL_SIZE * 3,
    render: () => (
      <div style={{ position: "relative", width: "100%", height: "100%", imageRendering: "pixelated" }}>
        {/* 棚板×3段 */}
        {[20, 47, 72].map((top, i) => (
          <div key={i} style={{ position: "absolute", top: `${top}%`, left: "5%", width: "90%", height: "6%", background: "#6B4A2A" }} />
        ))}
        {/* 外枠 */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "8%", height: "100%", background: "#5C3D1E" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "8%", height: "100%", background: "#5C3D1E" }} />
        {/* 本（カラフルな背表紙） */}
        {["#8B2020","#2050A0","#206020","#906020","#502080"].map((c, i) => (
          <div key={i} style={{ position: "absolute", top: "5%", left: `${12 + i * 16}%`, width: "12%", height: "18%", background: c }} />
        ))}
        {["#C04040","#4070C0"].map((c, i) => (
          <div key={i} style={{ position: "absolute", top: "32%", left: `${12 + i * 20}%`, width: "14%", height: "16%", background: c }} />
        ))}
      </div>
    ),
  },
};

// ── FurnitureItem ─────────────────────────────────────────────
function FurnitureItem({ piece, activeEffects, onDragEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset,  setDragOffset] = useState({ x: 0, y: 0 });

  const styleDef    = CSS_FURNITURE_STYLES[piece.cssClass];
  const isAnimating = activeEffects.has(piece.effect);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - piece.gridX * CELL_SIZE,
      y: e.clientY - piece.gridY * CELL_SIZE,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    // 親に委譲（RoomGridで処理）
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const newGridX = Math.round((e.clientX - dragOffset.x) / CELL_SIZE);
    const newGridY = Math.round((e.clientY - dragOffset.y) / CELL_SIZE);
    onDragEnd(piece.id, newGridX, newGridY);
  };

  if (!styleDef) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position:  "absolute",
        left:      piece.gridX * CELL_SIZE,
        top:       piece.gridY * CELL_SIZE,
        width:     styleDef.width,
        height:    styleDef.height,
        cursor:    isDragging ? "grabbing" : "grab",
        userSelect:"none",
        zIndex:    isDragging ? 10 : 2,
        filter:    isDragging ? "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" : "none",
        transition:isDragging ? "none" : "filter 0.2s",
      }}
    >
      {piece.imageUrl
        ? <img src={piece.imageUrl} alt={piece.name}
            style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
        : styleDef.render({ isAnimating })
      }
    </div>
  );
}

// ── FurnitureLayer ────────────────────────────────────────────
export default function FurnitureLayer({ placedFurniture, onMove }) {
  // 配置済みエフェクトのSet（暖炉・ランプが置かれているか）
  const activeEffects = new Set(
    placedFurniture
      .map(f => f.effect)
      .filter(Boolean)
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
      {placedFurniture.map(piece => (
        <FurnitureItem
          key={piece.id}
          piece={piece}
          activeEffects={activeEffects}
          onDragEnd={onMove}
        />
      ))}
    </div>
  );
}