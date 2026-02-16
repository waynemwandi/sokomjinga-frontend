// src/routes/(app)/account/+page.server.ts
import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { Auth, Me, getJSON } from "$lib/api.server";
import type { Actions } from "./$types";

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
    const [user, stats, bets, positions, profile] = await Promise.all([
      Auth.me({ headers }),
      Me.stats({ headers }),
      Me.bets({ headers }),
      Me.positions({ headers }),
      getJSON("/profile/me", { headers }),
    ]);

    return {
      user,
      stats,
      bets,
      positions,
      profile,
    };
  } catch (e: any) {
    // If auth fails specifically, redirect
    if (e instanceof Error && e.message.startsWith("401")) {
      const redirectTo = encodeURIComponent(url.pathname);
      throw redirect(302, `/login?redirect=${redirectTo}`);
    }

    throw error(
      500,
      `Failed to load profile: ${e?.message || "Unknown error"}`,
    );
  }
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const token = locals.accessToken;

    if (!token) {
      throw redirect(302, "/login");
    }

    const formData = await request.formData();
    const phone = formData.get("phone");

    if (!phone || typeof phone !== "string") {
      return { success: false, message: "Phone is required" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(
        `${process.env.PRIVATE_API_BASE || "http://127.0.0.1:8000"}/profile/phone`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ phone_e164: phone }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          message: text || "Failed to update phone",
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: e?.message ?? "Failed to update phone",
      };
    }
  },
};
