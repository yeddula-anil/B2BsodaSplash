import { NextResponse } from "next/server";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:8080";

function getAuthorization(request: Request) {
  return request.headers.get("authorization") || "";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorization = getAuthorization(request);

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization token is required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    let endpoint: string;

    if (action === "status") {
      endpoint =
        `${AUTH_SERVICE_URL}/api/auth/users/${id}/toggle-status`;
    } else if (action === "role") {
      endpoint =
        `${AUTH_SERVICE_URL}/api/auth/users/${id}/toggle-role`;
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use status or role." },
        { status: 400 }
      );
    }

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Failed to update staff."
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update staff error:", error);

    return NextResponse.json(
      { error: "Auth service is unavailable." },
      { status: 503 }
    );
  }
}