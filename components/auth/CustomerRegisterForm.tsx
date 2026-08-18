"use client";

import { useState } from "react";

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  "http://localhost:8080/api";

export default function CustomerRegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // REGISTER WITH EMAIL + PASSWORD
  // =====================================================

  async function register() {
    setLoading(true);
    setMessage("");

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!name.trim()) {
      setMessage("Please enter your name.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter an email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setMessage("Please enter a password.");
      setLoading(false);
      return;
    }

    try {
      // ---------------------------------------------------
      // REGISTER
      // ---------------------------------------------------

      const response = await fetch(
        `${API_GATEWAY_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      // ---------------------------------------------------
      // SAFELY PARSE RESPONSE
      // ---------------------------------------------------

      const contentType =
        response.headers.get("content-type");

      let user: any;

      if (contentType?.includes("application/json")) {
        user = await response.json();
      } else {
        const text = await response.text();

        user = {
          message:
            text || "Unexpected server response.",
        };
      }

      console.log("Register response:", {
        status: response.status,
        data: user,
      });

      // ---------------------------------------------------
      // ERROR RESPONSE
      // ---------------------------------------------------

      if (!response.ok) {
        if (response.status === 400) {
          setMessage(
            user?.message ||
              user?.error ||
              "Invalid registration details."
          );
        } else if (response.status === 409) {
          setMessage(
            user?.message ||
              "Email or username is already registered."
          );
        } else if (response.status === 429) {
          setMessage(
            user?.message ||
              "Too many registration attempts. Please try again later."
          );
        } else if (response.status >= 500) {
          setMessage(
            "The registration service is temporarily unavailable. Please try again later."
          );
        } else {
          setMessage(
            user?.message ||
              user?.error ||
              "Unable to create your account."
          );
        }

        return;
      }

      // ---------------------------------------------------
      // TOKEN CHECK
      // ---------------------------------------------------

      if (!user?.token) {
        console.error(
          "Registration succeeded but token is missing:",
          user
        );

        setMessage(
          "Registration was successful, but no authentication token was received."
        );

        return;
      }

      // ---------------------------------------------------
      // CREATE SESSION
      // ---------------------------------------------------

      const session = {
        id: String(user.id),
        name: user.username,
        email: user.email,
        token: user.token,
        role: user.role,
      };

      // ---------------------------------------------------
      // STORE AUTHENTICATION INFORMATION
      // ---------------------------------------------------

      window.localStorage.setItem(
        "jwt",
        user.token
      );

      window.localStorage.setItem(
        "name",
        user.username || name
      );

      window.localStorage.setItem(
        "email",
        user.email || email
      );

      window.localStorage.setItem(
        "customer_user",
        JSON.stringify(session)
      );

      // ---------------------------------------------------
      // ROLE-BASED REDIRECT
      // ---------------------------------------------------

      let redirectPath = "/";

      if (user.role === "BD") {
        redirectPath = "/bd";
      } else if (user.role === "ADMIN") {
        redirectPath = "/admin";
      } else {
        // CUSTOMER
        redirectPath = "/";
      }

      window.location.href = redirectPath;

    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error
      );

      setMessage(
        "Unable to reach the registration service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // GOOGLE REGISTRATION
  // =====================================================

  function googleRegister() {
    setLoading(true);
    setMessage("");

    const googleRegisterUrl =
      `${API_GATEWAY_URL}/auth/google`;

    console.log(
      "Redirecting to Google registration:",
      googleRegisterUrl
    );

    window.location.href = googleRegisterUrl;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="login-card">

      <span>NEW ACCOUNT</span>

      <h1>Create account.</h1>

      <p>
        Join SodaSplash to place and track wholesale orders.
      </p>

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

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
          GOOGLE REGISTRATION
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
          onClick={googleRegister}
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
                d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
              />

              <path
                fill="#EA4335"
                d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
              />

            </g>
          </svg>

          Sign up with Google

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
              background:
                "rgba(143,232,245,.18)",
            }}
          />

          <span
            style={{
              padding: "0 12px",
            }}
          >
            OR REGISTER WITH EMAIL
          </span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "rgba(143,232,245,.18)",
            }}
          />

        </div>

      </div>

      {/* =====================================================
          NAME
      ===================================================== */}

      <label>
        Name

        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          disabled={loading}
          autoComplete="name"
        />
      </label>

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
          autoComplete="new-password"
        />
      </label>

      {/* =====================================================
          REGISTER BUTTON
      ===================================================== */}

      <button
        type="button"
        className="button primary"
        disabled={loading}
        onClick={register}
        style={{
          marginTop: "32px",
          width: "100%",
        }}
      >
        {loading
          ? "Creating account..."
          : "Create account"}
      </button>

      {/* =====================================================
          LOGIN LINK
      ===================================================== */}

      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#91aabd",
        }}
      >

        Already have an account?{" "}

        <a
          href="/login"
          style={{
            color: "var(--splash)",
            textDecoration: "underline",
          }}
        >
          Sign in
        </a>

      </div>

    </div>
  );
}