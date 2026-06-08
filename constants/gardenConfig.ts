export const GRID_COLS = 20;
export const GRID_ROWS = 10;
export const CELL_SIZE = 32; // px

export const ROOM_WIDTH  = GRID_COLS * CELL_SIZE; // 640px
export const ROOM_HEIGHT = GRID_ROWS * CELL_SIZE; // 320px

export const WINDOW_PHASES = [
  {
    id:        "dawn",
    label:     "朝",
    minPages:  0,
    bgGradient:"linear-gradient(180deg, #87CEEB 0%, #FFF4B8 60%, #FFD580 100%)",
    particleColor: "#FFE87A",
  },
  {
    id:        "dusk",
    label:     "夕方",
    minPages:  500,
    bgGradient:"linear-gradient(180deg, #FF6B6B 0%, #FF9F43 40%, #FFC96F 100%)",
    particleColor: "#FF9F43",
  },
  {
    id:        "night",
    label:     "夜",
    minPages:  1500,
    bgGradient:"linear-gradient(180deg, #0D0221 0%, #1a0533 50%, #2D1B69 100%)",
    particleColor: "#E8D5FF",
    hasStars:   true,
    hasAurora:  true,
  },
  {
    id:        "dawn2",
    label:     "次の朝",
    minPages:  3000,
    bgGradient:"linear-gradient(180deg, #B5E8FF 0%, #FFE4B5 60%, #FFAA5C 100%)",
    particleColor: "#FFD580",
  },
] as const;

export type WindowPhaseId = typeof WINDOW_PHASES[number]["id"];