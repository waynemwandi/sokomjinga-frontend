// src/routes/(app)/account/+page.server.ts
import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { Auth, Me } from "$lib/api.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const token = locals.accessToken;

  // must be logged in
  if (!token) {
    const redirectTo = encodeURIComponent(url.pathname);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };

  try {
    // Fetch everything in parallel via helpers
    const [user, stats, bets, positions] = await Promise.all([
      Auth.me({ headers }),
      Me.stats({ headers }),
      Me.bets({ headers }),
      Me.positions({ headers }),
    ]);

    return {
      user,
      stats,
      bets,
      positions,
    };
  } catch (e: any) {
    // If auth fails specifically, redirect
    if (e instanceof Error && e.message.startsWith("401")) {
      const redirectTo = encodeURIComponent(url.pathname);
      throw redirect(302, `/login?redirect=${redirectTo}`);
    }

    throw error(
      500,
      `Failed to load profile: ${e?.message || "Unknown error"}`
    );
  }
};
