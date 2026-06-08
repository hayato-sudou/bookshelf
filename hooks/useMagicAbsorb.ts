import { useState, useEffect, useRef } from "react";

interface AbsorbState {
  isPlaying:     boolean;
  displayCoins:  number; // アニメーション中の表示値
  particles:     Particle[];
}

interface Particle {
  id:     number;
  x:      number;
  y:      number;
  emoji:  string;
}

// ダッシュボードから渡ってくる「新規獲得コイン数」を受け取り演出を管理
export function useMagicAbsorb(
  baseCoins:    number,
  pendingCoins: number, // 今回新たに吸収するコイン数
  onComplete:   () => void,
) {
  const [state, setState] = useState<AbsorbState>({
    isPlaying:    false,
    displayCoins: baseCoins,
    particles:    [],
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pendingCoins <= 0) return;

    const totalSteps  = Math.min(pendingCoins, 60); // 最大60フレームに圧縮
    const coinsPerStep = pendingCoins / totalSteps;
    let step = 0;

    setState(prev => ({ ...prev, isPlaying: true }));

    intervalRef.current = setInterval(() => {
      step++;
      const addedThisStep = Math.round(coinsPerStep * step) - Math.round(coinsPerStep * (step - 1));

      setState(prev => {
        const newParticles: Particle[] = Array.from({ length: addedThisStep > 5 ? 3 : 1 }, (_, i) => ({
          id:    Date.now() + i,
          x:     20 + Math.random() * 60,
          y:     30 + Math.random() * 40,
          emoji: Math.random() > 0.5 ? "🪙" : "✨",
        }));

        return {
          isPlaying:    true,
          displayCoins: prev.displayCoins + addedThisStep,
          particles:    [...prev.particles, ...newParticles].slice(-20), // 最大20パーティクル
        };
      });

      if (step >= totalSteps) {
        clearInterval(intervalRef.current!);
        setState(prev => ({ ...prev, isPlaying: false, particles: [] }));
        onComplete();
      }
    }, 800 / totalSteps); // 合計0.8秒で完了

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pendingCoins]); // eslint-disable-line

  return state;
}