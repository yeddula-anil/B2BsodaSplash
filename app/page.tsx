import Hero3D from "@/components/landing/Hero3D";
import FlavourReveal from "@/components/landing/FlavourReveal";
import HomeSections from "@/components/landing/HomeSections";
import type { Metadata } from "next";
import RoleRedirect from "@/components/auth/roleRedirect";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const GATEWAY_URL = (
  process.env.GATEWAY_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

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
        "Product service error:",
        response.status
      );

      return [];
    }

    const data = await response.json();

    const rawProducts = Array.isArray(data)
      ? data
      : data?.products ||
        data?.data ||
        [];

    return rawProducts
      .filter(
        (product: any) =>
          product.active !== false &&
          product.isActive !== false
      )
      .map((product: any) => ({
        id: String(product.id),
        name: product.name,
        description:
          product.description || null,
        image_url:
          product.imageUrl ||
          product.image_url ||
          null,
        display_order:
          product.displayOrder ??
          product.display_order ??
          1,
        flavours: Array.isArray(product.flavours)
          ? product.flavours
              .filter(
                (flavour: any) =>
                  flavour.active !== false &&
                  flavour.isActive !== false
              )
              .map((flavour: any) => ({
                id: String(flavour.id),
                product_id: String(
                  flavour.productId ??
                    flavour.product_id ??
                    product.id
                ),
                name: flavour.name,
                note: flavour.note || "",
                price_per_case: Number(
                  flavour.pricePerCase ??
                    flavour.price_per_case ??
                    0
                ),
                display_order:
                  flavour.displayOrder ??
                  flavour.display_order ??
                  1,
                color:
                  flavour.color ||
                  "#2e6fb8",
                emoji:
                  flavour.emoji?.trim() ||
                  null,
              }))
              .sort(
                (a: any, b: any) =>
                  a.display_order -
                  b.display_order
              )
          : [],
      }))
      .sort(
        (a: any, b: any) =>
          a.display_order -
          b.display_order
      );
  } catch (error) {
    console.error(
      "Failed to load products:",
      error
    );

    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name":
          "What is the minimum case size for wholesale orders?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "The minimum order size is 1 case per selected flavour. Final pricing and logistics are confirmed during our verification call."
        }
      },
      {
        "@type": "Question",
        "name":
          "What is the process for placing a wholesale request?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "1. Submit your B2B request online by choosing your flavours and case quantities. 2. Our sales team will call you to confirm product availability and delivery scheduling. 3. Track order fulfillment using your private quote number and email."
        }
      },
      {
        "@type": "Question",
        "name":
          "Is online payment required when requesting a quote?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":
            "No, online payment is not required at the time of submission. All transactions, special business rates, and payments are confirmed offline via our call."
        }
      }
    ]
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": products.length,
    "itemListElement": products.map(
      (prod: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": prod.name,
          "description":
            prod.description ||
            "Classic premium marble soda bottles supplied by the case.",
          "brand": {
            "@type": "Brand",
            "name": "SodaSplash"
          },
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "INR",
            "priceSpecification": {
              "@type":
                "UnitPriceSpecification",
              "priceCurrency": "INR",
              "referenceQuantity": {
                "@type":
                  "QuantitativeValue",
                "value": 1,
                "unitCode": "C62"
              }
            }
          }
        }
      })
    )
  };

  return (
    <>
      <RoleRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(faqSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(productSchema),
        }}
      />

      <main>
        <Hero3D />

        <FlavourReveal
          initialProducts={products}
        />

        <HomeSections />
      </main>
    </>
  );
}
