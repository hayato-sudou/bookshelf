import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google Books API の表紙画像
      {
        protocol: "https",
        hostname: "books.google.com",
        pathname: "/books/content/**",
      },
      // Supabase Storage（将来的に画像アップロードする場合）
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;