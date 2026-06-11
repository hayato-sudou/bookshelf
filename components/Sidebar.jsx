"use client";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: "📚", label: "本棚",  href: "/" },
    { icon: "⚙️", label: "設定",  href: "/settings" },
  ];

  return (
    <aside
      aria-label="サイドバー"
      style={{
        width: 64,
        background: "rgba(10,6,3,0.8)",
        borderRight: "1px solid rgba(196,168,130,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        gap: 8,
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: "none",
              background: active ? "rgba(196,168,130,0.15)" : "transparent",
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
              boxShadow: active ? "0 0 0 1px rgba(196,168,130,0.2)" : "none",
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.background = "rgba(196,168,130,0.08)";
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            {item.icon}
          </button>
        );
      })}
    </aside>
  );
}
