import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // If user is accessing protected routes without session, redirect to login
  const isAuthRoute = url.pathname.startsWith("/login");
  const isDashboardRoute = url.pathname.startsWith("/staff") || url.pathname.startsWith("/manager");

  if (!user && isDashboardRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is already logged in and visiting login page, redirect to appropriate dashboard
  if (user && isAuthRoute) {
    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "owner_manager") {
      url.pathname = "/manager";
    } else {
      url.pathname = "/staff";
    }
    return NextResponse.redirect(url);
  }

  // If user is staff but trying to access manager route, redirect to staff
  if (user && url.pathname.startsWith("/manager")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && profile.role !== "owner_manager") {
      url.pathname = "/staff";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
