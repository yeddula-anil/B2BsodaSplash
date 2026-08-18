"use client";

import { useEffect } from "react";

function decodePayload(token: string) {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Missing JWT payload");
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
}

export default function OAuthSuccessPage() {
  useEffect(() => {
    try {
      const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
      if (!token) throw new Error("Missing login token");
      const payload = decodePayload(token);
      const session = { id: String(payload.sub), name: payload.username || "", email: payload.email || "", token, role: payload.role };
      window.localStorage.setItem("jwt", token);
      window.localStorage.setItem("name", session.name);
      window.localStorage.setItem("email", session.email);
      window.localStorage.setItem("customer_user", JSON.stringify(session));
      window.location.replace("/");
    } catch {
      window.location.replace("/login?message=oauth_failed");
    }
  }, []);

  return null;
}
