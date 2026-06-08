"use client";
import { useEffect, useState } from "react";

// ── 星パーティクル生成（夜フェーズ用） ───────────────────────
function generateStars(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    y:  Math.random() * 60,
    size:   Math.random() > 0.8 ? 2 : 1,
    delay:  Math.random() * 3,
    speed:  0.5 + Math.random() * 1.5,
  }));
}

const STARS = generateStars(45);

export default function WindowScene({ phase }) {
  const [shootingStarActive, setShootingStarActive] = useState(false);
  const [auroraOffset,       setAuroraOffset]       = useState(0);

  // 流れ星：夜フェーズ限定で定期発動
  useEffect(() => {
    if (phase.id !== "night" && phase.id !== "dawn2") return;
    const t = setInterval(() => {
      setShootingStarActive(true);
      setTimeout(() => setShootingStarActive(false), 1200);
    }, 6000 + Math.random() * 4000);
    return () => clearInterval(t);
  }, [phase.id]);

  // オーロラのゆらぎ
  useEffect(() => {
    if (!phase.hasAurora) return;
    let raf;
    let tick = 0;
    const animate = () => {
      tick += 0.01;
      setAuroraOffset(Math.sin(tick) * 8);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase.hasAurora]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: phase.bgGradient,
      overflow: "hidden",
      transition: "background 2s ease",
    }}>
      {/* 星空レイヤー */}
      {phase.hasStars && STARS.map(star => (
        <div key={star.id} style={{
          position:  "absolute",
          left:      `${star.x}%`,
          top:       `${star.y}%`,
          width:     star.size,
          height:    star.size,
          borderRadius: "50%",
          background:   "#E8D5FF",
          boxShadow:    `0 0 ${star.size * 2}px #E8D5FF`,
          animation:    `starTwinkle ${star.speed}s ${star.delay}s ease-in-out infinite alternate`,
        }} />
      ))}

      {/* 流れ星 */}
      {shootingStarActive && (
        <div style={{
          position: "absolute", top: "15%", left: "70%",
          width: 80, height: 1,
          background: "linear-gradient(90deg, transparent, #fff, transparent)",
          transform: "rotate(-35deg)",
          animation: "shootingStar 1.2s ease-out forwards",
        }} />
      )}

      {/* オーロラ */}
      {phase.hasAurora && (
        <div style={{
          position:  "absolute", top: `${-10 + auroraOffset}%`, left: "-10%",
          width:     "120%", height:  "40%",
          background:"linear-gradient(180deg, rgba(0,255,200,0.08) 0%, rgba(130,0,255,0.12) 50%, transparent 100%)",
          filter:    "blur(12px)",
        }} />
      )}

      {/* 朝：光の射し込み */}
      {(phase.id === "dawn" || phase.id === "dawn2") && (
        <div style={{
          position:  "absolute", top: 0, right: "20%",
          width:     60, height:  "100%",
          background:"linear-gradient(180deg, rgba(255,240,150,0.4), transparent)",
          transform: "skewX(-10deg)",
          animation: "sunRay 4s ease-in-out infinite alternate",
        }} />
      )}

      <style>{`
        @keyframes starTwinkle { from{opacity:0.3} to{opacity:1} }
        @keyframes shootingStar { from{opacity:1;transform:translateX(0) rotate(-35deg)} to{opacity:0;transform:translateX(-120px) rotate(-35deg)} }
        @keyframes sunRay { from{opacity:0.3} to{opacity:0.6} }
      `}</style>
    </div>
  );
}