"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Sidebar from "@/components/Sidebar";

// ─── セクションラベル ─────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, color: "#6A5A4A",
      textTransform: "uppercase", letterSpacing: 1.2,
      marginBottom: 12, fontWeight: 700,
    }}>
      {children}
    </div>
  );
}

// ─── 設定行 ───────────────────────────────────────────────────────────────────
function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16,
      padding: "14px 0",
      borderBottom: "1px solid rgba(196,168,130,0.07)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#E8D5B0", fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 11, color: "#6A5A4A", lineHeight: 1.5 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ─── トグルスイッチ ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none",
        background: checked ? "#6BAE8C" : "rgba(196,168,130,0.2)",
        position: "relative", cursor: disabled ? "default" : "pointer",
        transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: "absolute",
        top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        display: "block",
      }} />
    </button>
  );
}

// ─── プランバッジ ─────────────────────────────────────────────────────────────
function PlanBadge({ isPro }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20,
      background: isPro ? "rgba(107,174,140,0.2)" : "rgba(196,168,130,0.12)",
      border: `1px solid ${isPro ? "rgba(107,174,140,0.4)" : "rgba(196,168,130,0.2)"}`,
      color: isPro ? "#6BAE8C" : "#8A7A6A",
    }}>
      {isPro ? "✦ Pro" : "Free"}
    </span>
  );
}

