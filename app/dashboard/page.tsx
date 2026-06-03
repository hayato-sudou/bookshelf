"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
const BookshelfDashboard = require("@/components/BookshelfDashboard").default;

export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
      } else {
        setChecked(true);
      }
    });
  }, [router]);

  if (!checked) return (
    <div style={{
      minHeight: "100vh", background: "#0D0703",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#6A5A4A", fontFamily: "serif", fontSize: 14,
    }}>
      読み込み中...
    </div>
  );

  return <BookshelfDashboard />;
}