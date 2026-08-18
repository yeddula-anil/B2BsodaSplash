"use client";

import { useState, useEffect } from "react";

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  "http://localhost:8080/api";

export default function CustomerLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("message");

    if (msg === "plz_login_to_adda_quote") {
      setMessage("Please login to add a quote.");
    } else if (msg === "plz_login_to_track_order") {
      setMessage("Please login to track your order.");
    } else if (msg === "oauth_failed") {
      setMessage(
        "Google sign-in could not be completed. Please try again."
      );
    }
  }, []);

  // =====================================================
  // EMAIL + PASSWORD LOGIN
  // =====================================================

  async function login() {
    setLoading(true);
    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter an email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      // Safely parse response
      const contentType = response.headers.get("content-type");

      let data: any;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        data = {
          message: text || "Unexpected server response.",
        };
      }

      console.log("Login response:", {
        status: response.status,
        data,
      });

      // =====================================================
      // ERROR RESPONSE
      // =====================================================

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Invalid email or password.");
        } else if (response.status === 429) {
          setMessage(
            data?.message ||
              "Too many login attempts. Please try again later."
          );
        } else if (response.status === 400) {
          setMessage(
            data?.message ||
              data?.error ||
              "Invalid login request."
          );
        } else if (response.status >= 500) {
          setMessage(
            "The authentication service is temporarily unavailable. Please try again later."
          );
        } else {
          setMessage(
            data?.message ||
              data?.error ||
              "Unable to sign in. Please try again."
          );
        }

        return;
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      if (!data?.token) {
        console.error("Login succeeded but token is missing:", data);

        setMessage(
          "Login was successful, but no authentication token was received."
        );

        return;
      }

      const session = {
        id: String(data.id),
        name: data.username,
        email: data.email,
        token: data.token,
        role: data.role,
      };

      // Store authentication information
      window.localStorage.setItem("jwt", data.token);

      window.localStorage.setItem(
        "name",
        data.username || ""
      );

      window.localStorage.setItem(
        "email",
        data.email || email
      );

      window.localStorage.setItem(
        "customer_user",
        JSON.stringify(session)
      );

      // =====================================================
// ROLE-BASED REDIRECT
// =====================================================

      const next = new URLSearchParams(
          window.location.search
        ).get("next");

        let redirectPath = "/";

        if (next) {
          // If a specific next URL was requested, respect it
          redirectPath = next;
        } else if (data.role === "BD") {
          redirectPath = "/bd";
        } else if (data.role === "ADMIN") {
          redirectPath = "/admin";
        } else {
          // CUSTOMER and any other normal user
          redirectPath = "/";
        }

        window.location.href = redirectPath;
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        "Unable to reach the authentication service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // GOOGLE LOGIN
  // =====================================================

  function googleLogin() {
    setLoading(true);
    setMessage("");

    const googleLoginUrl =
      `${API_GATEWAY_URL}/auth/google`;

    console.log(
      "Redirecting to Google login:",
      googleLoginUrl
    );

    window.location.href = googleLoginUrl;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="login-card">
      <span>WELCOME BACK</span>

      <h1>Sign in.</h1>

      <p>
        Access your SodaSplash wholesale account.
      </p>

      {message && (
        <p
          className="form-message"
          style={{
            color: "var(--coral)",
            marginTop: "10px",
          }}
        >
          {message}
        </p>
      )}

      {/* =====================================================
          GOOGLE LOGIN
      ===================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        <button
          type="button"
          className="button ghost"
          disabled={loading}
          onClick={googleLogin}
          style={{
            width: "100%",
            justifyContent: "center",
            background: "white",
            color: "#333",
            border: "none",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"
            >
              <path
                fill="#4285F4"
                d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
              />

              <path
                fill="#34A853"
                d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
              />

              <path
                fill="#FBBC05"
                d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
              />

              <path
                fill="#EA4335"
                d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
              />
            </g>
          </svg>

          Continue with Google
        </button>

        {/* =====================================================
            DIVIDER
        ===================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "16px 0",
            color: "#6f8998",
            fontSize: "11px",
            letterSpacing: "0.04em",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(143,232,245,.18)",
            }}
          />

          <span style={{ padding: "0 12px" }}>
            OR LOGIN WITH EMAIL
          </span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(143,232,245,.18)",
            }}
          />
        </div>
      </div>

      {/* =====================================================
          EMAIL
      ===================================================== */}

      <label>
        Email

        <input
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          disabled={loading}
          autoComplete="email"
        />
      </label>

      {/* =====================================================
          PASSWORD
      ===================================================== */}

      <label>
        Password

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          disabled={loading}
          autoComplete="current-password"
        />
      </label>

      {/* =====================================================
          LOGIN BUTTON
      ===================================================== */}

      <button
        type="button"
        className="button primary"
        disabled={loading}
        onClick={login}
        style={{
          marginTop: "32px",
          width: "100%",
        }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {/* =====================================================
          REGISTER
      ===================================================== */}

      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#91aabd",
        }}
      >
        Don't have an account?{" "}
        <a
          href="/register"
          style={{
            color: "var(--splash)",
            textDecoration: "underline",
          }}
        >
          Create account
        </a>
      </div>
    </div>
  );
}