/** @type {import('next').NextConfig} */
const portalHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=()" },
];

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      { source: "/portal", headers: portalHeaders },
      { source: "/portal/:path*", headers: portalHeaders },
      { source: "/api/portal/:path*", headers: portalHeaders },
    ];
  },
};

export default nextConfig;
