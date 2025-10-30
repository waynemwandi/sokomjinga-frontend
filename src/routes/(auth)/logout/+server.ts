import type { RequestHandler } from "./$types";
import { redirect } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ cookies, request }) => {
  // names & path MUST match how you set them on login
  cookies.delete("access_token", { path: "/" });
  cookies.delete("refresh_token", { path: "/" });

  // bounce back to wherever the user was (or home)
  const back = request.headers.get("referer") ?? "/";
  throw redirect(303, back);
};
