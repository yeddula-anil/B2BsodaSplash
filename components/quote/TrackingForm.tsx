"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/flavours";

type CustomerSession = { id: string; name?: string; email: string; token?: string };
type OrderItem = { id: number; productName: string; itemName: string; quantity: number; amount: number };
type Order = {
  id: number;
  name: string;
  businessName?: string;
  actualAmount: number;
  finalAmount?: number | null;
  orderStatus: "NEGOTIATION" | "REJECTED" | "ACCEPTED";
  orderItems: OrderItem[];
  createdAt: string;
};

const stages = ["ORDER_PLACED", "NEGOTIATION", "REJECTED", "ACCEPTED"] as const;
const stageLabels: Record<(typeof stages)[number], string> = {
  ORDER_PLACED: "Order placed",
  NEGOTIATION: "Negotiation",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted"
};

function getSession(): CustomerSession | null {
  try {
    const value = window.localStorage.getItem("customer_user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default function TrackingForm() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (!currentSession?.email) return;

    const ordersApiBase = process.env.NEXT_API_GATEWAY_URL || "http://localhost:8080";
    const email = currentSession.email;

    fetch(`${ordersApiBase}/api/orders/by-email?email=${encodeURIComponent(email)}`, {
      headers: currentSession.token ? { Authorization: `Bearer ${currentSession.token}` } : {}
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || "Unable to load your orders.");
        const list = Array.isArray(result) ? result : result.data || [];
        return list.map((o: any) => ({
          id: String(o.id || o.quoteNumber),
          name: o.customerName || currentSession.name || "Customer",
          businessName: o.businessName,
          actualAmount: Number(o.subtotal || o.total || 0),
          finalAmount: Number(o.total || 0),
          orderStatus: (o.status || "ACCEPTED").toUpperCase() === "DELIVERED" ? "ACCEPTED" : (o.status || "ACCEPTED").toUpperCase() === "CANCELLED" ? "REJECTED" : "NEGOTIATION",
          orderItems: (o.quoteItems || []).map((item: any) => ({
            id: item.id,
            productName: "SodaSplash",
            itemName: item.flavourName || "Flavour",
            quantity: item.quantity,
            amount: Number(item.lineTotal || 0)
          })),
          createdAt: o.finalizedAt || new Date().toISOString()
        }));
      })
      .then((data: Order[]) => setOrders(data))
      .catch((error: Error) => {
        setMessage(error.message);
        setOrders([]);
      });
  }, []);

  if (selectedOrder) {
    const currentIndex = stages.indexOf(selectedOrder.orderStatus);
    const completedThrough = selectedOrder.orderStatus === "REJECTED" ? 2 : Math.max(0, currentIndex);
    return (
      <div className="tracking-result">
        <div className="tracking-title">
          <span>ORDER #{selectedOrder.id}</span>
          <h1>{stageLabels[selectedOrder.orderStatus]}</h1>
          <p>Order request for {selectedOrder.name}{selectedOrder.businessName ? ` · ${selectedOrder.businessName}` : ""}</p>
        </div>
        <div className="timeline">
          {stages.map((stage, index) => {
            const active = stage === "REJECTED"
              ? selectedOrder.orderStatus === "REJECTED"
              : selectedOrder.orderStatus !== "REJECTED" && index <= completedThrough;
            return (
              <div className={active ? "complete" : ""} key={stage}>
                <i />
                <span>
                  <strong>{stageLabels[stage]}</strong>
                  <small>{active && index === 0 ? new Date(selectedOrder.createdAt).toLocaleString("en-IN") : active ? "Current stage" : "Pending"}</small>
                </span>
              </div>
            );
          })}
        </div>
        <div className="tracked-items">
          {selectedOrder.orderItems.map((item) => (
            <div key={item.id}>
              <span>{item.productName} · {item.itemName} x {item.quantity}</span>
              <strong>{formatINR(item.amount)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatINR(selectedOrder.finalAmount ?? selectedOrder.actualAmount)}</strong>
          </div>
        </div>
        <button type="button" className="button ghost" style={{ marginTop: 16 }} onClick={() => setSelectedOrder(null)}>Back to orders</button>
      </div>
    );
  }

  return (
    <div className="tracking-card">
      <span>PRIVATE ORDER TRACKING</span>
      {orders?.length === 0 ? <>
        <h1>No orders found.</h1>
        <p>You haven&apos;t placed any orders.</p>
        <a className="button ghost" href="/">Back to home</a>
      </> : <>
        <h1>Track your request.</h1>
        <p>Showing orders for {session?.name || session?.email || "your account"}. Click an order to view its status.</p>
        {orders === null && <p>Loading your orders…</p>}
        {message && <p className="form-message">{message}</p>}
      </>}
      {orders && orders.length > 0 && (
        <div className="user-orders-list">
          {orders.map((order) => (
            <button key={order.id} className="button ghost" style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 8 }} onClick={() => setSelectedOrder(order)}>
              <span>
                <strong>ORDER #{order.id}</strong>
                <div style={{ fontSize: 12, color: "#91aabd" }}>{order.name}{order.businessName ? ` · ${order.businessName}` : ""}</div>
              </span>
              <span style={{ alignSelf: "center" }}>{stageLabels[order.orderStatus]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
