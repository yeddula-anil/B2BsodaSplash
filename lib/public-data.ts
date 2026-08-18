import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "./supabase";
import { defaultFlavours, defaultProducts, type PublicFlavour, type PublicProduct } from "./flavours";

const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  display_order: number | null;
};

type TeamMember = {
  id: string;
  name: string;
};

async function loadCatalogFromSupabase() {
  // If a product microservice is configured, prefer it
  if (PRODUCT_SERVICE) {
    try {
      const res = await fetch(`${PRODUCT_SERVICE.replace(/\/$/, "")}/products`);
      if (!res.ok) throw new Error("Product service returned error");
      const data = await res.json();
      // Expecting data.products or data
      const products = data.products ?? data;
      if (!Array.isArray(products) || products.length === 0) return [] as PublicProduct[];
      // Normalize to PublicProduct shape if necessary
      return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        image_url: p.image_url ?? p.imageUrl ?? null,
        display_order: p.display_order ?? p.displayOrder ?? 0,
        flavours: (p.flavours ?? p.items ?? []).map((f: any) => ({
          id: f.id,
          product_id: f.product_id ?? p.id,
          name: f.name,
          note: f.note ?? "",
          price_per_case: f.price_per_case ?? f.pricePerCase ?? 0,
          display_order: f.display_order ?? f.displayOrder ?? 0,
          color: f.color ?? "#2e6fb8"
        }))
      } as PublicProduct));
    } catch {
      // fallback to supabase path below
    }
  }

  const supabase = createSupabaseAdminClient();

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,description,image_url,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (productError) {
    throw productError;
  }

  const productRows = (products ?? []) as ProductRow[];
  if (!productRows.length) {
    return [] as PublicProduct[];
  }

  const { data: flavours, error: flavourError } = await supabase
    .from("flavours")
    .select("id,product_id,name,note,price_per_case,display_order,color")
    .in("product_id", productRows.map((product) => product.id))
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (flavourError) {
    throw flavourError;
  }

  const flavoursByProduct = new Map<string, PublicFlavour[]>();
  for (const flavour of (flavours ?? []) as PublicFlavour[]) {
    if (!flavour.product_id) continue;
    flavoursByProduct.set(flavour.product_id, [...(flavoursByProduct.get(flavour.product_id) ?? []), flavour]);
  }

  return productRows.map((product) => {
    const productFlavours = flavoursByProduct.get(product.id) ?? [];

    return {
      id: product.id,
      name: product.name === "SodaSplash" ? "Goli Soda" : product.name,
      description: product.name === "SodaSplash" ? "Classic marble soda bottles supplied by the case." : product.description,
      image_url: product.image_url ?? null,
      display_order: product.display_order ?? 0,
      flavours: productFlavours
    };
  });
}

export async function loadPublicProducts() {
  try {
    const catalog = await getCachedPublicProducts();
    return catalog.length ? catalog : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export async function loadPublicFlavours() {
  const products = await loadPublicProducts();
  return products.flatMap((product) => product.flavours);
}

export async function loadPublicTeam() {
  if (AUTH_SERVICE) {
    try {
      const res = await fetch(`${AUTH_SERVICE.replace(/\/$/, "")}/auth/users/bd`);
      if (!res.ok) throw new Error("Team service error");
      const data = await res.json();
      const team = Array.isArray(data) ? data : data.data ?? [];
      return team.map((member: any) => ({
        id: String(member.id),
        name: member.username || member.name || member.email,
        email: member.email
      }));
    } catch {
      // fallback to supabase
    }
  }

  try {
    return await getCachedPublicTeam();
  } catch {
    return [] as TeamMember[];
  }
}

const getCachedPublicProducts = unstable_cache(
  async () => {
    const catalog = await loadCatalogFromSupabase();
    return catalog.length ? catalog : defaultProducts;
  },
  ["public-products"],
  {
    revalidate: 60,
    tags: ["public-catalog"]
  }
);

const getCachedPublicTeam = unstable_cache(
  async () => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("role", "bd")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      return [] as TeamMember[];
    }

    return (data ?? []).map((member) => ({
      id: member.id,
      name: member.full_name || member.email
    }));
  },
  ["public-team"],
  {
    revalidate: 60,
    tags: ["public-team"]
  }
);
