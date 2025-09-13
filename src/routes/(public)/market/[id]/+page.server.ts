import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { API_BASE } from "$lib/api";

export const load: PageServerLoad = async ({ params, fetch }) => {
  const res = await fetch(`${API_BASE}/markets/${params.id}`);
  if (!res.ok) {
    throw error(res.status, "Market not found");
  }

  const market = await res.json(); // if your API returns { ... , outcomes: [...] }
  return {
    market,
    outcomes: market.outcomes ?? [], // always present -> consistent PageData
  };
};
