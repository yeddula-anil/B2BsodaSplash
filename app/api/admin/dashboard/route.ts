import { NextResponse } from "next/server";

const AUTH_SERVICE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

const ORDER_SERVICE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

function getAuthorization(request: Request) {
  return request.headers.get("authorization") || "";
}

function getJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    );
  } catch {
    return null;
  }
}

async function fetchService(
  url: string,
  authorization: string
) {
  console.log("SERVICE REQUEST:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  console.log(
    "SERVICE RESPONSE:",
    response.status,
    url,
    data
  );

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Service request failed: ${response.status}`
    );
  }

  return data;
}

export async function GET(request: Request) {
  try {
    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    const authorization = getAuthorization(request);

    if (!authorization) {
      return NextResponse.json(
        {
          error: "Authorization token is required.",
        },
        { status: 401 }
      );
    }

    const token = authorization.replace(
      /^Bearer\s+/i,
      ""
    );

    if (!token) {
      return NextResponse.json(
        {
          error: "Authorization token is required.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       JWT
    ===================================================== */

    const jwtPayload = getJwtPayload(token);

    if (!jwtPayload) {
      return NextResponse.json(
        {
          error: "Invalid authentication token.",
        },
        { status: 401 }
      );
    }

    const role = String(
      jwtPayload.role || ""
    ).toUpperCase();

    const userEmail = String(
      jwtPayload.email || ""
    )
      .trim()
      .toLowerCase();

    console.log("ROLE:", role);
    console.log("EMAIL:", userEmail);

    /* =====================================================
       ROLE CHECK
    ===================================================== */

    if (
      role !== "ADMIN" &&
      role !== "BD"
    ) {
      return NextResponse.json(
        {
          error: "Staff access required.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       PROFILE
    ===================================================== */

    const profile = {
      id: jwtPayload.sub,
      username: jwtPayload.username,
      email: jwtPayload.email,
      role,
    };

    /* =====================================================
       ORDERS

       ADMIN:
       GET /api/orders

       BD:
       GET /api/orders/by-referral-email?email=BD_EMAIL

       IMPORTANT:
       The Order Service currently returns the orders
       array directly, not { data: [...] }.
    ===================================================== */

    let orders: any[] = [];

    try {
      /* ===================================================
         ADMIN
      =================================================== */

      if (role === "ADMIN") {
        console.log(
          "ADMIN: Fetching all orders"
        );

        const result = await fetchService(
          `${ORDER_SERVICE_URL}/api/orders`,
          authorization
        );

        /*
         * Support both possible response formats:
         *
         * 1. [...]
         *
         * 2. { data: [...] }
         */

        orders = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        console.log(
          "ADMIN ORDERS COUNT:",
          orders.length
        );
      }

      /* ===================================================
         BD
      =================================================== */

      else {
        if (!userEmail) {
          return NextResponse.json(
            {
              error:
                "BD email is missing from authentication token.",
            },
            { status: 401 }
          );
        }

        const ordersUrl =
          `${ORDER_SERVICE_URL}/api/orders/by-referral-email?email=${encodeURIComponent(
            userEmail
          )}`;

        console.log(
          "BD: Fetching orders for:",
          userEmail
        );

        console.log(
          "BD ORDERS URL:",
          ordersUrl
        );

        const result = await fetchService(
          ordersUrl,
          authorization
        );

        /*
         * Your actual Order Service response is:
         *
         * [
         *   {
         *     id: 4,
         *     quoteNumber: "...",
         *     referralEmail: "...",
         *     ...
         *   }
         * ]
         *
         * So result itself is the array.
         */

        orders = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        console.log(
          "BD ORDERS RESPONSE:",
          result
        );

        console.log(
          "BD ORDERS COUNT:",
          orders.length
        );
      }
    } catch (error) {
      console.error(
        "Order service error:",
        error
      );

      /*
       * Do not pretend that a backend error means
       * there are zero orders.
       */
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to fetch orders.",
        },
        { status: 502 }
      );
    }

    /* =====================================================
       METRICS
    ===================================================== */

    const metrics = {
      total: orders.length,

      open: orders.filter(
        (order) =>
          ![
            "DELIVERED",
            "CANCELLED",
          ].includes(
            String(
              order.status
            ).toUpperCase()
          )
      ).length,

      delivered: orders.filter(
        (order) =>
          String(
            order.status
          ).toUpperCase() ===
          "DELIVERED"
      ).length,

      revenue: orders
        .filter(
          (order) =>
            String(
              order.status
            ).toUpperCase() ===
            "DELIVERED"
        )
        .reduce(
          (sum, order) =>
            sum +
            Number(
              order.total || 0
            ),
          0
        ),
    };

    console.log(
      "FINAL ORDERS COUNT:",
      orders.length
    );

    console.log(
      "METRICS:",
      metrics
    );

    /* =====================================================
       DASHBOARD RESPONSE
    ===================================================== */

    const response: Record<
      string,
      unknown
    > = {
      profile,

      /*
       * StaffDashboard expects quotes.
       * Keep orders too for compatibility.
       */

      orders,

      quotes: orders,

      metrics,
    };

    /* =====================================================
       ADMIN DATA
       TEAM + PRODUCTS + FLAVOURS
    ===================================================== */

    if (role === "ADMIN") {
      const [
        teamResult,
        productsResult,
      ] = await Promise.allSettled([
        fetchService(
          `${AUTH_SERVICE_URL}/api/auth/staff`,
          authorization
        ),

        fetchService(
          `${PRODUCT_SERVICE_URL}/api/products`,
          authorization
        ),
      ]);

      /* ===================================================
         TEAM
      =================================================== */

      if (
        teamResult.status ===
        "fulfilled"
      ) {
        response.team =
          Array.isArray(
            teamResult.value
          )
            ? teamResult.value
            : [];
      } else {
        console.error(
          "Auth service error:",
          teamResult.reason
        );

        response.team = [];
      }

      /* ===================================================
         PRODUCTS + FLAVOURS
      =================================================== */

      if (
        productsResult.status ===
        "fulfilled"
      ) {
        const products =
          Array.isArray(
            productsResult.value
          )
            ? productsResult.value
            : [];

        response.products =
          products;

        response.flavours =
          products.flatMap(
            (product: any) =>
              Array.isArray(
                product.flavours
              )
                ? product.flavours.map(
                    (flavour: any) => ({
                      ...flavour,

                      productId:
                        flavour.productId ??
                        product.id,
                    })
                  )
                : []
          );
      } else {
        console.error(
          "Product service error:",
          productsResult.reason
        );

        response.products = [];
        response.flavours = [];
      }
    }

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return NextResponse.json(
      response
    );
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard.",
      },
      { status: 500 }
    );
  }
}
