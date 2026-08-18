"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { stageLabels } from "@/lib/config";
import { formatINR } from "@/lib/flavours";
import Image from "next/image";

type StaffRole = "admin" | "bd";
type BackendRole = "ADMIN" | "BD";

type DashboardQuote = {
  id: string;
  quoteNumber?: string;
  quote_number?: string;
  customerName?: string;
  customer_name?: string;
  businessName?: string;
  business_name?: string;
  businessType?: string;
  business_type?: string;
  status: keyof typeof stageLabels;
  total: number;
  latestInvoiceNumber?: string | null;
  latest_invoice_number?: string | null;
  invoiceVersion?: number;
  invoice_version?: number;
};

type TeamMember = {
  id: number;
  username?: string;
  email: string;
  role: BackendRole;
  isActive?: boolean;
  active?: boolean;
};

type Flavour = {
  id: number;
  productId?: number | null;
  product_id?: string | null;
  name: string;
  note?: string | null;
  pricePerCase?: number;
  price_per_case?: number;
  color: string;
  displayOrder?: number;
  display_order?: number;
  isActive?: boolean;
  is_active?: boolean;
  active?: boolean;
  emoji?: string | null;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  displayOrder?: number | null;
  display_order?: number | null;
  isActive?: boolean;
  is_active?: boolean;
  active?: boolean;
  flavours?: Flavour[];
};

type DashboardData = {
  profile: {
    id?: string | number;
    username?: string;
    email?: string;
    role: BackendRole;
  };
  quotes: DashboardQuote[];
  metrics: {
    total: number;
    open: number;
    delivered: number;
    revenue: number;
  };
  team?: TeamMember[];
  products?: Product[];
  flavours?: Flavour[];
};

type DashboardSection =
  | "dashboard"
  | "orders"
  | "team"
  | "products"
  | "flavours";

type MessageType = "success" | "error";

type FlavourDraft = {
  productId: number | null;
  name: string;
  note: string;
  pricePerCase: number;
  color: string;
  displayOrder: number;
  emoji: string;
};

