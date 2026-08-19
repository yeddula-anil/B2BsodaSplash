"use client";

import { useState } from "react";

export default function StaffLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setMessage("");

    try {
      const authApiBase = process.env.NEXT_API_GATEWAY_URL || "http://localhost:8080";
      const response = await fetch(
        `${authApiBase}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Invalid email or password."
        );
      }

      if (!data.token) {
        throw new Error("Authentication token was not returned.");
      }

      const role = data.role?.toUpperCase();

      if (role !== "ADMIN" && role !== "BD") {
        throw new Error("You do not have staff access.");
      }

      localStorage.setItem("authToken", data.token);

      localStorage.setItem(
        "staff",
        JSON.stringify({
          id: data.id,
          username: data.username,
          email: data.email,
          role,
        })
      );

      window.location.href = role === "ADMIN" ? "/admin" : "/bd";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <span>STAFF ACCESS</span>
      <h1>Sign in.</h1>
      <p>Admin and business development accounts only.</p>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              login();
            }
          }}
        />
      </label>

      {message && <p className="form-message">{message}</p>}

      <button
        type="button"
        className="button primary"
        disabled={loading}
        onClick={login}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
