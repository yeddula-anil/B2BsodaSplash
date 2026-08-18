"use client";

import { useEffect, useState } from "react";

export default function AuthNav() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("customer_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        // ignore parse error
      }
    }
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    window.localStorage.removeItem("customer_user");
    window.localStorage.removeItem("jwt");
    window.localStorage.removeItem("name");
    window.localStorage.removeItem("email");
    setUser(null);
    window.location.reload();
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  if (user) {
    return (
      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <a className="track-link" href="/track">Track Order</a>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingLeft: "24px", borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
          <span style={{ fontSize: "13px", color: "var(--cream)" }}>{user.name || user.email}</span>
          <a 
            href="#" 
            onClick={handleLogout}
            style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--coral)", opacity: 0.8, transition: "0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}
          >
            Logout
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
      <a className="track-link" href="/track">Track Order</a>
      <a 
        className="button primary" 
        href="/login" 
        style={{ height: "36px", padding: "0 18px", fontSize: "10px" }}
      >
        Login
      </a>
    </div>
  );
}
