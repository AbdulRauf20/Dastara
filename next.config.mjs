/** @type {import('next').NextConfig} */

// Derive the Supabase hostname so next/image can optimize Supabase Storage URLs.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname;
try {
  if (supabaseUrl) supabaseHostname = new URL(supabaseUrl).hostname;
} catch {
  supabaseHostname = undefined;
}

const remotePatterns = [
  // Supabase Storage (public product images)
  {
    protocol: "https",
    hostname: supabaseHostname ?? "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Server Actions are enabled by default in Next 15; keep body size sane for uploads.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
