import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import {
  fetchOrInitGardenRoom,
  fetchPlacedFurniture,
  purchaseAndPlaceFurniture,
  moveFurniture,
  removeFurniture,
  type PlacedFurniture,
  type GardenRoom,
} from "@/utils/gardenActions";
import type { FurnitureDefinition } from "@/constants/furnitureCatalog";

export type PlacementMode =
  | { type: "idle" }
  | { type: "placing"; furniture: FurnitureDefinition };

interface GardenStore {
  // State
  userId:           string | null;
  coins:            number;
  totalPages:       number;
  placedFurniture:  PlacedFurniture[];
  room:             GardenRoom | null;
  placementMode:    PlacementMode;
  loading:          boolean;
  error:            string | null;

  // Actions
  enterPlacementMode: (furniture: FurnitureDefinition) => void;
  exitPlacementMode:  () => void;
  commitPlacement:    (gridX: number, gridY: number) => Promise<void>;
  movePiece:          (id: string, gridX: number, gridY: number) => Promise<void>;
  removePiece:        (id: string) => Promise<void>;
}

export function useGardenStore(): GardenStore {
  const [userId,          setUserId]          = useState<string | null>(null);
  const [coins,           setCoins]           = useState(0);
  const [totalPages,      setTotalPages]      = useState(0);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [room,            setRoom]            = useState<GardenRoom | null>(null);
  const [placementMode,   setPlacementMode]   = useState<PlacementMode>({ type: "idle" });
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      const [profile, gardenRoom, furniture] = await Promise.all([
        supabase.from("profiles").select("coins").eq("id", uid).single(),
        fetchOrInitGardenRoom(uid),
        fetchPlacedFurniture(uid),
      ]);

      // 累計ページはuser_booksから計算
      const { data: userBooks } = await supabase
        .from("user_books")
        .select("max_page_reached")
        .eq("user_id", uid);

      const total = (userBooks ?? []).reduce(
        (sum, b) => sum + (b.max_page_reached ?? 0), 0
      );

      setCoins(profile.data?.coins ?? 0);
      setTotalPages(total);
      setRoom(gardenRoom);
      setPlacedFurniture(furniture);
      setLoading(false);
    };

    init().catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const enterPlacementMode = useCallback((furniture: FurnitureDefinition) => {
    setPlacementMode({ type: "placing", furniture });
  }, []);

  const exitPlacementMode = useCallback(() => {
    setPlacementMode({ type: "idle" });
  }, []);

  const commitPlacement = useCallback(async (gridX: number, gridY: number) => {
    if (placementMode.type !== "placing" || !userId) return;
    const { furniture } = placementMode;

    if (coins < furniture.coinCost) {
      setError("コインが足りません");
      return;
    }

    try {
      const placed = await purchaseAndPlaceFurniture(
        userId, furniture.id, gridX, gridY, furniture.coinCost
      );
      setPlacedFurniture(prev => [...prev, placed]);
      setCoins(prev => prev - furniture.coinCost);
      setPlacementMode({ type: "idle" });
    } catch (e: any) {
      setError(e.message);
    }
  }, [placementMode, userId, coins]);

  const movePiece = useCallback(async (id: string, gridX: number, gridY: number) => {
    await moveFurniture(id, gridX, gridY);
    setPlacedFurniture(prev =>
      prev.map(f => f.id === id ? { ...f, gridX, gridY } : f)
    );
  }, []);

  const removePiece = useCallback(async (id: string) => {
    await removeFurniture(id);
    setPlacedFurniture(prev => prev.filter(f => f.id !== id));
  }, []);

  return {
    userId, coins, totalPages, placedFurniture, room,
    placementMode, loading, error,
    enterPlacementMode, exitPlacementMode, commitPlacement,
    movePiece, removePiece,
  };
}