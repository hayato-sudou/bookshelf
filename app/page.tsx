"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
const BookshelfDashboard = require("@/components/BookshelfDashboard").default;

export default function Home() {
  const router  = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setChecked(true);
        return;
      }

      // 開発環境のみ自動ログイン
      if (process.env.NEXT_PUBLIC_TEST_EMAIL) {
        await supabase.auth.signInWithPassword({
          email:    process.env.NEXT_PUBLIC_TEST_EMAIL!,
          password: process.env.NEXT_PUBLIC_TEST_PASSWORD!,
        });
        setChecked(true);
      } else {
        router.push("/auth");
      }
    };
    init();
  }, [router]);

  if (!checked) {
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

  return <BookshelfDashboard />;
}
