"use client";

import { useEffect, useMemo, useState } from "react";
import { formatINR, type PublicProduct } from "@/lib/flavours";
import Image from "next/image";

type Details = {
  customerName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  referralSource: string;
  referralName: string;
  referralBdId: string;
  note: string;
  deliveryAddress: string;
  pincode: string;
  deliveryDate: string;
};

type PublicTeamMember = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
};

type StaffProfile = {
  full_name?: string | null;
  email: string;
  role: "admin" | "bd";
};

const emptyDetails: Details = {
  customerName: "",
  email: "",
  phone: "",
  businessName: "",
  businessType: "",
  referralSource: "",
  referralName: "",
  referralBdId: "",
  note: "",
  deliveryAddress: "",
  pincode: "",
  deliveryDate: ""
};

export default function QuoteRequestForm({
  initialProducts = [],
  initialTeam = []
}: {
  initialProducts?: PublicProduct[];
  initialTeam?: PublicTeamMember[];
}) {
  const [step, setStep] = useState(1);
  const [storageRestored, setStorageRestored] = useState(false);

  // Products and team are already fetched by QuotePage.
  // No API calls are made in this component.
  const products = initialProducts;

  // Normalize the backend UserResponse shape:
  // { id, username, email, role, isActive }
  // into the shape used by this form: { id, name, email }.
  const team = useMemo<PublicTeamMember[]>(
    () =>
      initialTeam
        .filter(
          (member) =>
            member.isActive !== false &&
            (!member.role ||
              String(member.role).toUpperCase() === "BD")
        )
        .map((member) => ({
          id: String(member.id),
          name: member.name || member.username || member.email || "",
          email: member.email
        })),
    [initialTeam]
  );

  const [staffProfile, setStaffProfile] =
    useState<StaffProfile | null>(null);

  const [activeProductId, setActiveProductId] = useState(
    initialProducts[0]?.id ?? ""
  );

  useEffect(() => {
    if (
      initialProducts.length > 0 &&
      !initialProducts.some(
        (product) => product.id === activeProductId
      )
    ) {
      setActiveProductId(initialProducts[0].id);
    }
  }, [initialProducts, activeProductId]);

  const [details, setDetails] =
    useState<Details>(emptyDetails);

  const [quantities, setQuantities] =
    useState<Record<string, number>>({});

  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState<{
    quoteNumber: string;
    trackUrl: string;
  } | null>(null);

  const ORDERS_API_BASE =
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://localhost:8080";

  // Customer login
  useEffect(() => {
    const storedUser =
      window.localStorage.getItem("customer_user");

    if (!storedUser) {
      window.location.href =
        "/login?message=plz_login_to_adda_quote";
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      setDetails((current) => ({
        ...current,
        customerName:
          current.customerName ||
          user.name ||
          user.username ||
          window.localStorage.getItem("name") ||
          "",
        email:
          current.email ||
          user.email ||
          window.localStorage.getItem("email") ||
          ""
      }));
    } catch {
      window.location.href =
        "/login?message=plz_login_to_adda_quote";
    }
  }, []);

  // Restore quote from session storage
  useEffect(() => {
    try {
      const savedStep = Number(
        window.sessionStorage.getItem("quoteStep") || 1
      );

      const savedDetails =
        window.sessionStorage.getItem("quoteDetails");

      const savedQuantities =
        window.sessionStorage.getItem("quoteQuantities");

      const savedProductId =
        window.sessionStorage.getItem("quoteProductId");

      if ([1, 2, 3].includes(savedStep)) {
        setStep(savedStep);
      }

      if (savedDetails) {
        setDetails(JSON.parse(savedDetails));
      }

      if (savedQuantities) {
        setQuantities(JSON.parse(savedQuantities));
      }

      if (
        savedProductId &&
        products.some(
          (product) => product.id === savedProductId
        )
      ) {
        setActiveProductId(savedProductId);
      }
    } catch {
      window.sessionStorage.removeItem("quoteDetails");
      window.sessionStorage.removeItem(
        "quoteQuantities"
      );
    } finally {
      setStorageRestored(true);
    }
  }, [products]);

  useEffect(() => {
    if (!storageRestored) return;

    window.sessionStorage.setItem(
      "quoteStep",
      String(step)
    );
  }, [step, storageRestored]);

  useEffect(() => {
    if (!storageRestored) return;

    window.sessionStorage.setItem(
      "quoteProductId",
      activeProductId
    );
  }, [activeProductId, storageRestored]);

  useEffect(() => {
    if (!storageRestored) return;

    window.sessionStorage.setItem(
      "quoteDetails",
      JSON.stringify(details)
    );
  }, [details, storageRestored]);

  useEffect(() => {
    if (!storageRestored) return;

    window.sessionStorage.setItem(
      "quoteQuantities",
      JSON.stringify(quantities)
    );
  }, [quantities, storageRestored]);

  const activeProduct =
    products.find(
      (product) => product.id === activeProductId
    ) ?? products[0];

  const selected = useMemo(
    () =>
      products
        .flatMap((product) => product.flavours)
        .filter(
          (flavour) =>
            (quantities[flavour.id] || 0) > 0
        )
        .map((flavour) => ({
          ...flavour,
          quantity: quantities[flavour.id],
          lineTotal:
            Number(flavour.price_per_case || 0) *
            quantities[flavour.id]
        })),
    [products, quantities]
  );

  const subtotal = selected.reduce(
    (total, item) => total + item.lineTotal,
    0
  );

  function updateDetail(
    field: keyof Details,
    value: string
  ) {
    setDetails((current) => ({
      ...current,
      [field]: value
    }));
  }

  function setQuantity(
    id: string,
    quantity: number
  ) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, quantity)
    }));
  }

  function validateCurrentStep() {
    setError("");

    if (step === 1) {
      if (
        !details.customerName.trim() ||
        !details.email.includes("@") ||
        !details.phone.trim() ||
        !details.businessType
      ) {
        setError(
          "Complete your name, valid email, phone number, and business type."
        );
        return false;
      }

      if (
        !details.deliveryAddress.trim() ||
        !details.pincode.trim() ||
        !details.deliveryDate
      ) {
        setError(
          "Provide delivery address, valid pincode, and preferred delivery date."
        );
        return false;
      }
    }

    if (step === 2 && selected.length === 0) {
      setError(
        "Select at least one flavour and quantity."
      );
      return false;
    }

    if (
      step === 2 &&
      !staffProfile &&
      !details.referralSource
    ) {
      setError(
        "Select how you heard about us."
      );
      return false;
    }

    const isSalespersonSource =
      details.referralSource === "salesperson" ||
      details.referralSource === "bd";

    if (
      step === 2 &&
      !staffProfile &&
      isSalespersonSource &&
      !details.referralBdId
    ) {
      setError(
        "Select the salesperson who referred you."
      );
      return false;
    }

    return true;
  }

  async function submitQuote() {
    console.log("========== SUBMIT QUOTE STARTED ==========");

    // =====================================================
    // CONFIRMATION
    // =====================================================

    console.log("Confirmed:", confirmed);

    if (!confirmed) {
      console.log("STOPPED: confirmation checkbox not checked");

      setError(
        "Confirm that the order details are correct."
      );

      return;
    }

    setSubmitting(true);
    setError("");

    // =====================================================
    // GET CUSTOMER SESSION
    // =====================================================

    const customerSession =
      window.localStorage.getItem("customer_user");

    console.log(
      "customer_user:",
      customerSession
        ? "FOUND"
        : "NOT FOUND"
    );

    let customer: {
      id?: string;
      token?: string;
      email?: string;
    } | null = null;

    try {
      customer = customerSession
        ? JSON.parse(customerSession)
        : null;
    } catch (error) {
      console.error(
        "Failed to parse customer_user:",
        error
      );

      customer = null;
    }

    // =====================================================
    // GET TOKEN
    // =====================================================

    const jwt =
      window.localStorage.getItem("jwt");

    const accessToken =
      customer?.token ||
      jwt ||
      undefined;

    console.log(
      "Customer ID:",
      customer?.id || "MISSING"
    );

    console.log(
      "Customer email:",
      customer?.email || "MISSING"
    );

    console.log(
      "JWT:",
      accessToken
        ? "TOKEN FOUND"
        : "TOKEN MISSING"
    );

    // =====================================================
    // AUTH CHECK
    // =====================================================

    if (!accessToken) {
      console.log(
        "STOPPED: No authentication token"
      );

      setSubmitting(false);

      window.location.href =
        "/login?message=plz_login_to_adda_quote";

      return;
    }

    // =====================================================
    // REFERRAL
    // =====================================================

    const isSalespersonSource =
      details.referralSource === "salesperson" ||
      details.referralSource === "bd";

    const selectedBd = team.find(
      (member) =>
        member.id === details.referralBdId
    );

    console.log(
      "Referral source:",
      details.referralSource
    );

    console.log(
      "Selected BD:",
      selectedBd
    );

    // =====================================================
    // CREATE PAYLOAD
    // =====================================================

    const payload = {
      contactName:
        details.customerName.trim(),

      email:
        details.email.trim(),

      phone:
        details.phone.trim(),

      businessName:
        details.businessName.trim() || null,

      businessType:
        details.businessType,

      deliveryAddress:
        details.deliveryAddress.trim(),

      pincode:
        details.pincode.trim(),

      deliveryDate:
        details.deliveryDate,

      referralSource:
        isSalespersonSource
          ? "salesperson"
          : details.referralSource,

      referralName:
        isSalespersonSource
          ? selectedBd?.name ||
            details.referralName ||
            null
          : null,

      referralEmail:
        isSalespersonSource
          ? selectedBd?.email || null
          : null,

      deliveryNote:
        details.note.trim() || null,

      items: selected.map((item) => ({
        productId: Number(
          item.product_id ||
            activeProduct?.id
        ),

        flavourId:
          Number(item.id),

        flavourName:
          item.name,

        quantity:
          item.quantity,
      })),
    };

    // =====================================================
    // DEBUG PAYLOAD
    // =====================================================

    console.log(
      "========== ORDER REQUEST =========="
    );

    console.log(
      "API BASE:",
      ORDERS_API_BASE
    );

    console.log(
      "REQUEST URL:",
      `${ORDERS_API_BASE}/api/orders`
    );

    console.log(
      "PAYLOAD:",
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    console.log(
      "==================================="
    );

    // =====================================================
    // SEND REQUEST
    // =====================================================

    try {
      const response =
        await fetch(
          `${ORDERS_API_BASE}/api/orders`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(payload),

            cache:
              "no-store",
          }
        );

      console.log(
        "ORDER RESPONSE STATUS:",
        response.status
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "ORDER RESPONSE:",
        data
      );

      // =====================================================
      // BACKEND ERROR
      // =====================================================

      if (!response.ok) {
        setSubmitting(false);

        const backendMessage =
          data?.message ||
          data?.error ||
          (Array.isArray(data?.errors)
            ? data.errors.join(" ")
            : null);

        setError(
          backendMessage ||
            `Unable to submit request. Status: ${response.status}`
        );

        return;
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      const orderData =
        data?.data || data;

      const quoteNum =
        orderData?.quoteNumber ||
        orderData?.quote_number ||
        `SS-${Date.now()}`;

      console.log(
        "ORDER CREATED SUCCESSFULLY:",
        orderData
      );

      // Clear saved form state

      window.sessionStorage.removeItem(
        "quoteStep"
      );

      window.sessionStorage.removeItem(
        "quoteProductId"
      );

      window.sessionStorage.removeItem(
        "quoteDetails"
      );

      window.sessionStorage.removeItem(
        "quoteQuantities"
      );

      setSubmitting(false);

      setResult({
        quoteNumber:
          String(quoteNum),

        trackUrl:
          "/track",
      });

    } catch (error) {
      console.error(
        "ORDER SUBMISSION ERROR:",
        error
      );

      setSubmitting(false);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to order service. Please try again."
      );
    }
  }

  if (result) {
    return (
      <div className="quote-success">
        <span>REQUEST RECEIVED</span>

        <h1>Thank you.</h1>

        <p>
          Your quote number is{" "}
          <strong>{result.quoteNumber}</strong>.
        </p>

        <p>
          Our team will call you within 24 hours
          to confirm pricing and availability.
        </p>

        <a
          className="button primary"
          href="/"
        >
          Back to homepage
        </a>
      </div>
    );
  }

  const isSalesperson =
    details.referralSource === "salesperson" ||
    details.referralSource === "bd";

  return (
    <div className="quote-shell">
      <div className="quote-header">
        <div>
          <span>WHOLESALE REQUEST</span>

          <h1>Request a quote.</h1>

          <p>
            No online payment. We confirm every
            order by phone.
          </p>
        </div>

        <div className="step-indicator">
          {[1, 2, 3].map((number) => (
            <button
              type="button"
              key={number}
              className={
                step === number
                  ? "active"
                  : step > number
                  ? "done"
                  : ""
              }
              onClick={() =>
                number < step &&
                setStep(number)
              }
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      <div className="quote-body">
        <div className="quote-main">
          {step === 1 && (
            <div className="form-grid">
              <label>
                Contact name
                <input
                  value={details.customerName}
                  onChange={(event) =>
                    updateDetail(
                      "customerName",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={details.email}
                  onChange={(event) =>
                    updateDetail(
                      "email",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Phone
                <input
                  value={details.phone}
                  onChange={(event) =>
                    updateDetail(
                      "phone",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Delivery address
                <input
                  value={
                    details.deliveryAddress
                  }
                  onChange={(event) =>
                    updateDetail(
                      "deliveryAddress",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Pincode
                <input
                  value={details.pincode}
                  onChange={(event) =>
                    updateDetail(
                      "pincode",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Preferred delivery date
                <input
                  type="date"
                  value={
                    details.deliveryDate
                  }
                  onChange={(event) =>
                    updateDetail(
                      "deliveryDate",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Business name{" "}
                <small>Optional</small>
                <input
                  value={
                    details.businessName
                  }
                  onChange={(event) =>
                    updateDetail(
                      "businessName",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="full">
                Business type

                <select
                  value={
                    details.businessType
                  }
                  onChange={(event) =>
                    updateDetail(
                      "businessType",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select business type
                  </option>

                  <option value="hotel">
                    Hotel
                  </option>

                  <option value="restaurant">
                    Restaurant
                  </option>

                  <option value="shopkeeper">
                    Retail / Shopkeeper
                  </option>

                  <option value="corporate">
                    Corporate office
                  </option>

                  <option value="cinema">
                    Cinema / Venue
                  </option>

                  <option value="event">
                    Event planner
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <>
              <div
                className="quote-product-picker"
                role="tablist"
                aria-label="Products"
              >
                {products.map((product) => (
                  <button
                    type="button"
                    className={`quote-product ${
                      activeProduct?.id ===
                      product.id
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveProductId(
                        product.id
                      )
                    }
                    key={product.id}
                    role="tab"
                    aria-selected={
                      activeProduct?.id ===
                      product.id
                    }
                  >
                    {product.image_url && (
                      <Image
                        className="product-card-image"
                        src={
                          product.image_url
                        }
                        alt={product.name}
                        width={180}
                        height={100}
                        style={{
                          objectFit: "cover"
                        }}
                      />
                    )}

                    <span>
                      {product.name}
                    </span>

                    <strong>
                      {
                        product.flavours
                          .length
                      }{" "}
                      flavours
                    </strong>

                    <small>
                      {product.description ||
                        "Select to view flavours"}
                    </small>
                  </button>
                ))}
              </div>

              <div className="order-options">
                {activeProduct?.flavours.map(
                  (flavour) => {
                    const quantity =
                      quantities[
                        flavour.id
                      ] || 0;

                    return (
                      <article
                        className={
                          quantity
                            ? "selected"
                            : ""
                        }
                        key={flavour.id}
                      >
                        <button
                          type="button"
                          className="flavour-select"
                          onClick={() =>
                            setQuantity(
                              flavour.id,
                              quantity
                                ? 0
                                : 1
                            )
                          }
                        >
                          <span
                            className="flavour-dot"
                            style={{
                              background:
                                flavour.color
                            }}
                          />

                          <span>
                            <strong>
                              {
                                flavour.name
                              }
                            </strong>

                            <small>
                              {formatINR(
                                Number(
                                  flavour.price_per_case ||
                                    0
                                )
                              )}{" "}
                              / case
                            </small>
                          </span>

                          <b>
                            {quantity
                              ? "Selected"
                              : "Add"}
                          </b>
                        </button>

                        {quantity > 0 && (
                          <div className="quantity-control">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(
                                  flavour.id,
                                  quantity - 1
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {quantity} cases
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(
                                  flavour.id,
                                  quantity + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  }
                )}

                {!activeProduct?.flavours
                  .length && (
                  <p className="form-message">
                    No active flavours are
                    available for this product.
                  </p>
                )}
              </div>

              <div className="form-grid quote-notes">
                {staffProfile ? (
                  <label className="full">
                    Handled by

                    <input
                      value={`${staffProfile.full_name ||
                        staffProfile.email} (${staffProfile.role.toUpperCase()})`}
                      disabled
                    />
                  </label>
                ) : (
                  <>
                    <label>
                      How did you hear about us?

                      <select
                        value={
                          details.referralSource
                        }
                        onChange={(event) =>
                          updateDetail(
                            "referralSource",
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select source
                        </option>

                        <option value="salesperson">
                          Salesperson
                        </option>

                        <option value="google">
                          Google
                        </option>

                        <option value="social">
                          Social media
                        </option>

                        <option value="word-of-mouth">
                          Word of mouth
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>
                    </label>

                    {isSalesperson && (
                      <label>
                        Salesperson

                        <select
                          value={
                            details.referralBdId
                          }
                          onChange={(event) => {
                            const member =
                              team.find(
                                (candidate) =>
                                  candidate.id ===
                                  event.target.value
                              );

                            setDetails(
                              (current) => ({
                                ...current,
                                referralBdId:
                                  event.target.value,
                                referralName:
                                  member?.name ||
                                  ""
                              })
                            );
                          }}
                        >
                          <option value="">
                            Select salesperson
                          </option>

                          {team.map(
                            (member) => (
                              <option
                                value={
                                  member.id
                                }
                                key={
                                  member.id
                                }
                              >
                                {member.name}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    )}
                  </>
                )}

                <label className="full">
                  Negotiation or delivery note

                  <textarea
                    rows={4}
                    value={details.note}
                    onChange={(event) =>
                      updateDetail(
                        "note",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="review-card">
              <div>
                <span>
                  Business details
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setStep(1)
                  }
                >
                  Edit
                </button>
              </div>

              <p>
                <strong>
                  {details.customerName}
                </strong>
                <br />

                {details.email} ·{" "}
                {details.phone}
                <br />

                {details.businessName ||
                  "Business name not provided"}{" "}
                · {details.businessType}
                <br />

                {details.deliveryAddress}
                <br />

                {details.pincode} · Delivery:{" "}
                {details.deliveryDate}
              </p>

              <div>
                <span>
                  Order details
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setStep(2)
                  }
                >
                  Edit
                </button>
              </div>

              {selected.map((item) => (
                <p
                  className="review-line"
                  key={item.id}
                >
                  <span>
                    {item.name} ×{" "}
                    {item.quantity}
                  </span>

                  <strong>
                    {formatINR(
                      item.lineTotal
                    )}
                  </strong>
                </p>
              ))}

              {details.note && (
                <p className="review-note">
                  Note: {details.note}
                </p>
              )}

              <label className="confirm-check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) =>
                    setConfirmed(
                      event.target.checked
                    )
                  }
                />

                I confirm my order details
                are correct.
              </label>
            </div>
          )}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setError("");
                  setStep(step - 1);
                }}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  if (
                    validateCurrentStep()
                  ) {
                    setStep(step + 1);
                  }
                }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                disabled={submitting}
                onClick={submitQuote}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </button>
            )}
          </div>
        </div>

        <aside className="quote-summary">
          <span>LIVE SUMMARY</span>

          {selected.length ? (
            selected.map((item) => (
              <div key={item.id}>
                <p>
                  {item.name} ×{" "}
                  {item.quantity}
                </p>

                <strong>
                  {formatINR(
                    item.lineTotal
                  )}
                </strong>
              </div>
            ))
          ) : (
            <p>
              No flavours selected yet.
            </p>
          )}

          <div className="summary-total">
            <p>Standard subtotal</p>

            <strong>
              {formatINR(subtotal)}
            </strong>
          </div>

          <small>
            Final pricing is confirmed
            after our call.
          </small>
        </aside>
      </div>
    </div>
  );
}