export default function StaffDashboard({
  requiredRole
}: {
  requiredRole: StaffRole;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("success");
  const [saving, setSaving] =
    useState<string | number>("");
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("dashboard");

  const [editingFlavourId, setEditingFlavourId] =
    useState<number | null>(null);

  const [flavourDraft, setFlavourDraft] =
    useState<FlavourDraft | null>(null);

  const [teamForm, setTeamForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "BD" as BackendRole
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    displayOrder: 0
  });

  const [flavourForm, setFlavourForm] = useState({
    productId: "",
    name: "",
    note: "",
    pricePerCase: 0,
    color: "#2e6fb8",
    displayOrder: 0,
    emoji: ""
  });

  useEffect(() => {
    setMounted(true);

  const accessToken =
    localStorage.getItem("jwt");

  const storedStaff =
    localStorage.getItem("customer_user");

  if (!accessToken || !storedStaff) {
    window.location.href = "/login";
    return;
  }

    try {
      const staff = JSON.parse(storedStaff);
      const role = String(
        staff.role || ""
      ).toUpperCase();

      if (
        (requiredRole === "admin" &&
          role !== "ADMIN") ||
        (requiredRole === "bd" &&
          role !== "BD")
      ) {
        window.location.href =
          role === "ADMIN"
            ? "/admin"
            : "/bd";
        return;
      }

      setToken(accessToken);
    } catch {
      localStorage.removeItem("staff");
      localStorage.removeItem("authToken");
      window.location.href =
        "/staff-login";
    }
  }, [requiredRole]);

  useEffect(() => {
    if (!mounted) return;

    const saved =
      sessionStorage.getItem(
        `dashboardSection:${requiredRole}`
      ) as DashboardSection | null;

    const allowed =
      requiredRole === "admin"
        ? [
            "dashboard",
            "orders",
            "team",
            "products",
            "flavours"
          ]
        : ["dashboard", "orders"];

    if (saved && allowed.includes(saved)) {
      setActiveSection(saved);
    }
  }, [mounted, requiredRole]);

  useEffect(() => {
    if (!mounted) return;

    sessionStorage.setItem(
      `dashboardSection:${requiredRole}`,
      activeSection
    );
  }, [
    activeSection,
    requiredRole,
    mounted
  ]);

  const dashboardKey = token
    ? [
        "admin-dashboard",
        token,
        requiredRole
      ]
    : null;

  const {
    data,
    error,
    mutate,
    isLoading
  } = useSWR<DashboardData>(
    dashboardKey,
    async ([, authToken]) => {
      const response = await fetch(
        "/api/admin/dashboard",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${authToken}`,
            "Content-Type":
              "application/json"
          },
          cache: "no-store"
        }
      );

      const result =
        await response.json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            `Dashboard request failed (${response.status})`
        );
      }

      const quotes =
        Array.isArray(result?.quotes)
          ? result.quotes
          : Array.isArray(result?.orders)
            ? result.orders
            : [];

      const products =
        Array.isArray(result?.products)
          ? result.products.map(
              (product: any) => ({
                ...product,
                isActive:
                  product.isActive ??
                  product.active ??
                  false,
                displayOrder:
                  product.displayOrder ??
                  product.display_order ??
                  0,
                imageUrl:
                  product.imageUrl ??
                  product.image_url ??
                  null
              })
            )
          : [];

      const flavours =
        Array.isArray(result?.flavours)
          ? result.flavours.map(
              (flavour: any) => ({
                ...flavour,
                isActive:
                  flavour.isActive ??
                  flavour.active ??
                  flavour.is_active ??
                  false,
                productId:
                  flavour.productId ??
                  (flavour.product_id
                    ? Number(
                        flavour.product_id
                      )
                    : null),
                pricePerCase:
                  flavour.pricePerCase ??
                  flavour.price_per_case ??
                  0,
                displayOrder:
                  flavour.displayOrder ??
                  flavour.display_order ??
                  0
              })
            )
          : products.flatMap(
              (product: Product) =>
                (product.flavours || []).map(
                  (flavour) => ({
                    ...flavour,
                    productId:
                      product.id,
                    isActive:
                      flavour.isActive ??
                      flavour.active ??
                      false,
                    pricePerCase:
                      flavour.pricePerCase ??
                      flavour.price_per_case ??
                      0,
                    displayOrder:
                      flavour.displayOrder ??
                      flavour.display_order ??
                      0
                  })
                )
            );

      const team =
        Array.isArray(result?.team)
          ? result.team.map(
              (member: any) => ({
                ...member,
                isActive:
                  member.isActive ??
                  member.active ??
                  false
              })
            )
          : [];

      return {
        ...result,
        quotes,
        orders: quotes,
        products,
        flavours,
        team
      };
    },
    {
      dedupingInterval: 15000,
      revalidateOnFocus: true,
      shouldRetryOnError: false
    }
  );

  useEffect(() => {
    if (error) {
      showMessage(
        error.message,
        "error"
      );
    }
  }, [error]);

  useEffect(() => {
    if (!message) return;

    const timer =
      window.setTimeout(() => {
        setMessage("");
      }, 4000);

    return () =>
      window.clearTimeout(timer);
  }, [message]);

  function showMessage(
    text: string,
    type: MessageType
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function signOut() {
    localStorage.removeItem(
      "authToken"
    );
    localStorage.removeItem(
      "staff"
    );
    sessionStorage.removeItem(
      "authToken"
    );

    window.location.href =
      "/staff-login";
  }

  async function adminRequest(
    url: string,
    method:
      | "POST"
      | "PUT"
      | "PATCH"
      | "DELETE",
    body?: unknown
  ) {
    if (!token) {
      throw new Error(
        "Login required."
      );
    }

    const response = await fetch(
      url,
      {
        method,
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`
        },
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
        cache: "no-store"
      }
    );

    const result =
      await response.json()
        .catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          result?.message ||
          `Request failed (${response.status})`
      );
    }

    return result;
  }

  async function refreshDashboard() {
    await mutate();
  }

  async function createProduct() {
    setSaving("product");

    try {
      await adminRequest(
        "/api/admin/product",
        "POST",
        {
          name:
            productForm.name.trim(),
          description:
            productForm.description.trim(),
          imageUrl:
            productForm.imageUrl.trim(),
          displayOrder:
            Number(
              productForm.displayOrder
            )
        }
      );

      setProductForm({
        name: "",
        description: "",
        imageUrl: "",
        displayOrder: 0
      });

      await refreshDashboard();

      showMessage(
        "Product created successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to create product.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function updateProduct(
    product: Product,
    patch: Partial<Product>
  ) {
    setSaving(product.id);

    try {
      await adminRequest(
        "/api/admin/product",
        "PATCH",
        {
          id: product.id,
          name:
            patch.name ??
            product.name,
          description:
            patch.description ??
            product.description ??
            "",
          imageUrl:
            patch.imageUrl ??
            product.imageUrl ??
            "",
          displayOrder:
            patch.displayOrder ??
            product.displayOrder ??
            0,
          isActive:
            patch.isActive ??
            product.isActive ??
            false
        }
      );

      await refreshDashboard();

      showMessage(
        "Product updated successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update product.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function deleteProduct(
    product: Product
  ) {
    if (
      !window.confirm(
        `Delete ${product.name}?`
      )
    ) {
      return;
    }

    setSaving(product.id);

    try {
      await adminRequest(
        "/api/admin/product",
        "DELETE",
        {
          id: product.id
        }
      );

      await refreshDashboard();

      showMessage(
        "Product deleted successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete product.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function createFlavour() {
    setSaving("flavour");

    try {
      const productId =
        flavourForm.productId ||
        data?.products?.[0]?.id;

      if (!productId) {
        throw new Error(
          "Please create a product first."
        );
      }

      if (!flavourForm.name.trim()) {
        throw new Error(
          "Flavour name is required."
        );
      }

      if (
        Number(
          flavourForm.pricePerCase
        ) <= 0
      ) {
        throw new Error(
          "Price per case must be greater than 0."
        );
      }

      await adminRequest(
        "/api/admin/flavour",
        "POST",
        {
          productId:
            Number(productId),
          name:
            flavourForm.name.trim(),
          note:
            flavourForm.note.trim(),
          pricePerCase:
            Number(
              flavourForm.pricePerCase
            ),
          color:
            flavourForm.color,
          displayOrder:
            Number(
              flavourForm.displayOrder
            ),
          emoji:
            flavourForm.emoji.trim(),
          isActive: true
        }
      );

      setFlavourForm({
        productId: "",
        name: "",
        note: "",
        pricePerCase: 0,
        color: "#2e6fb8",
        displayOrder: 0,
        emoji: ""
      });

      await refreshDashboard();

      showMessage(
        "Flavour created successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to create flavour.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  function startEditFlavour(
    flavour: Flavour
  ) {
    setEditingFlavourId(
      flavour.id
    );

    setFlavourDraft({
      productId:
        flavour.productId ??
        (flavour.product_id
          ? Number(
              flavour.product_id
            )
          : null),
      name:
        flavour.name,
      note:
        flavour.note ?? "",
      pricePerCase:
        Number(
          flavour.pricePerCase ??
            flavour.price_per_case ??
            0
        ),
      color:
        flavour.color || "#2e6fb8",
      displayOrder:
        Number(
          flavour.displayOrder ??
            flavour.display_order ??
            0
        ),
      emoji:
        flavour.emoji ?? ""
    });
  }

  function cancelEditFlavour() {
    setEditingFlavourId(null);
    setFlavourDraft(null);
  }

  async function saveFlavourUpdate(
    flavour: Flavour
  ) {
    if (!flavourDraft) {
      return;
    }

    setSaving(flavour.id);

    try {
      if (!flavourDraft.name.trim()) {
        throw new Error(
          "Flavour name is required."
        );
      }

      if (
        Number(
          flavourDraft.pricePerCase
        ) <= 0
      ) {
        throw new Error(
          "Price per case must be greater than 0."
        );
      }

      await adminRequest(
        "/api/admin/flavour",
        "PATCH",
        {
          id: flavour.id,
          productId:
            flavourDraft.productId,
          name:
            flavourDraft.name.trim(),
          note:
            flavourDraft.note.trim(),
          pricePerCase:
            Number(
              flavourDraft.pricePerCase
            ),
          color:
            flavourDraft.color,
          displayOrder:
            Number(
              flavourDraft.displayOrder
            ),
          isActive:
            flavour.isActive ??
            flavour.active ??
            false,
          emoji:
            flavourDraft.emoji.trim()
        }
      );

      cancelEditFlavour();

      await refreshDashboard();

      showMessage(
        "Flavour updated successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update flavour.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function toggleFlavour(
    flavour: Flavour
  ) {
    setSaving(flavour.id);

    try {
      await adminRequest(
        "/api/admin/flavour",
        "PATCH",
        {
          id: flavour.id,
          productId:
            flavour.productId ??
            (flavour.product_id
              ? Number(
                  flavour.product_id
                )
              : null),
          name:
            flavour.name,
          note:
            flavour.note ?? "",
          pricePerCase:
            Number(
              flavour.pricePerCase ??
                flavour.price_per_case ??
                0
            ),
          color:
            flavour.color,
          displayOrder:
            Number(
              flavour.displayOrder ??
                flavour.display_order ??
                0
            ),
          isActive:
            !(flavour.isActive ??
              flavour.active ??
              false),
          emoji:
            flavour.emoji ?? ""
        }
      );

      await refreshDashboard();

      showMessage(
        (flavour.isActive ??
          flavour.active ??
          false)
          ? "Flavour deactivated."
          : "Flavour activated.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update flavour.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function deleteFlavour(
    flavour: Flavour
  ) {
    if (
      !window.confirm(
        `Delete ${flavour.name}?`
      )
    ) {
      return;
    }

    setSaving(flavour.id);

    try {
      await adminRequest(
        "/api/admin/flavour",
        "DELETE",
        {
          id: flavour.id,
          productId:
            flavour.productId ??
            (flavour.product_id
              ? Number(
                  flavour.product_id
                )
              : null)
        }
      );

      await refreshDashboard();

      showMessage(
        "Flavour deleted successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete flavour.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function createTeamMember() {
    setSaving("team");

    try {
      await adminRequest(
        "/api/admin/auth",
        "POST",
        {
          username:
            teamForm.username.trim(),
          email:
            teamForm.email.trim(),
          password:
            teamForm.password,
          role:
            teamForm.role
        }
      );

      setTeamForm({
        username: "",
        email: "",
        password: "",
        role: "BD"
      });

      await refreshDashboard();

      showMessage(
        "Team member created successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to create team member.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function updateTeamRole(
    member: TeamMember
  ) {
    setSaving(member.id);

    try {
      const newRole: BackendRole =
        member.role === "ADMIN"
          ? "BD"
          : "ADMIN";

      await adminRequest(
        `/api/admin/auth/${member.id}?action=role`,
        "PATCH"
      );

      await refreshDashboard();

      showMessage(
        `User role changed to ${newRole}.`,
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update user role.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  async function updateTeamStatus(
    member: TeamMember
  ) {
    setSaving(member.id);

    try {
      await adminRequest(
        `/api/admin/auth/${member.id}?action=status`,
        "PATCH"
      );

      await refreshDashboard();

      const active =
        member.isActive ??
        member.active ??
        false;

      showMessage(
        active
          ? "User deactivated successfully."
          : "User activated successfully.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update user status.",
        "error"
      );
    } finally {
      setSaving("");
    }
  }

  const isAdmin =
    requiredRole === "admin";

  const navItems: Array<{
    id: DashboardSection;
    label: string;
  }> = [
    {
      id: "dashboard",
      label: "Dashboard"
    },
    {
      id: "orders",
      label: isAdmin
        ? "All orders"
        : "My orders"
    },
    ...(isAdmin
      ? [
          {
            id: "team" as const,
            label: "Team"
          },
          {
            id: "products" as const,
            label: "Products"
          },
          {
            id: "flavours" as const,
            label: "Flavours"
          }
        ]
      : [])
  ];

  if (!mounted) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <div className="setup-card">
            <h2>
              Loading staff workspace...
            </h2>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <a href="/">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={72}
            height={72}
          />
        </a>

        <span>
          {isAdmin
            ? "ADMIN"
            : "BUSINESS DEVELOPMENT"}
        </span>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-tab ${
                activeSection === item.id
                  ? "active"
                  : ""
              }`}
              aria-current={
                activeSection === item.id
                  ? "page"
                  : undefined
              }
              onClick={() =>
                setActiveSection(
                  item.id
                )
              }
            >
              {item.label}
            </button>
          ))}

          <a href="/quote">
            Submit customer order
          </a>

          <button
            type="button"
            className="sign-out-button"
            onClick={signOut}
          >
            Sign out
          </button>
        </nav>
      </aside>

      <section className="dashboard-content">
        <header>
          <div>
            <span>
              {isAdmin
                ? "FOUNDER CONTROL PANEL"
                : "SALES WORKSPACE"}
            </span>

            <h1>
              {isAdmin
                ? "Operations dashboard."
                : "Your customers."}
            </h1>
          </div>

          <a
            className="button primary"
            href="/quote"
          >
            New quote
          </a>
        </header>

        {message && (
          <div
            className={`dashboard-toast ${
              messageType === "success"
                ? "dashboard-toast-success"
                : "dashboard-toast-error"
            }`}
          >
            <span>
              {messageType === "success"
                ? "✓"
                : "!"}
            </span>
            {message}
          </div>
        )}

        {!data ? (
          <div className="setup-card">
            <h2>
              {isLoading
                ? "Loading staff workspace..."
                : "Unable to load dashboard"}
            </h2>

            <p>
              {error?.message ||
                "Staff data is protected by your Spring Security JWT and role."}
            </p>
          </div>
        ) : (
          <>
            {activeSection ===
              "dashboard" && (
              <div
                className={`metric-grid ${
                  isAdmin ? "" : "three"
                }`}
              >
                <article>
                  <span>
                    {isAdmin
                      ? "Total orders"
                      : "My orders"}
                  </span>
                  <strong>
                    {data.metrics.total}
                  </strong>
                </article>

                <article>
                  <span>
                    Open orders
                  </span>
                  <strong>
                    {data.metrics.open}
                  </strong>
                </article>

                {isAdmin && (
                  <article>
                    <span>
                      Delivered
                    </span>
                    <strong>
                      {data.metrics.delivered}
                    </strong>
                  </article>
                )}

                <article>
                  <span>
                    {isAdmin
                      ? "Delivered revenue"
                      : "Delivered value"}
                  </span>

                  <strong>
                    {formatINR(
                      data.metrics.revenue
                    )}
                  </strong>
                </article>
              </div>
            )}

            {activeSection ===
              "orders" && (
              <section
                className="dashboard-table"
                id="orders"
              >
                <div className="table-title">
                  <h2>
                    {isAdmin
                      ? "Recent orders"
                      : "Assigned orders"}
                  </h2>

                  <input
                    placeholder="Search orders"
                  />
                </div>

                <div
                  className={`table-row table-head ${
                    isAdmin
                      ? ""
                      : "bd-table"
                  }`}
                >
                  <span>Quote</span>
                  <span>Customer</span>
                  <span>Business</span>
                  <span>Status</span>
                  <span>Total</span>
                  <span>Action</span>
                </div>

                {data.quotes.map(
                  (quote) => {
                    const quoteNumber =
                      quote.quoteNumber ??
                      quote.quote_number ??
                      "";

                    const customerName =
                      quote.customerName ??
                      quote.customer_name ??
                      "";

                    const businessName =
                      quote.businessName ??
                      quote.business_name;

                    const businessType =
                      quote.businessType ??
                      quote.business_type ??
                      "";

                    const invoiceNumber =
                      quote.latestInvoiceNumber ??
                      quote.latest_invoice_number;

                    const invoiceVersion =
                      quote.invoiceVersion ??
                      quote.invoice_version;

                    return (
                      <div
                        className={`table-row ${
                          isAdmin
                            ? ""
                            : "bd-table"
                        }`}
                        key={quote.id}
                      >
                        <strong>
                          {quoteNumber}
                        </strong>

                        <span>
                          {customerName}

                          {!isAdmin && (
                            <small>
                              {businessName}
                            </small>
                          )}
                        </span>

                        <span>
                          {businessName ||
                            businessType}
                        </span>

                        <span
                          className={`status status-${quote.status}`}
                        >
                          {
                            stageLabels[
                              quote.status
                            ]
                          }
                        </span>

                        <strong>
                          {formatINR(
                            quote.total
                          )}

                          <small>
                            {invoiceNumber ||
                              (invoiceVersion
                                ? `Invoice v${invoiceVersion}`
                                : "No invoice yet")}
                          </small>
                        </strong>

                        <a
                          className="table-action"
                          href={`/orders/${quoteNumber}`}
                        >
                          Edit
                        </a>
                      </div>
                    );
                  }
                )}
              </section>
            )}

            {isAdmin &&
              activeSection ===
                "team" && (
              <section
                className="admin-grid"
                id="team"
              >
                <div className="setup-card">
                  <span>TEAM</span>

                  <h2>
                    Add staff user
                  </h2>

                  <div className="form-grid admin-form">
                    <label>
                      Username
                      <input
                        value={
                          teamForm.username
                        }
                        onChange={(event) =>
                          setTeamForm({
                            ...teamForm,
                            username:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Email
                      <input
                        type="email"
                        value={
                          teamForm.email
                        }
                        onChange={(event) =>
                          setTeamForm({
                            ...teamForm,
                            email:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Password
                      <input
                        type="password"
                        value={
                          teamForm.password
                        }
                        onChange={(event) =>
                          setTeamForm({
                            ...teamForm,
                            password:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Role
                      <select
                        value={
                          teamForm.role
                        }
                        onChange={(event) =>
                          setTeamForm({
                            ...teamForm,
                            role:
                              event.target
                                .value as BackendRole
                          })
                        }
                      >
                        <option value="BD">
                          BD
                        </option>

                        <option value="ADMIN">
                          ADMIN
                        </option>
                      </select>
                    </label>
                  </div>

                  <button
                    type="button"
                    className="button primary"
                    disabled={
                      saving === "team"
                    }
                    onClick={
                      createTeamMember
                    }
                  >
                    {saving === "team"
                      ? "Creating..."
                      : "Create user"}
                  </button>
                </div>

                <div className="dashboard-table compact-table">
                  <div className="table-title">
                    <h2>
                      Current team
                    </h2>
                  </div>

                  {data.team?.map(
                    (member) => {
                      const active =
                        member.isActive ??
                        member.active ??
                        false;

                      return (
                        <div
                          className="table-row team-row"
                          key={member.id}
                        >
                          <strong>
                            {member.username ||
                              member.email}

                            <small>
                              {member.email}
                            </small>
                          </strong>

                          <span>
                            {member.role}
                          </span>

                          <span
                            className={`status ${
                              active
                                ? "status-delivered"
                                : "status-cancelled"
                            }`}
                          >
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <button
                            type="button"
                            className="table-action"
                            disabled={
                              saving ===
                              member.id
                            }
                            onClick={() =>
                              updateTeamRole(
                                member
                              )
                            }
                          >
                            {member.role ===
                            "ADMIN"
                              ? "Make BD"
                              : "Make admin"}
                          </button>

                          <button
                            type="button"
                            className="table-action"
                            disabled={
                              saving ===
                              member.id
                            }
                            onClick={() =>
                              updateTeamStatus(
                                member
                              )
                            }
                          >
                            {active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      );
                    }
                  )}

                  {!data.team?.length && (
                    <div className="setup-card">
                      <p>
                        No staff members
                        found.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {isAdmin &&
              activeSection ===
                "products" && (
              <section
                className="admin-grid"
                id="products"
              >
                <div className="setup-card">
                  <span>PRODUCTS</span>

                  <h2>
                    Add product
                  </h2>

                  <div className="form-grid admin-form">
                    <label>
                      Name
                      <input
                        value={
                          productForm.name
                        }
                        onChange={(event) =>
                          setProductForm({
                            ...productForm,
                            name:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Display order
                      <input
                        type="number"
                        min="0"
                        value={
                          productForm.displayOrder
                        }
                        onChange={(event) =>
                          setProductForm({
                            ...productForm,
                            displayOrder:
                              Number(
                                event.target
                                  .value
                              )
                          })
                        }
                      />
                    </label>

                    <label className="full">
                      Product image URL
                      <input
                        value={
                          productForm.imageUrl
                        }
                        onChange={(event) =>
                          setProductForm({
                            ...productForm,
                            imageUrl:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label className="full">
                      Description
                      <textarea
                        value={
                          productForm.description
                        }
                        onChange={(event) =>
                          setProductForm({
                            ...productForm,
                            description:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="button primary"
                    disabled={
                      saving ===
                      "product"
                    }
                    onClick={
                      createProduct
                    }
                  >
                    {saving ===
                    "product"
                      ? "Creating..."
                      : "Create product"}
                  </button>
                </div>

                <div className="dashboard-table compact-table">
                  <div className="table-title">
                    <h2>
                      Products
                    </h2>
                  </div>

                  {data.products?.map(
                    (product) => {
                      const active =
                        product.isActive ??
                        product.active ??
                        false;

                      return (
                        <div
                          className="table-row product-row"
                          key={product.id}
                        >
                          <strong>
                            {product.name}

                            <small>
                              {product.description ||
                                "No description"}
                            </small>
                          </strong>

                          <input
                            defaultValue={
                              product.imageUrl ??
                              product.image_url ??
                              ""
                            }
                            placeholder="Image URL"
                            onBlur={(event) =>
                              updateProduct(
                                product,
                                {
                                  imageUrl:
                                    event.target
                                      .value
                                }
                              )
                            }
                          />

                          <input
                            type="number"
                            min="0"
                            defaultValue={
                              product.displayOrder ??
                              product.display_order ??
                              0
                            }
                            onBlur={(event) =>
                              updateProduct(
                                product,
                                {
                                  displayOrder:
                                    Number(
                                      event.target
                                        .value
                                    )
                                }
                              )
                            }
                          />

                          <span
                            className={`status ${
                              active
                                ? "status-delivered"
                                : "status-cancelled"
                            }`}
                          >
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <button
                            type="button"
                            className="table-action"
                            disabled={
                              saving ===
                              product.id
                            }
                            onClick={() =>
                              updateProduct(
                                product,
                                {
                                  isActive:
                                    !active
                                }
                              )
                            }
                          >
                            {active
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="table-action danger-action"
                            disabled={
                              saving ===
                              product.id
                            }
                            onClick={() =>
                              deleteProduct(
                                product
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            {isAdmin &&
              activeSection ===
                "flavours" && (
              <>
                <section
                  className="setup-card"
                  id="flavours"
                >
                  <span>FLAVOURS</span>

                  <h2>
                    Add flavour and pricing
                  </h2>

                  <div className="form-grid admin-form">
                    <label>
                      Product
                      <select
                        value={
                          flavourForm.productId
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            productId:
                              event.target
                                .value
                          })
                        }
                      >
                        <option value="">
                          Select product
                        </option>

                        {data.products?.map(
                          (product) => (
                            <option
                              value={
                                product.id
                              }
                              key={
                                product.id
                              }
                            >
                              {product.name}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Name
                      <input
                        value={
                          flavourForm.name
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            name:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Price per case
                      <input
                        type="number"
                        min="0"
                        value={
                          flavourForm.pricePerCase
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            pricePerCase:
                              Number(
                                event.target
                                  .value
                              )
                          })
                        }
                      />
                    </label>

                    <label>
                      Color
                      <input
                        type="color"
                        value={
                          flavourForm.color
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            color:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Display order
                      <input
                        type="number"
                        min="0"
                        value={
                          flavourForm.displayOrder
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            displayOrder:
                              Number(
                                event.target
                                  .value
                              )
                          })
                        }
                      />
                    </label>

                    <label>
                      Note
                      <input
                        value={
                          flavourForm.note
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            note:
                              event.target
                                .value
                          })
                        }
                      />
                    </label>

                    <label>
                      Emoji
                      <input
                        value={
                          flavourForm.emoji
                        }
                        onChange={(event) =>
                          setFlavourForm({
                            ...flavourForm,
                            emoji:
                              event.target
                                .value
                          })
                        }
                        placeholder="e.g. 🍋"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="button primary"
                    disabled={
                      saving ===
                      "flavour"
                    }
                    onClick={
                      createFlavour
                    }
                  >
                    {saving ===
                    "flavour"
                      ? "Creating..."
                      : "Create flavour"}
                  </button>
                </section>

                <section className="dashboard-table compact-table">
                  <div className="table-title">
                    <h2>
                      Flavour pricing
                    </h2>
                  </div>

                  {data.flavours?.map(
                    (flavour) => {
                      const active =
                        flavour.isActive ??
                        flavour.active ??
                        flavour.is_active ??
                        false;

                      const isEditing =
                        editingFlavourId ===
                        flavour.id;

                      return (
                        <div
                          className={`flavour-pricing-row ${
                            isEditing
                              ? "editing"
                              : ""
                          }`}
                          key={flavour.id}
                        >
                          {!isEditing ? (
                            <>
                              <span
                                className="flavour-dot"
                                style={{
                                  background:
                                    flavour.color
                                }}
                              />

                              <div className="flavour-info">
                                <strong>
                                  {flavour.emoji
                                    ? `${flavour.emoji} `
                                    : ""}
                                  {flavour.name}
                                </strong>

                                <small>
                                  {flavour.note ||
                                    "No note"}
                                </small>
                              </div>

                              <span className="flavour-product">
                                {data.products?.find(
                                  (product) =>
                                    product.id ===
                                    flavour.productId
                                )?.name ||
                                  "No product"}
                              </span>

                              <span className="flavour-price">
                                {formatINR(
                                  Number(
                                    flavour.pricePerCase ??
                                      flavour.price_per_case ??
                                      0
                                  )
                                )}
                              </span>

                              <span
                                className={`status flavour-status ${
                                  active
                                    ? "status-delivered"
                                    : "status-cancelled"
                                }`}
                              >
                                {active
                                  ? "Active"
                                  : "Inactive"}
                              </span>

                              <div className="flavour-actions">
                                <button
                                  type="button"
                                  className="table-action"
                                  disabled={
                                    saving ===
                                    flavour.id
                                  }
                                  onClick={() =>
                                    startEditFlavour(
                                      flavour
                                    )
                                  }
                                >
                                  Update
                                </button>

                                <button
                                  type="button"
                                  className="table-action"
                                  disabled={
                                    saving ===
                                    flavour.id
                                  }
                                  onClick={() =>
                                    toggleFlavour(
                                      flavour
                                    )
                                  }
                                >
                                  {active
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  className="table-action danger-action"
                                  disabled={
                                    saving ===
                                    flavour.id
                                  }
                                  onClick={() =>
                                    deleteFlavour(
                                      flavour
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <span
                                className="flavour-dot"
                                style={{
                                  background:
                                    flavourDraft?.color ||
                                    flavour.color
                                }}
                              />

                              <div className="flavour-edit-grid">
                                <input
                                  value={
                                    flavourDraft?.name ??
                                    ""
                                  }
                                  placeholder="Flavour name"
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              name:
                                                event
                                                  .target
                                                  .value
                                            }
                                          : null
                                    )
                                  }
                                />

                                <input
                                  value={
                                    flavourDraft?.note ??
                                    ""
                                  }
                                  placeholder="Note"
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              note:
                                                event
                                                  .target
                                                  .value
                                            }
                                          : null
                                    )
                                  }
                                />

                                <select
                                  value={
                                    flavourDraft?.productId ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              productId:
                                                event
                                                  .target
                                                  .value
                                                  ? Number(
                                                      event
                                                        .target
                                                        .value
                                                    )
                                                  : null
                                            }
                                          : null
                                    )
                                  }
                                >
                                  <option value="">
                                    No product
                                  </option>

                                  {data.products?.map(
                                    (product) => (
                                      <option
                                        key={
                                          product.id
                                        }
                                        value={
                                          product.id
                                        }
                                      >
                                        {product.name}
                                      </option>
                                    )
                                  )}
                                </select>

                                <input
                                  value={
                                    flavourDraft?.emoji ??
                                    ""
                                  }
                                  placeholder="Emoji"
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              emoji:
                                                event
                                                  .target
                                                  .value
                                            }
                                          : null
                                    )
                                  }
                                />

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    flavourDraft?.pricePerCase ??
                                    0
                                  }
                                  placeholder="Price"
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              pricePerCase:
                                                Number(
                                                  event
                                                    .target
                                                    .value
                                                )
                                            }
                                          : null
                                    )
                                  }
                                />

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    flavourDraft?.displayOrder ??
                                    0
                                  }
                                  placeholder="Display order"
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              displayOrder:
                                                Number(
                                                  event
                                                    .target
                                                    .value
                                                )
                                            }
                                          : null
                                    )
                                  }
                                />

                                <input
                                  type="color"
                                  value={
                                    flavourDraft?.color ??
                                    "#2e6fb8"
                                  }
                                  onChange={(event) =>
                                    setFlavourDraft(
                                      (draft) =>
                                        draft
                                          ? {
                                              ...draft,
                                              color:
                                                event
                                                  .target
                                                  .value
                                            }
                                          : null
                                    )
                                  }
                                />
                              </div>

                              <div className="flavour-actions">
                                <button
                                  type="button"
                                  className="table-action save-action"
                                  disabled={
                                    saving ===
                                    flavour.id
                                  }
                                  onClick={() =>
                                    saveFlavourUpdate(
                                      flavour
                                    )
                                  }
                                >
                                  {saving ===
                                  flavour.id
                                    ? "Saving..."
                                    : "Save update"}
                                </button>

                                <button
                                  type="button"
                                  className="table-action"
                                  disabled={
                                    saving ===
                                    flavour.id
                                  }
                                  onClick={
                                    cancelEditFlavour
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                  )}

                  {!data.flavours?.length && (
                    <div className="setup-card">
                      <p>
                        No flavours found.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}