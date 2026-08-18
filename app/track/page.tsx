import TrackAuthGate from "@/components/auth/TrackAuthGate";
import CustomerLoginForm from "@/components/auth/CustomerLoginForm";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Orders",
  description:
    "Track the fulfillment status of your SodaSplash wholesale orders.",
  alternates: {
    canonical: "/track",
  },
};

export default function TrackPage() {
  return (
    <main className="portal-page track-page">
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

        <a href="/quote">
          Request a quote
        </a>
      </header>

      <section className="tracking-page">
        <TrackAuthGate
          fallback={
            <CustomerLoginForm />
          }
        />
      </section>
    </main>
  );
}