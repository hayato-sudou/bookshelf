"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage("❌ " + error.message);
      } else {
        setMessage("✅ 確認メールを送りました。メールを確認してください。");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("❌ メールアドレスまたはパスワードが違います");
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0703",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Noto Serif JP', Georgia, serif",
    }}>
      <div style={{
        width: 380, background: "#130B05",
        border: "1px solid rgba(196,168,130,0.18)",
        borderRadius: 18, padding: "36px 32px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
      }}>
        {/* ロゴ */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#E8D5B0" }}>わたしの本棚</div>
          <div style={{ fontSize: 12, color: "#6A5A4A", marginTop: 4 }}>読書を、もっと楽しく。</div>
        </div>

        {/* タブ */}
        <div style={{
          display: "flex", gap: 2,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10, padding: 3, marginBottom: 24,
        }}>
          {(["login", "signup"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessage(""); }} style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none",
              background: mode === m ? "rgba(196,168,130,0.18)" : "transparent",
              color: mode === m ? "#E8D5B0" : "#6A5A4A",
              fontSize: 13, fontWeight: mode === m ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: mode === m ? "0 0 0 1px rgba(196,168,130,0.2)" : "none",
              transition: "all 0.18s",
            }}>
              {m === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>

        {/* フォーム */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "#6A5A4A", display: "block",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
              メールアドレス
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(196,168,130,0.18)", borderRadius: 8,
                padding: "10px 12px", color: "#E8D5B0", fontSize: 13,
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"} />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#6A5A4A", display: "block",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
              パスワード
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="6文字以上"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(196,168,130,0.18)", borderRadius: 8,
                padding: "10px 12px", color: "#E8D5B0", fontSize: 13,
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(196,168,130,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(196,168,130,0.18)"} />
          </div>

          {message && (
            <div style={{
              fontSize: 12, padding: "10px 12px", borderRadius: 8,
              background: message.startsWith("✅")
                ? "rgba(107,174,140,0.1)" : "rgba(232,112,112,0.1)",
              color: message.startsWith("✅") ? "#6BAE8C" : "#E87070",
              border: `1px solid ${message.startsWith("✅")
                ? "rgba(107,174,140,0.2)" : "rgba(232,112,112,0.2)"}`,
            }}>
              {message}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "12px",
            background: loading ? "#4A3A2A" : "#C4956A",
            border: "none", borderRadius: 10,
            color: loading ? "#8A7A6A" : "#0D0703",
            fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer",
            fontFamily: "inherit", marginTop: 4,
            transition: "background 0.15s",
          }}>
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウントを作成"}
          </button>
        </div>
      </div>
    </div>
  );
}