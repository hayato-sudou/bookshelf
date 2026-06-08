import { useMemo } from "react";
import { WINDOW_PHASES } from "@/constants/gardenConfig";

export function useWindowPhase(totalPages: number) {
  return useMemo(() => {
    // 後ろから走査して最初にminPages以下になった要素を返す
    for (let i = WINDOW_PHASES.length - 1; i >= 0; i--) {
      if (totalPages >= WINDOW_PHASES[i].minPages) {
        return WINDOW_PHASES[i];
      }
    }
    return WINDOW_PHASES[0];
  }, [totalPages]);
}