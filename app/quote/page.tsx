import QuoteRequestForm from "@/components/quote/QuoteRequestForm";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Request a wholesale B2B quote for SodaSplash cases. Choose your products and flavours.",
  alternates: {
    canonical: "/quote",
  },
};

const GATEWAY_URL = (
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

/* =========================
   PRODUCTS
========================= */

async function getProducts() {
  try {
    const response = await fetch(
      `${GATEWAY_URL}/api/products`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch products:",
        response.status
      );
      return [];
    }

    const data = await response.json();

    const products = Array.isArray(data)
      ? data
      : data?.data ||
        data?.products ||
        [];

    return products
      .filter(
        (product: any) =>
          product.isActive !== false &&
          product.active !== false
      )
      .map((product: any) => ({
        id: String(product.id),

        name: product.name,

        description:
          product.description || "",

        image_url:
          product.imageUrl ||
          product.image_url ||
          null,

        display_order:
          product.displayOrder ?? 0,

        flavours: Array.isArray(
          product.flavours
        )
          ? product.flavours
              .filter(
                (flavour: any) =>
                  flavour.isActive !== false &&
                  flavour.active !== false
              )
              .map((flavour: any) => ({
                id: String(flavour.id),

                product_id: String(
                  flavour.productId ??
                    product.id
                ),

                name: flavour.name,

                note:
                  flavour.note || "",

                price_per_case: Number(
                  flavour.pricePerCase ??
                    flavour.price_per_case ??
                    0
                ),

                color:
                  flavour.color ||
                  "#2e6fb8",

                display_order:
                  flavour.displayOrder ??
                  0,

                emoji:
                  flavour.emoji || null,
              }))
          : [],
      }));
  } catch (error) {
    console.error(
      "Product service error:",
      error
    );

    return [];
  }
}

/* =========================
   BDs / SALESPERSONS
========================= */

async function getBDs() {
  try {
    const response = await fetch(
      `${GATEWAY_URL}/api/auth/users/bd`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch BDs:",
        response.status
      );

      return [];
    }

    const data = await response.json();

    console.log(
      "BD SERVICE RESPONSE:",
      data
    );

    const users = Array.isArray(data)
      ? data
      : data?.data ||
        data?.users ||
        [];

    /*
     * Backend:
     *
     * UserResponse(
     *   Long id,
     *   String username,
     *   String email,
     *   Role role,
     *   boolean isActive
     * )
     *
     * Frontend expects:
     *
     * {
     *   id,
     *   name,
     *   email
     * }
     */

    return users
      .filter(
        (user: any) =>
          user.isActive !== false &&
          user.active !== false
      )
      .map((user: any) => ({
        id: String(user.id),

        name:
          user.username ||
          user.name ||
          user.email ||
          `BD-${user.id}`,

        email:
          user.email || "",
      }));
  } catch (error) {
    console.error(
      "Auth service error:",
      error
    );

    return [];
  }
}

/* =========================
   PAGE
========================= */

export default async function QuotePage() {
  const [products, team] =
    await Promise.all([
      getProducts(),
      getBDs(),
    ]);

  console.log(
    "QUOTE PAGE PRODUCTS:",
    products
  );

  console.log(
    "QUOTE PAGE BDs:",
    team
  );

  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={62}
            height={62}
            priority
          />
        </a>

        <a href="/track">
          Track an order
        </a>
      </header>

      <section className="quote-page-section">
        <div className="quote-back-container">
          <a
            href="/"
            className="back-link-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--splash)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              opacity: 0.85,
              transition:
                "opacity 0.2s",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line
                x1="19"
                y1="12"
                x2="5"
                y2="12"
              />

              <polyline points="12 19 5 12 12 5" />
            </svg>

            Back to Home
          </a>
        </div>

        <QuoteRequestForm
          initialProducts={products}
          initialTeam={team}
        />
      </section>
    </main>
  );
}
