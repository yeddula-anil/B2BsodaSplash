import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:8080";

function getAuthorization(request: Request) {
  return request.headers.get("authorization") || "";
}

async function productRequest(
  request: Request,
  url: string,
  options: RequestInit = {}
) {
  const authorization = getAuthorization(request);

  if (!authorization) {
    return NextResponse.json(
      { error: "Authorization token is required." },
      { status: 401 }
    );
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      ...(options.headers || {})
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
          "Product service request failed."
      },
      { status: response.status }
    );
  }

  return data;
}

// GET ALL PRODUCTS
export async function GET(request: Request) {
  try {
    const data = await productRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products`
    );

    if (data instanceof NextResponse) {
      return data;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get products error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// CREATE PRODUCT
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      imageUrl?: string;
      displayOrder?: number;
      isActive?: boolean;
    };

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const data = await productRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          description: body.description?.trim() || null,
          imageUrl: body.imageUrl?.trim() || null,
          displayOrder:
            Number.isFinite(Number(body.displayOrder))
              ? Math.max(0, Math.round(Number(body.displayOrder)))
              : 0,
          isActive:
            typeof body.isActive === "boolean"
              ? body.isActive
              : true
        })
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json(
      { product: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// UPDATE PRODUCT
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: number;
      name?: string;
      description?: string;
      imageUrl?: string;
      displayOrder?: number;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Product id is required." },
        { status: 400 }
      );
    }

    const data = await productRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: body.name?.trim(),
          description: body.description?.trim() || null,
          imageUrl: body.imageUrl?.trim() || null,
          displayOrder:
            body.displayOrder !== undefined
              ? Math.max(
                  0,
                  Math.round(Number(body.displayOrder) || 0)
                )
              : 0,
          isActive:
            typeof body.isActive === "boolean"
              ? body.isActive
              : true
        })
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json({
      product: data
    });
  } catch (error) {
    console.error("Update product error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// TOGGLE PRODUCT STATUS
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: number;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Product id is required." },
        { status: 400 }
      );
    }

    const data = await productRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.id}/toggle-status`,
      {
        method: "PATCH"
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json({
      product: data
    });
  } catch (error) {
    console.error("Toggle product error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// DELETE PRODUCT
export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: number;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Product id is required." },
        { status: 400 }
      );
    }

    const data = await productRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.id}`,
      {
        method: "DELETE"
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}