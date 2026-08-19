/** @type {import('next').NextConfig} */
const configuredGateway =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.NEXT_API_GATEWAY_URL ||
  process.env.GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_GATEWAY_URL;

const gatewayOrigin = configuredGateway
  ?.replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

const gatewayApiUrl =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  (gatewayOrigin ? `${gatewayOrigin}/api` : undefined);

const nextConfig = {
  compress: true,
  images: { formats: ["image/avif", "image/webp"] },
  env: {
    // NEXT_API_GATEWAY_URL is supported as a legacy deployment variable, but
    // browser bundles can only read variables prefixed with NEXT_PUBLIC_.
    NEXT_PUBLIC_GATEWAY_URL: gatewayOrigin,
    NEXT_PUBLIC_API_GATEWAY_URL: gatewayApiUrl,
    NEXT_PUBLIC_AUTH_SERVICE_URL:
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || gatewayApiUrl,
    NEXT_PUBLIC_PRODUCT_SERVICE_URL:
      process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || gatewayApiUrl,
    NEXT_PUBLIC_ORDER_SERVICE_URL:
      process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || gatewayApiUrl
  },

  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      },
      {
        source: "/draco/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      },
      {
        source: "/favicon.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