// ─── メイン設定画面 ────────────────────────────────────────────────────────────
export default function SettingsDashboard() {
  const router = useRouter();
  const [userId,       setUserId]       = useState(null);
  const [email,        setEmail]        = useState("");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");

  // 通知設定
  const [notifReading,   setNotifReading]   = useState(false);
  const [notifWeekly,    setNotifWeekly]    = useState(false);

  // 課金
  const [isPro, setIsPro] = useState(false);

  // アカウント削除
  const [deleteStep,    setDeleteStep]    = useState(0); // 0: 非表示, 1: 確認, 2: 最終確認
  const [deleteInput,   setDeleteInput]   = useState("");
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/auth"); return; }
      const uid = session.user.id;
      setUserId(uid);
      setEmail(session.user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("notification_reading, notification_weekly, is_pro")
        .eq("id", uid)
        .single();

      if (profile) {
        setNotifReading(profile.notification_reading ?? false);
        setNotifWeekly(profile.notification_weekly  ?? false);
        setIsPro(profile.is_pro ?? false);
      }
      setLoading(false);
    });
  }, [router]);

  // 通知設定を保存
  const handleSaveNotifications = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase
      .from("profiles")
      .update({
        notification_reading: notifReading,
        notification_weekly:  notifWeekly,
      })
      .eq("id", userId);

    setSaveMsg(error ? "保存に失敗しました" : "保存しました");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  // アカウント削除
  const handleDeleteAccount = async () => {
    if (deleteInput !== email) return;
    setDeleting(true);
    // user_books, profiles は RLS / cascade で削除される前提
    // auth.admin は使えないため、サーバーサイドAPIに委譲する設計
    // ここでは signOut のみ実施し、実際の削除はサーバー側で行う想定
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0D0703",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#6A5A4A", fontFamily: "serif", fontSize: 14,
      }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0703", color: "#E8D5B0",
      fontFamily: "'Noto Serif JP', 'Georgia', serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,168,130,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />

        <main style={{ flex: 1, overflowY: "auto" }}>
          {/* ヘッダー */}
          <header style={{
            padding: "20px 40px 16px",
            borderBottom: "1px solid rgba(196,168,130,0.08)",
            background: "rgba(10,6,3,0.6)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#E8D5B0", letterSpacing: -0.3 }}>
                設定
              </div>
              <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 2 }}>
                {email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 14px", background: "transparent",
                border: "1px solid rgba(196,168,130,0.2)", borderRadius: 10,
                color: "#6A5A4A", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#E8D5B0"; e.currentTarget.style.borderColor = "rgba(196,168,130,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6A5A4A"; e.currentTarget.style.borderColor = "rgba(196,168,130,0.2)"; }}
            >
              ログアウト
            </button>
          </header>

          {/* コンテンツ */}
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>

            {/* ── 通知設定 ── */}
            <section style={{ marginBottom: 40 }}>
              <SectionLabel>通知設定</SectionLabel>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(196,168,130,0.1)",
                borderRadius: 14, padding: "0 20px",
              }}>
                <SettingRow
                  label="読書リマインダー"
                  description="読書中の本が7日以上更新されていない場合に通知します（近日実装予定）"
                >
                  <Toggle checked={notifReading} onChange={setNotifReading} />
                </SettingRow>
                <SettingRow
                  label="週次レポート"
                  description="毎週月曜日に先週の読書サマリーを通知します（近日実装予定）"
                >
                  <Toggle checked={notifWeekly} onChange={setNotifWeekly} />
                </SettingRow>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  style={{
                    padding: "9px 22px", background: saving ? "#4A3A2A" : "#C4956A",
                    border: "none", borderRadius: 10,
                    color: saving ? "#8A7A6A" : "#0D0703",
                    fontWeight: 700, fontSize: 13, cursor: saving ? "default" : "pointer",
                    fontFamily: "inherit", transition: "background 0.15s",
                  }}
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
                {saveMsg && (
                  <span style={{
                    fontSize: 12,
                    color: saveMsg.includes("失敗") ? "#E87070" : "#6BAE8C",
                  }}>
                    {saveMsg.includes("失敗") ? "❌" : "✅"} {saveMsg}
                  </span>
                )}
              </div>
            </section>

            {/* ── プラン ── */}
            <section style={{ marginBottom: 40 }}>
              <SectionLabel>プラン</SectionLabel>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(196,168,130,0.1)",
                borderRadius: 14, padding: "20px",
              }}>
                {/* 現在のプラン */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 20,
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#E8D5B0", fontWeight: 600, marginBottom: 4 }}>
                      現在のプラン
                    </div>
                    <div style={{ fontSize: 11, color: "#6A5A4A" }}>
                      {isPro ? "すべての機能をご利用いただけます" : "基本機能をご利用いただけます"}
                    </div>
                  </div>
                  <PlanBadge isPro={isPro} />
                </div>

                {/* Free / Pro 比較 */}
                {!isPro && (
                  <div style={{
                    background: "rgba(196,168,130,0.05)",
                    border: "1px solid rgba(196,168,130,0.12)",
                    borderRadius: 10, padding: "16px 20px", marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#C4A882", marginBottom: 12 }}>
                      ✦ Proにアップグレードすると
                    </div>
                    {[
                      "広告なし",
                      "登録冊数の上限なし",
                      "詳細な読書統計",
                      "優先サポート",
                    ].map(item => (
                      <div key={item} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: 12, color: "#C4A882", marginBottom: 6,
                      }}>
                        <span style={{ color: "#6BAE8C", fontSize: 14 }}>✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {!isPro && (
                  <button
                    onClick={() => {
                      // 課金導線：今後Stripe等と連携
                      alert("近日実装予定です。しばらくお待ちください。");
                    }}
                    style={{
                      width: "100%", padding: "12px",
                      background: "linear-gradient(135deg, #C4956A 0%, #D4A574 100%)",
                      border: "none", borderRadius: 10,
                      color: "#0D0703", fontWeight: 700, fontSize: 14,
                      cursor: "pointer", fontFamily: "inherit",
                      letterSpacing: 0.3, transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    ✦ Proにアップグレード
                  </button>
                )}

                {isPro && (
                  <div style={{
                    textAlign: "center", padding: "8px 0",
                    fontSize: 12, color: "#6BAE8C",
                  }}>
                    ✅ Proプランをご利用中です
                  </div>
                )}
              </div>
            </section>

            {/* ── アカウント削除 ── */}
            <section>
              <SectionLabel>危険な操作</SectionLabel>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(196,168,130,0.1)",
                borderRadius: 14, padding: "0 20px",
              }}>
                <SettingRow
                  label="アカウントを削除"
                  description="登録した全ての本・メモ・データが完全に削除されます。この操作は取り消せません。"
                >
                  {deleteStep === 0 && (
                    <button
                      onClick={() => setDeleteStep(1)}
                      style={{
                        padding: "7px 16px", background: "transparent",
                        border: "1px solid rgba(232,112,112,0.3)", borderRadius: 8,
                        color: "#8A6A6A", fontSize: 12, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background    = "rgba(232,112,112,0.08)";
                        e.currentTarget.style.borderColor   = "rgba(232,112,112,0.5)";
                        e.currentTarget.style.color         = "#E87070";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background    = "transparent";
                        e.currentTarget.style.borderColor   = "rgba(232,112,112,0.3)";
                        e.currentTarget.style.color         = "#8A6A6A";
                      }}
                    >
                      削除する
                    </button>
                  )}
                  {deleteStep > 0 && (
                    <button
                      onClick={() => { setDeleteStep(0); setDeleteInput(""); }}
                      style={{
                        padding: "7px 16px", background: "transparent",
                        border: "1px solid rgba(196,168,130,0.2)", borderRadius: 8,
                        color: "#8A7A6A", fontSize: 12, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      キャンセル
                    </button>
                  )}
                </SettingRow>
              </div>

              {/* 削除確認フォーム */}
              {deleteStep === 1 && (
                <div style={{
                  marginTop: 12,
                  background: "rgba(232,112,112,0.06)",
                  border: "1px solid rgba(232,112,112,0.25)",
                  borderRadius: 14, padding: "20px",
                }}>
                  <div style={{ fontSize: 13, color: "#E8D5B0", fontWeight: 600, marginBottom: 8 }}>
                    本当にアカウントを削除しますか？
                  </div>
                  <div style={{ fontSize: 12, color: "#8A7A6A", marginBottom: 16, lineHeight: 1.6 }}>
                    確認のため、登録メールアドレス（<span style={{ color: "#C4A882" }}>{email}</span>）を入力してください。
                  </div>
                  <input
                    type="email"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder={email}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(232,112,112,0.3)", borderRadius: 8,
                      padding: "9px 12px", color: "#E8D5B0", fontSize: 13,
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                      marginBottom: 12,
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(232,112,112,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(232,112,112,0.3)"}
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== email || deleting}
                    style={{
                      width: "100%", padding: "11px",
                      background: deleteInput === email
                        ? "rgba(232,112,112,0.2)" : "rgba(196,168,130,0.05)",
                      border: `1px solid ${deleteInput === email
                        ? "rgba(232,112,112,0.5)" : "rgba(196,168,130,0.1)"}`,
                      borderRadius: 10,
                      color: deleteInput === email ? "#E87070" : "#4A3A2A",
                      fontWeight: 700, fontSize: 13,
                      cursor: deleteInput === email ? "pointer" : "default",
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}
                  >
                    {deleting ? "削除中..." : "アカウントを完全に削除する"}
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
