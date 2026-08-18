import CustomerRegisterForm from "@/components/auth/CustomerRegisterForm";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your SodaSplash wholesale account.",
  alternates: {
    canonical: "/register",
  }
};

export default function RegisterPage() {
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
        <a href="/">Public website</a>
      </header>
      <section className="login-page">
        <CustomerRegisterForm />
      </section>
    </main>
  );
}
