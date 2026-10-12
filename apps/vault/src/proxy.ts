import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pending: Array<{
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }> = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value);
            pending.push(cookie);
          });
        },
      },
    },
  );
  await supabase.auth.getUser();
  let response = NextResponse.next({ request });
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (basePath && request.nextUrl.basePath !== basePath) {
    const url = request.nextUrl.clone();
    url.pathname = basePath + request.nextUrl.pathname;
    response = NextResponse.rewrite(url, { request });
  }
  pending.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
