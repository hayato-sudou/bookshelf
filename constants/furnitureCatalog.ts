// ── アセット差し替えポイント ──────────────────────────────
// imageUrl を設定すると CSS描画からスプライト画像に自動切り替わります
// imageUrl: null → CSS Box-Shadow ドット絵でフォールバック描画

export type FurnitureEffect = "fireplace" | "magic_lamp" | null;

export interface FurnitureDefinition {
  id:           string;
  name:         string;
  description:  string;
  coinCost:     number;
  gridW:        number; // 占有グリッド幅
  gridH:        number; // 占有グリッド高さ
  category:     "furniture" | "decoration" | "magic";
  imageUrl:     string | null; // null → CSSフォールバック
  cssClass:     string;        // CSS描画クラス名
  effect:       FurnitureEffect;
  unlockPages:  number;        // 解放に必要な累計ページ数
}

export const FURNITURE_CATALOG: FurnitureDefinition[] = [
  {
    id:          "desk_chair_set",
    name:        "木製デスク＆チェア",
    description: "小さなノートとインク瓶が乗った、魔法使いの勉強机。",
    coinCost:    10,
    gridW:       3,
    gridH:       2,
    category:    "furniture",
    imageUrl:    null,
    cssClass:    "furniture--desk-chair",
    effect:      null,
    unlockPages: 0,
  },
  {
    id:          "fireplace",
    name:        "レトロな暖炉",
    description: "炎がパチパチと揺れ、部屋を温かく照らす。",
    coinCost:    25,
    gridW:       3,
    gridH:       3,
    category:    "magic",
    imageUrl:    null,
    cssClass:    "furniture--fireplace",
    effect:      "fireplace",
    unlockPages: 300,
  },
  {
    id:          "magic_lamp",
    name:        "魔法のランプ",
    description: "灯すと光の粒子が部屋中に舞い上がる。",
    coinCost:    20,
    gridW:       2,
    gridH:       2,
    category:    "magic",
    imageUrl:    null,
    cssClass:    "furniture--magic-lamp",
    effect:      "magic_lamp",
    unlockPages: 100,
  },
  {
    id:          "bookshelf",
    name:        "古びた本棚",
    description: "読んだ本が少しずつ並んでいく。",
    coinCost:    15,
    gridW:       2,
    gridH:       3,
    category:    "furniture",
    imageUrl:    null,
    cssClass:    "furniture--bookshelf",
    effect:      null,
    unlockPages: 200,
  },
];