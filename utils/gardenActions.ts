import { supabase } from "./supabase";
import type { FurnitureEffect } from "@/constants/furnitureCatalog";

export interface PlacedFurniture {
  id:         string; // garden_furniture.id (UUID)
  catalogId:  string;
  gridX:      number;
  gridY:      number;
  effect:     FurnitureEffect;
  cssClass:   string;
  gridW:      number;
  gridH:      number;
  imageUrl:   string | null;
  name:       string;
}

export interface GardenRoom {
  userId:              string;
  totalPagesAtSave:    number;
  unlockedFurnitureIds: string[];
}

// ── 部屋の状態を取得（なければ初期化） ───────────────────────
export async function fetchOrInitGardenRoom(userId: string): Promise<GardenRoom> {
  const { data, error } = await supabase
    .from("garden_rooms")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // レコードなし → 初期化
    const initial = {
      user_id:               userId,
      total_pages_at_save:   0,
      unlocked_furniture_ids: [],
    };
    const { data: created, error: insertError } = await supabase
      .from("garden_rooms")
      .insert(initial)
      .select()
      .single();
    if (insertError) throw insertError;
    return mapRoom(created);
  }

  if (error) throw error;
  return mapRoom(data);
}

// ── 配置済み家具を取得 ────────────────────────────────────────
export async function fetchPlacedFurniture(userId: string): Promise<PlacedFurniture[]> {
  const { data, error } = await supabase
    .from("garden_furniture")
    .select("*, catalog:furniture_catalog(*)")
    .eq("user_id", userId)
    .order("placed_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapPlaced);
}

// ── 家具を購入して配置 ────────────────────────────────────────
export async function purchaseAndPlaceFurniture(
  userId:    string,
  catalogId: string,
  gridX:     number,
  gridY:     number,
  coinCost:  number,
): Promise<PlacedFurniture> {
  // トランザクション相当：RPC で atomic に処理
  const { data, error } = await supabase.rpc("purchase_and_place_furniture", {
    p_user_id:   userId,
    p_catalog_id: catalogId,
    p_grid_x:    gridX,
    p_grid_y:    gridY,
    p_coin_cost: coinCost,
  });

  if (error) throw error;
  return mapPlaced(data);
}

// ── 家具の位置を更新（ドラッグ後） ───────────────────────────
export async function moveFurniture(
  furnitureId: string,
  gridX:       number,
  gridY:       number,
): Promise<void> {
  const { error } = await supabase
    .from("garden_furniture")
    .update({ grid_x: gridX, grid_y: gridY })
    .eq("id", furnitureId);

  if (error) throw error;
}

// ── 家具を撤去 ────────────────────────────────────────────────
export async function removeFurniture(furnitureId: string): Promise<void> {
  const { error } = await supabase
    .from("garden_furniture")
    .delete()
    .eq("id", furnitureId);

  if (error) throw error;
}

// ── マッピング ────────────────────────────────────────────────
function mapRoom(row: any): GardenRoom {
  return {
    userId:               row.user_id,
    totalPagesAtSave:     row.total_pages_at_save ?? 0,
    unlockedFurnitureIds: row.unlocked_furniture_ids ?? [],
  };
}

function mapPlaced(row: any): PlacedFurniture {
  const catalog = row.catalog ?? {};
  return {
    id:        row.id,
    catalogId: row.catalog_id,
    gridX:     row.grid_x,
    gridY:     row.grid_y,
    effect:    catalog.effect      ?? null,
    cssClass:  catalog.css_class   ?? "",
    gridW:     catalog.grid_w      ?? 1,
    gridH:     catalog.grid_h      ?? 1,
    imageUrl:  catalog.image_url   ?? null,
    name:      catalog.name        ?? "",
  };
}