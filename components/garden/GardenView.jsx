"use client";
import { useState, useRef }    from "react";
import { GRID_COLS, GRID_ROWS, CELL_SIZE, ROOM_WIDTH, ROOM_HEIGHT } from "@/constants/gardenConfig";
import { useWindowPhase }       from "@/hooks/useWindowPhase";
import WindowScene              from "./WindowScene";
import FurnitureLayer           from "./FurnitureLayer";
import RoomEffects              from "./RoomEffects";

// 配置モード時のグリッドオーバーレイ
function GridOverlay({ placementW, placementH, onCellClick }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 5,
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
      gridTemplateRows:    `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
    }}>
      {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        return (
          <div
            key={i}
            onClick={() => onCellClick(col, row)}
            style={{
              border:     "1px solid rgba(196,168,130,0.12)",
              background: "transparent",
              cursor:     "crosshair",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(196,168,130,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          />
        );
      })}
    </div>
  );
}

export default function GardenView({ totalPages, placedFurniture, placementMode, onCellClick, onMove }) {
  const phase = useWindowPhase(totalPages);

  return (
    <div style={{
      position: "relative",
      width:    ROOM_WIDTH,
      height:   ROOM_HEIGHT,
      margin:   "0 auto",
      // 木の温かみを持つ壁紙
      background: "linear-gradient(180deg, #2C1A0E 0%, #3A2210 60%, #4A2E18 100%)",
      borderRadius: 8,
      overflow:   "hidden",
      boxShadow:  "0 24px 80px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.3)",
      imageRendering: "pixelated",
    }}>

      {/* 壁テクスチャ（木目ライン） */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, bottom: 0,
          left:  `${i * 14 + 2}%`, width: 1,
          background: "rgba(0,0,0,0.12)",
        }} />
      ))}

      {/* 窓 */}
      <div style={{
        position: "absolute", top: "8%", right: "8%",
        width: CELL_SIZE * 4, height: CELL_SIZE * 3,
        border: "4px solid #4A2E18",
        boxShadow: "inset 0 0 0 2px #2C1A0E, 4px 4px 12px rgba(0,0,0,0.5)",
        overflow: "hidden",
        borderRadius: 2,
      }}>
        <WindowScene phase={phase} />
        {/* 窓枠の十字 */}
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "#4A2E18", transform: "translateY(-50%)" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: "#4A2E18", transform: "translateX(-50%)" }} />
      </div>

      {/* 床 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
        background: "linear-gradient(180deg, #3A2210 0%, #2C1A0E 100%)",
        borderTop: "2px solid #1A0A04",
      }}>
        {/* 床板ライン */}
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{
            position: "absolute", left: 0, right: 0,
            top: `${i * 22}%`, height: 1,
            background: "rgba(0,0,0,0.2)",
          }} />
        ))}
      </div>

      {/* エフェクトレイヤー */}
      <RoomEffects placedFurniture={placedFurniture} />

      {/* 家具レイヤー */}
      <FurnitureLayer placedFurniture={placedFurniture} onMove={onMove} />

      {/* 配置モードのグリッド */}
      {placementMode.type === "placing" && (
        <GridOverlay
          placementW={placementMode.furniture.gridW}
          placementH={placementMode.furniture.gridH}
          onCellClick={onCellClick}
        />
      )}
    </div>
  );
}