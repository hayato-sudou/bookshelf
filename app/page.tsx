"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push("/dashboard");
        return;
      }

      // 開発環境のみ自動ログイン
      if (process.env.NEXT_PUBLIC_TEST_EMAIL) {
        await supabase.auth.signInWithPassword({
          email: process.env.NEXT_PUBLIC_TEST_EMAIL!,
          password: process.env.NEXT_PUBLIC_TEST_PASSWORD!,
        });
        router.push("/dashboard");
      } else {
        router.push("/auth");
      }
    };
    init();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0703",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#6A5A4A", fontFamily: "serif", fontSize: 14,
    }}>
      ログイン中...
    </div>
  );
}