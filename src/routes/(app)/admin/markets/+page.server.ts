// src/routes/(app)/admin/markets/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { env as publicEnv } from "$env/dynamic/public";

const API_BASE = publicEnv.PUBLIC_API_BASE || "/api";

async function j<T>(fetchFn: typeof fetch, path: string, init?: RequestInit) {
  const res = await fetchFn(`${API_BASE}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export const load: PageServerLoad = async ({ fetch }) => {
  const markets = await j<any[]>(fetch, "/markets");
  return { markets };
};

export const actions: Actions = {
  // Create market
  create: async ({ request, fetch }) => {
    const fd = await request.formData();
    const payload = {
      title: (fd.get("title") as string) || "",
      description: (fd.get("description") as string) || null,
      category: (fd.get("category") as string) || null,
      image_url: (fd.get("image_url") as string) || null,
      close_at: (fd.get("close_at") as string) || null,
      status: (fd.get("status") as string) || "open",
    };
    await j<any>(fetch, "/markets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true };
  },

  // Update market (send only changed fields from your form)
  update: async ({ request, fetch }) => {
    const fd = await request.formData();
    const id = fd.get("id") as string;
    const payload: Record<string, any> = {};
    [
      "title",
      "description",
      "category",
      "image_url",
      "close_at",
      "status",
    ].forEach((k) => {
      const v = fd.get(k);
      if (v !== null && v !== "") payload[k] = v;
    });
    await j<any>(fetch, `/markets/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { ok: true };
  },

  // Close market (status -> closed)
  close: async ({ request, fetch }) => {
    const fd = await request.formData();
    const id = fd.get("id") as string;
    await j<any>(fetch, `/markets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "closed" }),
    });
    return { ok: true };
  },

  // Delete market
  delete: async ({ request, fetch }) => {
    const fd = await request.formData();
    const id = fd.get("id") as string;
    const res = await fetch(`${API_BASE}/markets/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return { ok: true };
  },

  // Outcomes (optional quick hooks)
  add_outcome: async ({ request, fetch }) => {
    const fd = await request.formData();
    const market_id = fd.get("market_id") as string;
    const payload = {
      label: (fd.get("label") as string) || "",
      price_cents: fd.get("price_cents") ? Number(fd.get("price_cents")) : null,
      status: (fd.get("status") as string) || "open",
    };
    await j<any>(fetch, `/markets/${market_id}/outcomes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true };
  },

  update_outcome: async ({ request, fetch }) => {
    const fd = await request.formData();
    const market_id = fd.get("market_id") as string;
    const outcome_id = fd.get("outcome_id") as string;
    const payload: Record<string, any> = {};
    ["label", "status"].forEach((k) => {
      const v = fd.get(k);
      if (v !== null && v !== "") payload[k] = v;
    });
    if (fd.get("price_cents"))
      payload.price_cents = Number(fd.get("price_cents"));
    await j<any>(fetch, `/markets/${market_id}/outcomes/${outcome_id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { ok: true };
  },

  delete_outcome: async ({ request, fetch }) => {
    const fd = await request.formData();
    const market_id = fd.get("market_id") as string;
    const outcome_id = fd.get("outcome_id") as string;
    const res = await fetch(
      `${API_BASE}/markets/${market_id}/outcomes/${outcome_id}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return { ok: true };
  },
};
