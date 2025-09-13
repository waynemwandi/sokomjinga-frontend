import type { PageServerLoad } from "./$types";
import { PUBLIC_API_BASE } from "$env/static/public";

export const load: PageServerLoad = async ({ locals }) => {
  // TODO: const isAuthed = Boolean(locals.user); // later, when you wire auth
  const isAuthed = false;

  // Fetch /markets endpoint
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/markets`);
    const markets = await res.json();
    return { isAuthed, markets };
  } catch {
    return { isAuthed, markets: [] };
  }
};
