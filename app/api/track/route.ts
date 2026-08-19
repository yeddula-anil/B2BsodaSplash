import { NextResponse } from "next/server";

const GATEWAY_URL =
  process.env.NEXT_API_GATEWAY_URL || "http://localhost:8080";

export async function GET(request: Request) {
  try {
    // =====================================================
    // GET EMAIL
    // =====================================================

    const { searchParams } =
      new URL(request.url);

    const email =
      searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }


    // =====================================================
    // GET AUTHORIZATION HEADER
    // =====================================================

    const authorization =
      request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }


    // =====================================================
    // ENCODE EMAIL
    // =====================================================

    const encodedEmail =
      encodeURIComponent(email);


    // =====================================================
    // GATEWAY URL
    // =====================================================

    const gatewayUrl =
      `${GATEWAY_URL}/api/orders/by-email?email=${encodedEmail}`;


    console.log(
      "Fetching orders from:",
      gatewayUrl
    );


    // =====================================================
    // CALL GATEWAY
    // =====================================================

    const response =
      await fetch(
        gatewayUrl,
        {
          method: "GET",

          headers: {
            Authorization: authorization,
            Accept: "application/json",
          },

          cache: "no-store",
        }
      );


    // =====================================================
    // PARSE RESPONSE
    // =====================================================

    const data =
      await response
        .json()
        .catch(() => null);


    // =====================================================
    // ERROR RESPONSE
    // =====================================================

    if (!response.ok) {

      console.error(
        "Gateway order request failed:",
        response.status,
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error ||
            data?.message ||
            "Unable to fetch orders.",
        },
        {
          status: response.status,
        }
      );
    }


    // =====================================================
    // SUCCESS
    // =====================================================

    return NextResponse.json(
      Array.isArray(data)
        ? data
        : []
    );

  } catch (error) {

    console.error(
      "Track orders API error:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Unable to connect to the order service.",
      },
      {
        status: 500,
      }
    );
  }
}