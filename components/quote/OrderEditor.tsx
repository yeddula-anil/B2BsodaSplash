"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { formatINR } from "@/lib/flavours";
import {
  getNextStage,
  orderStages,
  stageLabels,
  type OrderStage,
} from "@/lib/config";

type OrderItem = {
  id: string;
  product_id?: string | null;
  flavour_id?: string | null;
  flavour_name: string;
  quantity: number;
  price_per_case: number;
  line_total: number;
};

type OrderQuote = {
  id: string;
  quote_number: string;
  customer_name: string;
  email: string;
  phone: string;
  business_name?: string | null;
  business_type: string;

  referral_source: string;
  referral_name?: string | null;
  referral_email?: string | null;

  address?: string | null;
  pincode?: string | null;
  delivery_date?: string | null;

  note?: string | null;
  internal_note?: string | null;

  status: OrderStage;

  subtotal: number;

  discount_type:
    | "percentage"
    | "flat"
    | null;

  discount_value: number;
  discount_amount: number;

  tax_amount: number;
  additional_charges: number;
  total: number;

  payment_status:
    | "pending"
    | "partial"
    | "paid"
    | "refunded";

  invoice_version: number;
  latest_invoice_number?: string | null;
  finalized_at?: string | null;

  quote_items: OrderItem[];
};

type LoadedOrder = {
  quote: OrderQuote;

  latestInvoice?: {
    invoice_number: string;
    version: number;
    pdf_url?: string | null;
    emailed_at?: string | null;
  } | null;
};

