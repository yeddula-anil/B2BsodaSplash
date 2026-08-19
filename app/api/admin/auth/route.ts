import { NextResponse } from "next/server";

const AUTH_SERVICE_URL =
  process.env.NEXT_API_GATEWAY_URL || "http://localhost:8080";

function getAuthorization(request: Request) {
  return request.headers.get("authorization") || "";
}

// GET ALL STAFF
export async function GET(request: Request) {
  try {
    const authorization = getAuthorization(request);

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization token is required." },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${AUTH_SERVICE_URL}/api/auth/staff`,
      {
        method: "GET",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json"
        },
        cache: "no-store"
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Failed to fetch staff."
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get staff error:", error);

    return NextResponse.json(
      { error: "Auth service is unavailable." },
      { status: 503 }
    );
  }
}

// CREATE STAFF
export async function POST(request: Request) {
  try {
    const authorization = getAuthorization(request);

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization token is required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const role =
      body.role?.toUpperCase() === "ADMIN"
        ? "ADMIN"
        : "BD";

    const response = await fetch(
      `${AUTH_SERVICE_URL}/api/auth/staff`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: body.username,
          email: body.email,
          password: body.password,
          role
        }),
        cache: "no-store"
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Failed to create staff."
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      data,
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);

    return NextResponse.json(
      { error: "Auth service is unavailable." },
      { status: 503 }
    );
  }
}