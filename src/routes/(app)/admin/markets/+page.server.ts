// src/routes/(app)/admin/markets/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { Markets, Outcomes } from "$lib/api.server"; // <-- server-only client

export const load: PageServerLoad = async () => {
  const markets = await Markets.list();
  return { markets };
};

export const actions: Actions = {
  // Create market
  create: async ({ request }) => {
    const fd = await request.formData();
    const payload = {
      title: (fd.get("title") as string) || "",
      description: (fd.get("description") as string) || null,
      category: (fd.get("category") as string) || null,
      image_url: (fd.get("image_url") as string) || null,
      close_at: (fd.get("close_at") as string) || null,
      status: (fd.get("status") as string) || "open",
    };
    await Markets.create(payload);
    return { ok: true };
  },

  // Update market (send only changed fields from your form)
  update: async ({ request }) => {
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
    await Markets.update(id, payload);
    return { ok: true };
  },

  // Close market (status -> closed)
  close: async ({ request }) => {
    const fd = await request.formData();
    const id = fd.get("id") as string;
    await Markets.close(id);
    return { ok: true };
  },

  // Delete market
  delete: async ({ request }) => {
    const fd = await request.formData();
    const id = fd.get("id") as string;
    await Markets.del(id);
    return { ok: true };
  },

  // Outcomes
  add_outcome: async ({ request }) => {
    const fd = await request.formData();
    const market_id = fd.get("market_id") as string;
    const payload = {
      label: (fd.get("label") as string) || "",
      price_cents: fd.get("price_cents") ? Number(fd.get("price_cents")) : null,
      status: (fd.get("status") as string) || "open",
    };
    await Outcomes.create(market_id, payload);
    return { ok: true };
  },

  update_outcome: async ({ request }) => {
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
    await Outcomes.update(market_id, outcome_id, payload);
    return { ok: true };
  },

  delete_outcome: async ({ request }) => {
    const fd = await request.formData();
    const market_id = fd.get("market_id") as string;
    const outcome_id = fd.get("outcome_id") as string;
    await Outcomes.del(market_id, outcome_id);
    return { ok: true };
  },
};
