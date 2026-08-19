"use client";

import { useEffect } from "react";

function decodePayload(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT");
  }

  const payload = parts[1];

  const normalized = payload
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const decoded = atob(
    normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  );

  return JSON.parse(decoded);
}

export default function OAuthSuccessPage() {
  useEffect(() => {
    try {
      const hash = window.location.hash;

      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("token");

      if (!token) {
        throw new Error("Missing login token");
      }

      const payload = decodePayload(token);

      const session = {
        id: String(payload.sub),
        name: payload.username || "",
        email: payload.email || "",
        token,
        role: payload.role || "",
      };

      localStorage.setItem("jwt", token);
      localStorage.setItem("name", session.name);
      localStorage.setItem("email", session.email);
      localStorage.setItem("customer_user", JSON.stringify(session));

      // Remove the JWT from the browser URL before redirecting.
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );

      window.location.replace("/");
    } catch (error) {
      console.error("OAuth success handling failed:", error);

      window.location.replace("/login?message=oauth_failed");
    }
  }, []);

  return null;
}