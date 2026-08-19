import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_API_GATEWAY_URL || "http://localhost:8080";

function getAuthorization(request: Request) {
  return request.headers.get("authorization") || "";
}

async function flavourRequest(
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
          "Flavour service request failed."
      },
      { status: response.status }
    );
  }

  return data;
}

// GET FLAVOURS
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (productId) {
      const data = await flavourRequest(
        request,
        `${PRODUCT_SERVICE_URL}/api/products/${productId}/flavours`
      );

      if (data instanceof NextResponse) {
        return data;
      }

      return NextResponse.json(data);
    }

    // ProductResponse already contains flavours.
    // This avoids the duplicate @GetMapping problem
    // currently present in FlavourController.
    const products = await flavourRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products`
    );

    if (products instanceof NextResponse) {
      return products;
    }

    const flavours = Array.isArray(products)
      ? products.flatMap((product: any) =>
          Array.isArray(product.flavours)
            ? product.flavours.map((flavour: any) => ({
                ...flavour,
                productId: product.id
              }))
            : []
        )
      : [];

    return NextResponse.json(flavours);
  } catch (error) {
    console.error("Get flavours error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// CREATE FLAVOUR
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: number;
      name?: string;
      note?: string;
      color?: string;
      pricePerCase?: number;
      displayOrder?: number;
      isActive?: boolean;
      emoji?: string;
    };

    if (!body.productId) {
      return NextResponse.json(
        { error: "Product id is required." },
        { status: 400 }
      );
    }

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Flavour name is required." },
        { status: 400 }
      );
    }

    const data = await flavourRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.productId}/flavours`,
      {
        method: "POST",
        body: JSON.stringify({
          name: body.name.trim(),
          note: body.note?.trim() || null,
          color: body.color?.trim() || null,
          pricePerCase: body.pricePerCase,
          displayOrder: body.displayOrder ?? 0,
          isActive:
            typeof body.isActive === "boolean"
              ? body.isActive
              : true,
          emoji: body.emoji?.trim() || null
        })
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json(
      { flavour: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create flavour error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// UPDATE FLAVOUR
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: number;
      id?: number;
      name?: string;
      note?: string;
      color?: string;
      pricePerCase?: number;
      displayOrder?: number;
      isActive?: boolean;
      emoji?: string;
    };

    if (!body.productId || !body.id) {
      return NextResponse.json(
        { error: "Product id and flavour id are required." },
        { status: 400 }
      );
    }

    const data = await flavourRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.productId}/flavours/${body.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: body.name?.trim(),
          note: body.note?.trim() || null,
          color: body.color?.trim() || null,
          pricePerCase: body.pricePerCase,
          displayOrder: body.displayOrder ?? 0,
          isActive:
            typeof body.isActive === "boolean"
              ? body.isActive
              : true,
          emoji: body.emoji?.trim() || null
        })
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json({
      flavour: data
    });
  } catch (error) {
    console.error("Update flavour error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// TOGGLE FLAVOUR STATUS
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: number;
      id?: number;
    };

    if (!body.productId || !body.id) {
      return NextResponse.json(
        { error: "Product id and flavour id are required." },
        { status: 400 }
      );
    }

    const data = await flavourRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.productId}/flavours/${body.id}/toggle-status`,
      {
        method: "PATCH"
      }
    );

    if (data instanceof NextResponse) {
      return data;
    }

    revalidateTag("public-catalog", "default");

    return NextResponse.json({
      flavour: data
    });
  } catch (error) {
    console.error("Toggle flavour error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}

// DELETE FLAVOUR
export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: number;
      id?: number;
    };

    if (!body.productId || !body.id) {
      return NextResponse.json(
        { error: "Product id and flavour id are required." },
        { status: 400 }
      );
    }

    const data = await flavourRequest(
      request,
      `${PRODUCT_SERVICE_URL}/api/products/${body.productId}/flavours/${body.id}`,
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
    console.error("Delete flavour error:", error);

    return NextResponse.json(
      { error: "Product service is unavailable." },
      { status: 503 }
    );
  }
}