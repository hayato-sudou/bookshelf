"use client";
import { useMagicAbsorb } from "@/hooks/useMagicAbsorb";

export default function MagicAbsorbAnimation({ baseCoins, pendingCoins, onComplete }) {
  const { isPlaying, displayCoins, particles } = useMagicAbsorb(
    baseCoins, pendingCoins, onComplete
  );

  if (!isPlaying && particles.length === 0) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none",
    }}>
      {/* 吸い上げシュルシュルのパーティクル */}
      {particles.map(p => (
        <div key={p.id} style={{
          position:  "absolute",
          left:      `${p.x}%`,
          top:       `${p.y}%`,
          fontSize:  18,
          animation: "absorbUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
        }}>
          {p.emoji}
        </div>
      ))}

      {/* コインカウンタ */}
      <div style={{
        position:   "absolute", top: 24, right: 24,
        background: "rgba(20,12,6,0.92)",
        border:     "1px solid rgba(196,168,130,0.4)",
        borderRadius: 16, padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 8,
        animation: isPlaying ? "countPulse 0.1s ease-in-out infinite alternate" : "none",
      }}>
        <span style={{ fontSize: 22 }}>🪙</span>
        <span style={{
          fontSize: 20, fontWeight: 700, color: "#FFD700",
          fontFamily: "monospace", minWidth: 50,
        }}>
          {displayCoins}
        </span>
      </div>

      <style>{`
        @keyframes absorbUp {
          0%   { opacity:1; transform: scale(1) translateY(0); }
          100% { opacity:0; transform: scale(0.4) translateY(-40vh); }
        }
        @keyframes countPulse {
          from { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          to   { box-shadow: 0 0 0 8px rgba(255,215,0,0); }
        }
      `}</style>
    </div>
  );
}