"use client";

import { useEffect, useState } from "react";
import TrackOrderModal from "../track/TrackOrderModal";
import CustomerLoginForm from "./CustomerLoginForm";

/* =========================================================
   ORDER ITEM
========================================================= */

export type OrderItem = {
  id: number;
  productId: number;
  flavourId: number;
  flavourName: string;
  quantity: number;
  pricePerCase: number;
  lineTotal: number;
};

/* =========================================================
   ORDER
========================================================= */

export type Order = {
  id: number;
  quoteNumber: string;
  customerName: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  referralSource?: string | null;
  referralName?: string | null;
  referralEmail?: string | null;
  address?: string | null;
  pincode?: string | null;
  deliveryDate?: string | null;
  note?: string | null;
  status: string;
  subtotal?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  additionalCharges?: number | null;
  total?: number | null;
  paymentStatus?: string | null;
  invoiceVersion?: number | null;
  latestInvoiceNumber?: string | null;
  finalizedAt?: string | null;
  quoteItems?: OrderItem[];
};

/* =========================================================
   STAGES
========================================================= */

const STAGES = [
  "SUBMITTED",
  "CONTACTED",
  "NEGOTIATING",
  "CONFIRMED",
  "READY",
  "SHIPPED",
  "DELIVERED",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function TrackAuthGate() {
  const [email, setEmail] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  const [authenticated, setAuthenticated] =
    useState<boolean | null>(null);

  const [error, setError] = useState("");

  /* =======================================================
     CHECK AUTHENTICATION
  ======================================================= */

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    // User is NOT logged in
    if (!token) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    // User is logged in
    setAuthenticated(true);

    const storedEmail = localStorage.getItem("email");

    if (!storedEmail) {
      setError("We couldn't find your email.");
      setLoading(false);
      return;
    }

    const customerEmail = storedEmail
      .trim()
      .toLowerCase();

    setEmail(customerEmail);

    fetchOrders(customerEmail);
  }, []);

  /* =======================================================
     FETCH ORDERS
  ======================================================= */

  async function fetchOrders(customerEmail: string) {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // GET JWT
      // =====================================================

      const token = localStorage.getItem("jwt");

      if (!token) {
        setAuthenticated(false);
        return;
      }

      // =====================================================
      // CALL NEXT.JS API
      // =====================================================

      const response = await fetch(
        `/api/track?email=${encodeURIComponent(
          customerEmail
        )}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },

          cache: "no-store",
        }
      );

      // =====================================================
      // PARSE RESPONSE
      // =====================================================

      const data = await response.json();

      // =====================================================
      // HANDLE ERROR
      // =====================================================

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to load your orders."
        );
      }

      // =====================================================
      // SET ORDERS
      // =====================================================

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Track orders error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     AUTH CHECK LOADING
  ======================================================= */

  if (authenticated === null) {
    return (
      <div className="customer-track-loading">
        <div className="track-loading-dot" />

        <p>
          Checking your account...
        </p>
      </div>
    );
  }

  /* =======================================================
     NOT AUTHENTICATED
  ======================================================= */

  if (!authenticated) {
    return (
      <CustomerLoginForm />
    );
  }

  /* =======================================================
     LOADING ORDERS
  ======================================================= */

  if (loading) {
    return (
      <div className="customer-track-loading">
        <div className="track-loading-dot" />

        <p>
          Loading your orders...
        </p>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="customer-track-message">
        <h2>
          Unable to load orders
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  /* =======================================================
     NO ORDERS
  ======================================================= */

  if (orders.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "calc(100vh - 220px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "650px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "28px",
              lineHeight: "1.3",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            No orders found
          </h2>

          <p
            style={{
              margin: "0 auto",
              color: "#83a1ad",
              fontSize: "15px",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            We couldn't find any orders associated
            <br />
            with this email.
          </p>

          {email && (
            <div
              style={{
                marginTop: "14px",
                color: "#b9dce9",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {email}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              display: "block",
              margin: "28px auto 0",
              padding: "11px 26px",
              border: "1px solid #1d5870",
              background: "#0b2d3d",
              color: "#d6edf5",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: "1.4",
              textAlign: "center",
              transition:
                "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                "#124157";
              event.currentTarget.style.borderColor =
                "#2d7591";
              event.currentTarget.style.transform =
                "translateY(-1px)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                "#0b2d3d";
              event.currentTarget.style.borderColor =
                "#1d5870";
              event.currentTarget.style.transform =
                "translateY(0)";
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <>
      <div className="customer-track-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-track-header">
          <div>
            <h1>
              Recent orders
            </h1>

            <p>
              Orders associated with{" "}

              <strong>
                {email}
              </strong>
            </p>
          </div>
        </div>

        {/* =================================================
            ORDER TABLE
        ================================================= */}

        <div className="customer-orders-wrapper">
          <div className="customer-orders-table">

            {/* HEADER */}

            <div className="customer-order-row customer-order-header">
              <div>
                Quote
              </div>

              <div>
                Customer
              </div>

              <div>
                Business
              </div>

              <div>
                Status
              </div>

              <div>
                Total
              </div>

              <div>
                Action
              </div>
            </div>

            {/* ORDERS */}

            {orders.map(
              (order) => {
                const status =
                  String(
                    order.status || ""
                  ).toUpperCase();

                const showTotal =
                  getStageIndex(status) >=
                  STAGES.indexOf("CONFIRMED");

                return (
                  <div
                    key={order.id}
                    className="customer-order-row"
                  >
                    {/* QUOTE */}

                    <div className="order-quote">
                      <strong>
                        {order.quoteNumber}
                      </strong>
                    </div>

                    {/* CUSTOMER */}

                    <div>
                      {order.customerName || "-"}
                    </div>

                    {/* BUSINESS */}

                    <div>
                      {order.businessName ||
                        order.businessType ||
                        "-"}
                    </div>

                    {/* STATUS */}

                    <div>
                      <span
                        className={`customer-status-badge ${
                          status === "CANCELLED"
                            ? "cancelled"
                            : ""
                        }`}
                      >
                        {formatStatus(status)}
                      </span>
                    </div>

                    {/* TOTAL */}

                    <div className="order-total-column">
                      {showTotal &&
                      order.total != null ? (
                        <strong>
                          {formatCurrency(
                            Number(order.total)
                          )}
                        </strong>
                      ) : (
                        <span>
                          Amount available after confirmation
                        </span>
                      )}
                    </div>

                    {/* ACTION */}

                    <div>
                      <button
                        type="button"
                        className="customer-track-button"
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                      >
                        Track
                      </button>
                    </div>
                  </div>
                );
              }
            )}

          </div>
        </div>
      </div>

      {/* ===================================================
          MODAL
      =================================================== */}

      {selectedOrder && (
        <TrackOrderModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
        />
      )}

      {/* ===================================================
          TRACK PAGE STYLES
      =================================================== */}

      <style jsx global>{`

        .tracking-page {
          width: 100%;
          min-height: calc(100vh - 80px);
          padding: 25px 14px 60px;
          background: #061f2b;
        }

        .track-back-container {
          max-width: 1450px;
          margin: 0 auto 25px;
        }

        .customer-track-container {
          max-width: 1450px;
          margin: 0 auto;
          color: #ffffff;
        }

        .customer-track-header {
          padding: 30px;
          border: 1px solid #163d4d;
          border-bottom: 1px solid #173d4d;
          background: #072532;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .customer-track-header h1 {
          margin: 0 0 8px;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .customer-track-header p {
          margin: 0;
          color: #7d9baa;
          font-size: 14px;
        }

        .customer-track-header strong {
          color: #dce9ee;
        }

        .customer-orders-wrapper {
          overflow-x: auto;
          border-left: 1px solid #163d4d;
          border-right: 1px solid #163d4d;
          border-bottom: 1px solid #163d4d;
        }

        .customer-orders-table {
          min-width: 1000px;
        }

        .customer-order-row {
          display: grid;

          grid-template-columns:
            1.15fr
            1.35fr
            1.35fr
            1fr
            1.15fr
            0.75fr;

          align-items: center;

          min-height: 86px;

          border-top: 1px solid #153b4a;

          background: #061f2b;

          color: #eef7fa;

          font-size: 14px;
        }

        .customer-order-row > div {
          padding: 18px 30px;
        }

        .customer-order-header {
          min-height: 55px;
          background: #06232f;
          color: #5e98b1;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .customer-order-header > div {
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .order-quote strong {
          color: #ffffff;
          font-size: 15px;
        }

        .customer-status-badge {
          display: inline-flex;
          align-items: center;

          padding: 8px 13px;

          border-radius: 20px;

          background: #153e53;

          color: #9bd5ee;

          font-size: 12px;
          font-weight: 600;
        }

        .customer-status-badge.cancelled {
          background: #4a2028;
          color: #ff9da8;
        }

        .order-total-column {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-total-column strong {
          font-size: 16px;
          color: #ffffff;
        }

        .order-total-column span {
          max-width: 150px;
          color: #628a9a;
          font-size: 11px;
          line-height: 1.4;
        }

        .customer-track-button {
          padding: 10px 24px;

          border: 1px solid #1d5870;

          background: #0b2d3d;

          color: #d6edf5;

          cursor: pointer;

          font-size: 13px;
          font-weight: 700;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .customer-track-button:hover {
          background: #124157;
          border-color: #2d7591;
          transform: translateY(-1px);
        }

        /* =================================================
           NO ORDERS
        ================================================= */

        .customer-no-orders {
          width: 100%;
          min-height: calc(100vh - 220px);

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 40px 20px;

          box-sizing: border-box;

          color: #ffffff;
        }

        .customer-no-orders-content {
          width: 100%;
          max-width: 650px;

          padding: 50px 30px;

          text-align: center;

          box-sizing: border-box;
        }

        .customer-no-orders-content h2 {
          margin: 0 0 14px;

          font-size: 28px;
          font-weight: 800;

          color: #ffffff;
        }

        .customer-no-orders-content p {
          margin: 0;

          color: #83a1ad;

          font-size: 15px;
          line-height: 1.6;
        }

        .customer-no-orders-content span {
          display: block;

          margin-top: 14px;

          color: #b9dce9;

          font-size: 14px;
        }

        .customer-no-orders-button {
          margin-top: 28px;

          padding: 11px 26px;

          border: 1px solid #1d5870;

          background: #0b2d3d;

          color: #d6edf5;

          cursor: pointer;

          font-size: 13px;
          font-weight: 700;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .customer-no-orders-button:hover {
          background: #124157;

          border-color: #2d7591;

          transform: translateY(-1px);
        }

        .customer-track-loading,
        .customer-track-message {
          max-width: 650px;
          margin: 80px auto;
          padding: 45px 30px;

          text-align: center;

          border: 1px solid #163d4d;

          background: #072532;

          color: #ffffff;
        }

        .customer-track-message h2 {
          margin: 0 0 10px;
        }

        .customer-track-message p {
          margin: 0;
          color: #83a1ad;
        }

        .customer-track-message span {
          display: block;
          margin-top: 12px;
          color: #b9dce9;
        }

        .track-loading-dot {
          width: 12px;
          height: 12px;

          margin: 0 auto 14px;

          border-radius: 50%;

          background: #ef7f1a;

          animation: trackPulse 1s infinite;
        }

        @keyframes trackPulse {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }

          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
        }

        @media (max-width: 700px) {
          .tracking-page {
            padding: 20px 10px 40px;
          }

          .customer-track-header {
            padding: 22px;
          }

          .customer-track-header h1 {
            font-size: 22px;
          }

          .customer-no-orders {
            min-height: calc(100vh - 180px);
            padding: 30px 15px;
          }

          .customer-no-orders-content {
            padding: 30px 15px;
          }

          .customer-no-orders-content h2 {
            font-size: 24px;
          }
        }

      `}</style>
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getStageIndex(status: string) {
  return STAGES.indexOf(status);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}