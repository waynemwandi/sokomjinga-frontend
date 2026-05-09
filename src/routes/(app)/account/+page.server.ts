// src/routes/(app)/account/+page.server.ts
import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { Auth, Me, getJSON } from "$lib/api.server";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import type { Actions } from "./$types";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
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

  const PAGE_SIZE = 10;
  const page = Number(url.searchParams.get("page") ?? "0");
  const offset = page * PAGE_SIZE;

  try {
    // Fetch everything in parallel via helpers
    const [user, positions, profile, statementRes] = await Promise.all([
      Auth.me({ headers }),
      Me.positions({ headers }),
      getJSON("/profile/me", { headers }),
      fetch(`${BASE}/wallet/statement?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers,
      }),
    ]);

    const statement = statementRes.ok
      ? await statementRes.json().catch(() => ({ items: [], total: 0 }))
      : { items: [], total: 0 };

    const openDeposit = url.searchParams.get("deposit");

    return {
      user,
      positions,
      profile,
      statement,
      openDeposit,
      page,
      pageSize: PAGE_SIZE,
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
  username: async ({ request, locals }) => {
    const token = locals.accessToken;

    if (!token) {
      throw redirect(302, "/login");
    }

    const formData = await request.formData();
    const username = formData.get("username");

    if (!username || typeof username !== "string") {
      return { success: false, field: "username", message: "Username is required" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(
        `${process.env.PRIVATE_API_BASE || "http://127.0.0.1:8000"}/profile/me`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ username }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        let message = text || "Failed to update profile";
        try {
          const parsed = JSON.parse(text);
          message = parsed.detail || message;
        } catch {
          // Keep the raw server response when it is not JSON.
        }
        return {
          success: false,
          field: "username",
          message,
        };
      }

      return { success: true, field: "username", message: "Username updated" };
    } catch (e: any) {
      return {
        success: false,
        field: "username",
        message: e?.message ?? "Failed to update username",
      };
    }
  },

  phone: async ({ request, locals }) => {
    const token = locals.accessToken;

    if (!token) {
      throw redirect(302, "/login");
    }

    const formData = await request.formData();
    const phone = formData.get("phone");

    if (!phone || typeof phone !== "string") {
      return { success: false, field: "phone", message: "Phone is required" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(
        `${process.env.PRIVATE_API_BASE || "http://127.0.0.1:8000"}/profile/me`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ phone_e164: phone }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        let message = text || "Failed to update phone";
        try {
          const parsed = JSON.parse(text);
          message = parsed.detail || message;
        } catch {
          // Keep the raw server response when it is not JSON.
        }
        return {
          success: false,
          field: "phone",
          message,
        };
      }

      return { success: true, field: "phone", message: "Phone updated" };
    } catch (e: any) {
      return {
        success: false,
        field: "phone",
        message: e?.message ?? "Failed to update phone",
      };
    }
  },

  bio: async ({ request, locals }) => {
    const token = locals.accessToken;

    if (!token) {
      throw redirect(302, "/login");
    }

    const formData = await request.formData();
    const bio = formData.get("bio");

    if (typeof bio !== "string") {
      return {
        success: false,
        field: "bio",
        message: "Public profile is required",
      };
    }

    if (bio.length > 280) {
      return {
        success: false,
        field: "bio",
        message: "Public profile must be 280 characters or less",
      };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(
        `${process.env.PRIVATE_API_BASE || "http://127.0.0.1:8000"}/profile/me`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ bio }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        let message = text || "Failed to update public profile";
        try {
          const parsed = JSON.parse(text);
          message = parsed.detail || message;
        } catch {
          // Keep the raw server response when it is not JSON.
        }
        return {
          success: false,
          field: "bio",
          message,
        };
      }

      return {
        success: true,
        field: "bio",
        message: "Public profile updated",
      };
    } catch (e: any) {
      return {
        success: false,
        field: "bio",
        message: e?.message ?? "Failed to update public profile",
      };
    }
  },
};
