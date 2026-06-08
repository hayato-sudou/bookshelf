"use client";
import { useEffect, useState } from "react";
import { useRouter }            from "next/navigation";
import { supabase }             from "@/utils/supabase";
import { useGardenStore }       from "@/hooks/useGardenStore";
import GardenView               from "@/components/garden/GardenView";
import ShopModal                from "@/components/garden/ShopModal";
import MagicAbsorbAnimation     from "@/components/garden/MagicAbsorbAnimation";
import type { FurnitureDefinition } from "@/constants/furnitureCatalog";

export default function GardenPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // 遷移時ペンディングコイン（ダッシュボードからsessionStorageで受け渡し）
  const [pendingCoins, setPendingCoins] = useState(0);
  const [absorbDone,   setAbsorbDone]   = useState(false);

  const [showShop, setShowShop] = useState(false);

  const store = useGardenStore();

  // 認証チェック
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/auth"); return; }
      setAuthChecked(true);
    });
  }, [router]);

  // ダッシュボードからの pending コイン受け取り
  useEffect(() => {
    const pending = Number(sessionStorage.getItem("pendingGardenCoins") ?? 0);
    if (pending > 0) {
      setPendingCoins(pending);
      sessionStorage.removeItem("pendingGardenCoins");
    } else {
      setAbsorbDone(true); // ペンディングなしはすぐ完了扱い
    }
  }, []);

  const handleShopBuy = (item: FurnitureDefinition) => {
    setShowShop(false);
    store.enterPlacementMode(item);
  };

  const handleCellClick = (gridX: number, gridY: number) => {
    store.commitPlacement(gridX, gridY);
  };

  if (!authChecked || store.loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0D0703",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#6A5A4A", fontFamily: "serif",
      }}>
        ✨ 魔法の部屋を準備中...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0703",
      fontFamily: "'Noto Serif JP', Georgia, serif",
      color: "#E8D5B0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(196,168,130,0.2); border-radius: 2px; }
      `}</style>

      {/* 魔力吸い上げ演出 */}
      {!absorbDone && (
        <MagicAbsorbAnimation
          baseCoins={store.coins - pendingCoins}
          pendingCoins={pendingCoins}
          onComplete={() => setAbsorbDone(true)}
        />
      )}

      {/* ヘッダー */}
      <header style={{
        padding: "16px 28px", display: "flex", alignItems: "center", gap: 16,
        borderBottom: "1px solid rgba(196,168,130,0.08)",
        background: "rgba(10,6,3,0.8)", backdropFilter: "blur(10px)",
      }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "none", border: "1px solid rgba(196,168,130,0.2)",
            borderRadius: 8, color: "#6A5A4A", padding: "6px 14px",
            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}
        >← 本棚へ戻る</button>

        <div style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>🏡 魔法の部屋</div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(196,168,130,0.1)",
          border: "1px solid rgba(196,168,130,0.2)",
          borderRadius: 20, padding: "6px 14px",
        }}>
          <span>🪙</span>
          <span style={{ fontWeight: 700, color: "#C4A882" }}>{store.coins}</span>
        </div>

        <button
          onClick={() => setShowShop(true)}
          style={{
            padding: "8px 18px", background: "#C4956A", border: "none",
            borderRadius: 10, color: "#1A0F08", fontWeight: 700,
            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >🏪 ショップ</button>
      </header>

      {/* 配置モードバナー */}
      {store.placementMode.type === "placing" && (
        <div style={{
          background: "rgba(107,174,140,0.15)", borderBottom: "1px solid rgba(107,174,140,0.3)",
          padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "#6BAE8C" }}>
            ✦ 配置する場所をクリックしてください：
            <strong style={{ marginLeft: 8 }}>{store.placementMode.furniture.name}</strong>
          </span>
          <button
            onClick={store.exitPlacementMode}
            style={{
              background: "none", border: "1px solid rgba(107,174,140,0.4)",
              borderRadius: 8, color: "#6BAE8C", padding: "4px 12px",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}
          >キャンセル</button>
        </div>
      )}

      {/* メイン */}
      <main style={{ padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <GardenView
          totalPages={store.totalPages}
          placedFurniture={store.placedFurniture}
          placementMode={store.placementMode}
          onCellClick={handleCellClick}
          onMove={store.movePiece}
        />

        {store.error && (
          <div style={{ marginTop: 16, fontSize: 12, color: "#E87070",
            background: "rgba(232,112,112,0.1)", borderRadius: 8, padding: "8px 16px" }}>
            ⚠ {store.error}
          </div>
        )}
      </main>

      {showShop && (
        <ShopModal
          coins={store.coins}
          totalPages={store.totalPages}
          onClose={() => setShowShop(false)}
          onBuy={handleShopBuy}
        />
      )}
    </div>
  );
}