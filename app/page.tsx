// import BookshelfDashboard from "@/components/BookshelfDashboard";

// export default function Home() {
//   return <BookshelfDashboard />;
// }

// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const [status, setStatus] = useState("確認中...");

  useEffect(() => {
    supabase.from("books").select("count").then(({ error }) => {
      setStatus(error ? "❌ 接続失敗: " + error.message : "✅ Supabase接続成功！");
    });
  }, []);

  return (
    <div style={{ padding: 40, color: "white", background: "#0D0703", minHeight: "100vh" }}>
      <h1>{status}</h1>
    </div>
  );
}