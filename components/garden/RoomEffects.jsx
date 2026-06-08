"use client";
import { useEffect, useState } from "react";

// 暖炉：壁・床への揺らぎ光演出
function FireplaceEffect() {
  const [intensity, setIntensity] = useState(0.3);

  useEffect(() => {
    let raf;
    let tick = 0;
    const animate = () => {
      tick += 0.03;
      setIntensity(0.25 + Math.sin(tick) * 0.15 + Math.sin(tick * 2.3) * 0.08);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* 床への橙色反射 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
        background: `radial-gradient(ellipse at 50% 100%, rgba(255,120,0,${intensity}) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      {/* 左壁への光 */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: "25%", height: "100%",
        background: `linear-gradient(90deg, rgba(255,100,0,${intensity * 0.5}), transparent)`,
        pointerEvents: "none",
      }} />
    </>
  );
}

// 魔法のランプ：光の粒子演出
function MagicLampEffect() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newParticle = {
        id:   Date.now(),
        x:    20 + Math.random() * 60,
        y:    80,
        size: 2 + Math.random() * 3,
        dur:  1.5 + Math.random() * 1.5,
        dx:   (Math.random() - 0.5) * 30,
      };
      setParticles(prev => [...prev.slice(-15), newParticle]);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* 全体の薄い黄金色glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 60% 60%, rgba(255,200,50,0.06), transparent 70%)",
      }} />
      {/* 粒子 */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: "#FFD700",
          boxShadow: "0 0 4px #FFD700",
          animation: `floatUp${Math.floor(Math.random() * 3)} ${p.dur}s ease-out forwards`,
          transform: `translateX(${p.dx}px)`,
        }} />
      ))}
      <style>{`
        @keyframes floatUp0 { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-60px) translateX(-10px)} }
        @keyframes floatUp1 { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-80px) translateX(15px)} }
        @keyframes floatUp2 { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-50px) translateX(5px)} }
      `}</style>
    </div>
  );
}

export default function RoomEffects({ placedFurniture }) {
  const hasFireplace  = placedFurniture.some(f => f.effect === "fireplace");
  const hasMagicLamp  = placedFurniture.some(f => f.effect === "magic_lamp");

  return (
    <>
      {hasFireplace  && <FireplaceEffect />}
      {hasMagicLamp  && <MagicLampEffect />}
    </>
  );
}