import OrderEditor from "@/components/quote/OrderEditor";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Order",
  description:
    "Review and edit your B2B wholesale order request details.",
  alternates: {
    canonical: "/orders",
  },
  robots: {
    index: false,
    follow: false,
  },
};

type OrderPageProps = {
  params: Promise<{
    quoteNumber: string;
  }>;
};

export default async function OrderPage({
  params,
}: OrderPageProps) {
  const { quoteNumber } = await params;

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

        <a href="/admin">
          Dashboard
        </a>
      </header>

      <section className="quote-page-section">
        <OrderEditor
          quoteNumber={quoteNumber}
        />
      </section>
    </main>
  );
}