type EditableItem = OrderItem;

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export default function OrderEditor({
  quoteNumber,
}: {
  quoteNumber: string;
}) {
  const [token, setToken] =
    useState<string | null>(null);

  const [items, setItems] =
    useState<EditableItem[]>([]);

  /* =====================================================
     TOAST
  ===================================================== */

  type ToastType = "success" | "error";

  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  function showToast(
    type: ToastType,
    message: string
  ) {
    setToast({
      type,
      message,
    });
  }

  const [saving, setSaving] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const ORDERS_API_BASE =
    process.env.NEXT_PUBLIC_ORDER_SERVICE_URL ||
    "http://localhost:8080/api";

  /* =====================================================
     GET TOKEN
  ===================================================== */

  useEffect(() => {
    const accessToken =
      window.localStorage.getItem("authToken") ||
      window.sessionStorage.getItem("authToken");

    if (!accessToken) {
      window.location.href = "/staff-login";
      return;
    }

    setToken(accessToken);
  }, []);

  /* =====================================================
     TOAST AUTO CLOSE
  ===================================================== */

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  /* =====================================================
     FETCH ORDER
  ===================================================== */

  const orderKey = token
    ? [
        "order-editor",
        quoteNumber,
        token,
      ]
    : null;

  const {
    data,
    error,
    mutate,
  } = useSWR<LoadedOrder>(
    orderKey,
    async ([, currentQuoteNumber, accessToken]) => {
      const response = await fetch(
        `${ORDERS_API_BASE}/orders/${encodeURIComponent(
          String(currentQuoteNumber)
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result =
        await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to load order."
        );
      }

      /*
       * Backend:
       *
       * ApiResponse<OrderResponse>
       *
       * Actual order:
       * result.data
       */

      const resData =
        result?.data || result;

      if (!resData?.id) {
        throw new Error(
          "Order data was not returned by the server."
        );
      }

      const loadedQuote: OrderQuote = {
        id: String(resData.id),

        quote_number:
          resData.quoteNumber ||
          String(currentQuoteNumber),

        customer_name:
          resData.customerName ||
          "Customer",

        email:
          resData.email || "",

        phone:
          resData.phone || "",

        business_name:
          resData.businessName || null,

        business_type:
          resData.businessType || "",

        referral_source:
          resData.referralSource || "",

        referral_name:
          resData.referralName || null,

        referral_email:
          resData.referralEmail || null,

        address:
          resData.address || null,

        pincode:
          resData.pincode || null,

        delivery_date:
          resData.deliveryDate || null,

        note:
          resData.note || null,

        internal_note:
          resData.internalNote || null,

        status:
          String(
            resData.status ||
              "SUBMITTED"
          ).toLowerCase() as OrderStage,

        subtotal:
          Number(
            resData.subtotal || 0
          ),

        discount_type:
          resData.discountType
            ? String(
                resData.discountType
              ).toLowerCase() as
                | "percentage"
                | "flat"
            : null,

        discount_value:
          Number(
            resData.discountValue || 0
          ),

        discount_amount:
          Number(
            resData.discountAmount || 0
          ),

        tax_amount:
          Number(
            resData.taxAmount || 0
          ),

        additional_charges:
          Number(
            resData.additionalCharges || 0
          ),

        total:
          Number(
            resData.total || 0
          ),

        payment_status:
          String(
            resData.paymentStatus ||
              "PENDING"
          ).toLowerCase() as
            | "pending"
            | "partial"
            | "paid"
            | "refunded",

        invoice_version:
          Number(
            resData.invoiceVersion || 1
          ),

        latest_invoice_number:
          resData.latestInvoiceNumber ||
          null,

        finalized_at:
          resData.finalizedAt ||
          null,

        quote_items:
          Array.isArray(
            resData.quoteItems
          )
            ? resData.quoteItems.map(
                (item: any) => ({
                  id: String(item.id),

                  product_id:
                    item.productId
                      ? String(
                          item.productId
                        )
                      : null,

                  flavour_id:
                    item.flavourId
                      ? String(
                          item.flavourId
                        )
                      : null,

                  flavour_name:
                    item.flavourName ||
                    "Flavour",

                  quantity:
                    Number(
                      item.quantity || 1
                    ),

                  price_per_case:
                    Number(
                      item.pricePerCase ||
                        0
                    ),

                  line_total:
                    Number(
                      item.lineTotal ||
                        0
                    ),
                })
              )
            : [],
      };

      return {
        quote: loadedQuote,

        latestInvoice:
          loadedQuote.latest_invoice_number
            ? {
                invoice_number:
                  loadedQuote.latest_invoice_number,

                version:
                  loadedQuote.invoice_version,
              }
            : null,
      };
    },
    {
      dedupingInterval: 15000,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    }
  );

  /* =====================================================
     FETCH ERROR -> TOAST
  ===================================================== */

  useEffect(() => {
    if (error) {
      showToast(
        "error",
        error.message ||
          "Unable to load order."
      );
    }
  }, [error]);

  /* =====================================================
     LOAD ITEMS
  ===================================================== */

  useEffect(() => {
    if (data) {
      setItems(
        data.quote.quote_items
      );
    }
  }, [data]);

  /* =====================================================
     JSON RESPONSE
  ===================================================== */

  async function readJsonResponse(
    response: Response
  ) {
    const text =
      await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        error:
          text ||
          "The server returned an invalid response.",
      };
    }
  }

  /* =====================================================
     UPDATE LOCAL QUOTE FIELD
  ===================================================== */

  function updateField<
    K extends keyof OrderQuote
  >(
    key: K,
    value: OrderQuote[K]
  ) {
    void mutate(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          quote: {
            ...current.quote,
            [key]: value,
          },
        };
      },
      {
        revalidate: false,
      }
    );
  }

  /* =====================================================
     UPDATE ITEM
  ===================================================== */

  function updateItem(
    index: number,
    key: keyof EditableItem,
    value: string | number
  ) {
    setItems((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [key]: value,
              }
            : item
      )
    );
  }

  /* =====================================================
     PRICING
  ===================================================== */

  const subtotal =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ) *
          Number(
            item.price_per_case || 0
          ),
      0
    );

  const discountAmount =
    data?.quote.discount_type ===
    "percentage"
      ? Math.round(
          (subtotal *
            Number(
              data.quote
                .discount_value || 0
            )) /
            100
        )
      : Number(
          data?.quote
            .discount_value || 0
        );

  const grandTotal =
    Math.max(
      0,
      subtotal -
        discountAmount +
        Number(
          data?.quote.tax_amount ||
            0
        ) +
        Number(
          data?.quote
            .additional_charges ||
            0
        )
    );

  /* =====================================================
     SAVE ORDER
  ===================================================== */

  async function save() {
    if (!data) {
      return;
    }

    if (!token) {
      showToast(
        "error",
        "Login required."
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          `${ORDERS_API_BASE}/orders/${encodeURIComponent(
            data.quote.id
          )}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              paymentStatus:
                data.quote
                  .payment_status
                  .toUpperCase(),

              internalNote:
                data.quote
                  .internal_note,

              discountType:
                data.quote
                  .discount_type
                  ? data.quote.discount_type.toUpperCase()
                  : null,

              discountValue:
                Number(
                  data.quote
                    .discount_value ||
                    0
                ),

              items:
                items.map(
                  (item) => ({
                    id: Number(
                      item.id
                    ),

                    quantity:
                      Number(
                        item.quantity
                      ),

                    pricePerCase:
                      Number(
                        item.price_per_case
                      ),
                  })
                ),
            }),
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to save order."
        );
      }

      showToast(
        "success",
        result?.message ||
          "Order updated successfully."
      );

      await mutate();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to save order."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  async function updateStatus(
    nextStatus: OrderStage
  ) {
    if (!data) {
      return;
    }

    if (!token) {
      showToast(
        "error",
        "Login required."
      );
      return;
    }

    setUpdatingStatus(true);

    try {
      const isCancel =
        nextStatus === "cancelled";

      const url = isCancel
        ? `${ORDERS_API_BASE}/orders/${encodeURIComponent(
            data.quote.id
          )}/cancel`
        : `${ORDERS_API_BASE}/orders/${encodeURIComponent(
            data.quote.id
          )}/stage`;

      const response =
        await fetch(url, {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: isCancel
            ? undefined
            : JSON.stringify({
                newStatus:
                  nextStatus.toUpperCase(),
              }),
        });

      const result =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to update order status."
        );
      }

      showToast(
        "success",
        result?.message ||
          (isCancel
            ? "Order cancelled successfully."
            : `Order status updated to ${
                stageLabels[
                  nextStatus
                ] || nextStatus
              }.`)
      );

      await mutate();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (!data) {
    return (
      <div className="setup-card">
        <h2>
          {error
            ? "Unable to load order"
            : "Loading order..."}
        </h2>

        <p>
          {error?.message ||
            "Please wait while the order details are loaded."}
        </p>

        {/* Text-only toast */}
        {toast && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              position: "fixed",
              top: "20px",
              right: "24px",
              zIndex: 999999,
              color:
                toast.type === "success"
                  ? "#16a34a"
                  : "#dc2626",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.4,
              pointerEvents: "none",
              maxWidth:
                "calc(100vw - 48px)",
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  const quote = data.quote;

  const nextStage =
    getNextStage(
      quote.status
    );

  const currentStageIndex =
    orderStages.indexOf(
      quote.status as (typeof orderStages)[number]
    );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <section className="order-editor-shell">

      {/* =================================================
          TEXT-ONLY TOAST
      ================================================= */}

      {toast && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 999999,

            color:
              toast.type === "success"
                ? "#16a34a"
                : "#dc2626",

            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1.4,

            maxWidth:
              "calc(100vw - 48px)",

            pointerEvents: "none",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="order-editor-header">
        <div>
          <span>
            ORDER EDITOR
          </span>

          <h1>
            {quote.quote_number}
          </h1>

          <p>
            Current status:{" "}
            {
              stageLabels[
                quote.status
              ]
            }

            {" · "}

            Payment:{" "}
            {quote.payment_status}

            {quote.latest_invoice_number
              ? ` · Latest invoice ${quote.latest_invoice_number}`
              : ""}
          </p>
        </div>

        <div className="order-editor-actions">

          <a
            className="button ghost"
            href={
              quote.referral_source
                ?.toLowerCase() ===
              "salesperson"
                ? "/bd"
                : "/admin"
            }
          >
            Back to dashboard
          </a>

          {quote.status !==
            "cancelled" && (
            <button
              type="button"
              className="button danger"
              onClick={() =>
                updateStatus(
                  "cancelled"
                )
              }
              disabled={
                updatingStatus ||
                saving
              }
            >
              {updatingStatus
                ? "Cancelling..."
                : "Cancel order"}
            </button>
          )}

          <button
            type="button"
            className="button primary"
            onClick={save}
            disabled={
              saving ||
              updatingStatus
            }
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </header>

      {/* =================================================
          ORDER PATH
      ================================================= */}

      <section className="order-path-card">

        <div className="order-path-header">
          <span>
            ORDER PATH
          </span>

          <strong>
            {quote.status ===
            "cancelled"
              ? "Cancelled"
              : `Current stage: ${
                  stageLabels[
                    quote.status
                  ]
                }`}
          </strong>
        </div>

        <div
          className={`order-path ${
            quote.status ===
            "cancelled"
              ? "is-cancelled"
              : ""
          }`}
        >
          {orderStages.map(
            (
              stage,
              index
            ) => {
              const isCurrent =
                quote.status ===
                stage;

              const isComplete =
                currentStageIndex >=
                  0 &&
                index <
                  currentStageIndex;

              const isNext =
                nextStage ===
                stage;

              return (
                <button
                  type="button"
                  key={stage}
                  className={`path-step ${
                    isComplete
                      ? "complete"
                      : ""
                  } ${
                    isCurrent
                      ? "current"
                      : ""
                  } ${
                    isNext
                      ? "next"
                      : ""
                  }`}
                  disabled={
                    !isNext ||
                    updatingStatus ||
                    saving ||
                    quote.status ===
                      "cancelled"
                  }
                  onClick={() =>
                    updateStatus(
                      stage
                    )
                  }
                >
                  <i />

                  <span>
                    {
                      stageLabels[
                        stage
                      ]
                    }
                  </span>
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          ORDER DETAILS
      ================================================= */}

      <div className="order-editor-grid">

        <section className="setup-card">

          <span>
            ORDER DETAILS
          </span>

          <div className="form-grid">

            <label>
              Customer name

              <input
                value={
                  quote.customer_name
                }
                readOnly
              />
            </label>

            <label>
              Email

              <input
                type="email"
                value={
                  quote.email
                }
                readOnly
              />
            </label>

            <label>
              Phone

              <input
                value={
                  quote.phone
                }
                readOnly
              />
            </label>

            <label>
              Business name

              <input
                value={
                  quote.business_name ||
                  ""
                }
                readOnly
              />
            </label>

            <label>
              Business type

              <input
                value={
                  quote.business_type
                }
                readOnly
              />
            </label>

            <label>
              Delivery date

              <input
                type="date"
                value={
                  quote.delivery_date ||
                  ""
                }
                readOnly
              />
            </label>

            <label>
              Referral source

              <input
                value={
                  quote.referral_source
                }
                readOnly
              />
            </label>

            <label>
              Referral name

              <input
                value={
                  quote.referral_name ||
                  ""
                }
                readOnly
              />
            </label>

            <label>
              Referral email

              <input
                value={
                  quote.referral_email ||
                  ""
                }
                readOnly
              />
            </label>

            <label>
              Pincode

              <input
                value={
                  quote.pincode ||
                  ""
                }
                readOnly
              />
            </label>

            <label className="full">
              Delivery address

              <textarea
                value={
                  quote.address ||
                  ""
                }
                readOnly
              />
            </label>

            <label className="full">
              Customer note

              <textarea
                value={
                  quote.note || ""
                }
                readOnly
              />
            </label>

            <label className="full">
              Internal note

              <textarea
                value={
                  quote.internal_note ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "internal_note",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Payment status

              <select
                value={
                  quote.payment_status
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "payment_status",
                    event.target
                      .value as OrderQuote["payment_status"]
                  )
                }
              >
                <option value="pending">
                  Pending
                </option>

                <option value="partial">
                  Partial
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="refunded">
                  Refunded
                </option>
              </select>
            </label>

          </div>
        </section>

        {/* =================================================
            PRICING
        ================================================= */}

        <section className="setup-card">

          <span>
            PRICING
          </span>

          <div className="form-grid">

            <label>
              Discount type

              <select
                value={
                  quote.discount_type ||
                  "flat"
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "discount_type",
                    event.target
                      .value as OrderQuote["discount_type"]
                  )
                }
              >
                <option value="flat">
                  Flat
                </option>

                <option value="percentage">
                  Percentage
                </option>
              </select>
            </label>

            <label>
              Discount value

              <input
                type="number"
                min="0"
                value={
                  quote.discount_value
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "discount_value",
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />
            </label>

            <label>
              Taxes

              <input
                type="number"
                min="0"
                value={
                  quote.tax_amount
                }
                readOnly
              />
            </label>

            <label>
              Additional charges

              <input
                type="number"
                min="0"
                value={
                  quote.additional_charges
                }
                readOnly
              />
            </label>

          </div>

          <div className="quote-summary-preview">

            <div>
              <span>
                Subtotal
              </span>

              <strong>
                {formatINR(
                  subtotal
                )}
              </strong>
            </div>

            <div>
              <span>
                Discount
              </span>

              <strong>
                -
                {formatINR(
                  discountAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                Taxes
              </span>

              <strong>
                {formatINR(
                  Number(
                    quote.tax_amount ||
                      0
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Additional charges
              </span>

              <strong>
                {formatINR(
                  Number(
                    quote.additional_charges ||
                      0
                  )
                )}
              </strong>
            </div>

            <div className="summary-total">

              <span>
                Grand total
              </span>

              <strong>
                {formatINR(
                  grandTotal
                )}
              </strong>

            </div>

          </div>
        </section>
      </div>

      {/* =================================================
          LINE ITEMS
      ================================================= */}

      <section className="dashboard-table">

        <div className="table-title">

          <h2>
            Line items
          </h2>

          <p>
            Adjust quantities and
            unit prices before
            issuing the invoice.
          </p>

        </div>

        <div className="table-row table-head order-item-grid">

          <span>
            Product / Flavour
          </span>

          <span>
            Quantity
          </span>

          <span>
            Unit price
          </span>

          <span>
            Line total
          </span>

        </div>

        {items.map(
          (
            item,
            index
          ) => (
            <div
              className="table-row order-item-grid"
              key={item.id}
            >

              <div>
                <strong>
                  {item.flavour_name}
                </strong>

                {item.product_id && (
                  <small
                    style={{
                      display:
                        "block",
                      opacity:
                        0.6,
                      marginTop:
                        "4px",
                    }}
                  >
                    Product ID:{" "}
                    {
                      item.product_id
                    }
                  </small>
                )}
              </div>

              <input
                type="number"
                min="1"
                value={
                  item.quantity
                }
                onChange={(
                  event
                ) =>
                  updateItem(
                    index,
                    "quantity",
                    Math.max(
                      1,
                      Number(
                        event.target
                          .value
                      )
                    )
                  )
                }
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  item.price_per_case
                }
                onChange={(
                  event
                ) =>
                  updateItem(
                    index,
                    "price_per_case",
                    Math.max(
                      0,
                      Number(
                        event.target
                          .value
                      )
                    )
                  )
                }
              />

              <strong>
                {formatINR(
                  Number(
                    item.quantity
                  ) *
                    Number(
                      item.price_per_case
                    )
                )}
              </strong>

            </div>
          )
        )}

        {!items.length && (
          <div
            style={{
              padding:
                "24px",
              textAlign:
                "center",
            }}
          >
            No order items found.
          </div>
        )}

      </section>

      {/* =================================================
          LATEST INVOICE
      ================================================= */}

      {data.latestInvoice && (
        <section className="setup-card">

          <span>
            LATEST INVOICE
          </span>

          <h2>
            {
              data.latestInvoice
                .invoice_number
            }
          </h2>

          <p>
            {data.latestInvoice
              .emailed_at
              ? "Already emailed to the customer."
              : "Ready to send or resend."}
          </p>

          {data.latestInvoice
            .pdf_url && (
            <a
              className="button ghost invoice-link"
              href={
                data.latestInvoice
                  .pdf_url
              }
              target="_blank"
              rel="noreferrer"
            >
              Open PDF invoice
            </a>
          )}

        </section>
      )}

    </section>
  );
}